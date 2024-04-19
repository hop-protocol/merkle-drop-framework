import 'dotenv/config'
import { readdir } from 'fs/promises'
import fs from 'fs'
import fse from 'fs-extra'
import path from 'path'
import globby from 'globby'
import { ShardedMerkleTree } from './merkle.js'
import simpleGit_, { SimpleGit } from 'simple-git'
import { Signer, constants, Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils.js'
import merkleRewardsAbi from './abi/MerkleRewards.json' assert { type: "json" }
import tokenAbi from './abi/ERC20.json' assert { type: "json" }
import { forumPost } from './forumPost.js'
import { DateTime } from 'luxon'
import { config } from './config.js'
import { Notifier } from './Notifier.js'
import { chainSlugToId } from './utils/chainSlugToId.js'
import { getChainSlugs } from './utils/getChainSlugs.js'
import { getDefaultRpcUrl } from './utils/getDefaultRpcUrl.js'

const simpleGit = (simpleGit_ as any).default || simpleGit_

const cachePromises : any = {}
const cacheTimestamps : any = {}

export class Controller {
  network: string
  rewardsContractAddress: string
  contract: Contract
  signer: Signer
  signerOrProvider: Signer | providers.Provider
  checkpointIntervalMs: number
  rpcUrls: Record<string, any> = {}
  publicRpcUrls: Record<string, any> = {}
  publicRpcProviders: Record<string, any> = {}
  notifier: Notifier
  rewardsDataOutputGit : SimpleGit
  lastPull : Record<string, any> = {}
  tokenAddress: string
  tokenSymbol: string
  tokenContract: Contract
  lastCheckpointMs = 0
  lastCheckpointMsCheckExpiresAt = 0
  onchainRoot: string
  onchainRootCheckExpiresAt: number
  withdrawnCache : Record<string, any> = {}
  withdrawnCacheCheckExpiresAt : Record<string, any> = {}
  shardedMerkleTreeCache: Record<string, ShardedMerkleTree> = {}
  shardedMerkleTreeProofCache: Record<string, any> = {}
  rewardsContractNetwork: string
  startTimestamp: number

  constructor (network: string = config.network, rewardsContractAddress: string = config.rewardsContractAddress, rewardsContractNetwork = config.rewardsContractNetwork) {
    if (!network) {
      throw new Error('NETWORK is required')
    }

    const chains = getChainSlugs(network)

    if (!rewardsContractAddress) {
      throw new Error('REWARDS_CONTRACT_ADDRESS is required')
    }

    if (!rewardsContractNetwork) {
      throw new Error('REWARDS_CONTRACT_NETWORK is required')
    }

    for (const chain of chains) {
      this.rpcUrls[chain] = process.env[`${chain?.toUpperCase()}_RPC_URL`] || getDefaultRpcUrl(network, chain)
    }

    if (!this.rpcUrls[rewardsContractNetwork]) {
      throw new Error(`invalid rewardsContractNetwork "${rewardsContractNetwork}", no rpcUrl found`)
    }

    console.log('rpcUrls', this.rpcUrls)

    for (const chain of chains) {
      this.publicRpcUrls[chain] = process.env[`PUBLIC_${chain?.toUpperCase()}_RPC_URL`]
    }

    for (const chain of chains) {
      this.publicRpcProviders[chain] = this.publicRpcUrls[chain] ? new providers.StaticJsonRpcProvider({ allowGzip: true, url: this.publicRpcUrls[chain] }) : null
    }

    const provider = new providers.StaticJsonRpcProvider({ allowGzip: true, url: this.rpcUrls[rewardsContractNetwork] })

    let signer : Signer
    if (config.privateKey) {
      signer = new Wallet(config.privateKey, provider)
    }

    const signerOrProvider : Signer | providers.Provider = signer ?? provider
    this.contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signerOrProvider)
    this.signer = signer
    this.signerOrProvider = signerOrProvider
    this.network = network
    this.rewardsContractAddress = rewardsContractAddress
    this.rewardsContractNetwork = rewardsContractNetwork
    this.notifier = new Notifier()
  }

  async pullRewardsDataFromRepo () {
    if (!config.dataRepoPath) {
      throw new Error('DATA_REPO_PATH is required')
    }
    if (!config.rewardsDataGitUrl) {
      throw new Error('REWARDS_DATA_GIT_URL is required')
    }
    if (!config.rewardsDataOutputGitUrl) {
      throw new Error('REWARDS_DATA_OUTPUT_GIT_URL is required')
    }

    const git = simpleGit()

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    try {
      if (!fs.existsSync(path.resolve(config.outputRepoPath, '.git'))) {
        await git.clone(config.rewardsDataOutputGitUrl, config.outputRepoPath)
      }
    } catch (err) {
      console.error('rewardsDataOutputGitUrl clone error:', err)
    }

    try {
      if (!fs.existsSync(path.resolve(config.dataRepoPath, '.git'))) {
        await git.clone(config.rewardsDataGitUrl, config.dataRepoPath)
      }
    } catch (err) {
      console.log('rewardsDataGitUrl clone error:', err)
    }

    try {
      await git.cwd(config.dataRepoPath)
      await git.pull('origin', 'master')
    } catch (err) {
      console.log('pull error')
      throw err
    }

    console.log('done pulling data')
    return true
  }

  async fetchOutputRepoFirst () {
    if (!config.rewardsDataOutputGitUrl) {
      throw new Error('REWARDS_DATA_OUTPUT_GIT_URL is required')
    }

    const git = this.rewardsDataOutputGit ?? simpleGit()
    if (!this.rewardsDataOutputGit) {
      this.rewardsDataOutputGit = git
    }

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    try {
      if (!fs.existsSync(path.resolve(config.outputRepoPath, '.git'))) {
        await git.clone(config.rewardsDataOutputGitUrl, config.outputRepoPath)
      }
    } catch (err) {
      console.error('rewardsDataOutputGitUrl clone error:', err)
    }

    console.log('outputRepoPath:', config.outputRepoPath)

    try {
      await git.cwd(config.outputRepoPath)
    } catch (err) {
      console.log('clone error', err)
    }

    try {
      // console.log('rewardsDataOutputGitUrl:', config.rewardsDataOutputGitUrl)
      const gitConfig = await git.listConfig('local')
      if (gitConfig?.values?.['.git/config']?.['remote.origin.url'] !== config.rewardsDataOutputGitUrl) {
        await git.addRemote('origin', config.rewardsDataOutputGitUrl)
      }
    } catch (err) {
      // console.log('remote error', err)
    }
  }

  async pushOutputToRemoteRepo () {
    console.log('pushOutputToRemoteRepo')
    if (!config.rewardsDataOutputGitUrl) {
      throw new Error('rewardsDataOutputGitUrl required')
    }
    const git = this.rewardsDataOutputGit ?? simpleGit()
    if (!this.rewardsDataOutputGit) {
      this.rewardsDataOutputGit = git
    }

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    console.log('outputRepoPath:', config.outputRepoPath)

    try {
      await git.cwd(config.outputRepoPath)
    } catch (err) {
      console.log('clone error', err)
    }

    try {
      // console.log('rewardsDataOutputGitUrl:', config.rewardsDataOutputGitUrl)
      const gitConfig = await git.getConfig('local')
      if (gitConfig?.values?.['.git/config']?.['remote.origin.url'] !== config.rewardsDataOutputGitUrl) {
        await git.addRemote('origin', config.rewardsDataOutputGitUrl)
      }
    } catch (err) {
      // console.log('remote error', err)
    }

    try {
      await git.checkout(['-b', 'master'])
    } catch (err) {
      console.log('checkout error', err.message)
    }

    try {
      const emailConfig = await git.getConfig('user.email')
      if (!emailConfig.value || process.env.GIT_USER_EMAIL) {
        await git.addConfig('user.email', process.env.GIT_USER_EMAIL, false, 'local')
      }
      const nameConfig = await git.getConfig('user.name')
      if (!nameConfig.value || process.env.GIT_USER_NAME) {
        await git.addConfig('user.name', process.env.GIT_USER_NAME, false, 'local')
      }
    } catch (err) {
      console.log('config error', err)
    }

    try {
      await git.pull('origin', 'master')
    } catch (err) {
      console.log('pull error', err)
      // throw err
    }

    await git.add('*')

    await git.commit('Update data')

    let alreadyUpdated = false
    try {
      const res = await git.push('origin', 'master')
      alreadyUpdated = res.pushed?.[0]?.alreadyUpdated ?? false
    } catch (err) {
      console.log('push error', err)
      throw err
    }
    console.log('done pushing merkle data')
    const githubUrl = this.getSanitizedGithubUrl(config.rewardsDataOutputGitUrl)
    return { alreadyUpdated, githubUrl }
  }

  async generateRoot (options: any = {}) {
    let shouldWrite = true
    if (options.shouldWrite === false) {
      shouldWrite = false
    }

    const writeToPath = options.writePath ?? config.outputRepoPath

    const { data } = await this.getData(options)

    const totalAccounts = new Set([])
    let sum = BigNumber.from(0)
    for (const addr in data) {
      totalAccounts.add(addr)
      sum = sum.add(BigNumber.from(data[addr]))
    }

    // console.log('sum:', sum.toString())

    const json: any[] = []
    for (const address in data) {
      json.push([address, { balance: data[address] }])
    }

    const shardNybbles = 2
    let outDirectory : any
    if (shouldWrite) {
      outDirectory = path.resolve(writeToPath, 'data')
      if (fs.existsSync(outDirectory) && outDirectory.startsWith('/tmp')) {
        fs.rmSync(outDirectory, { recursive: true, force: true })
      }
    }

    const { tree, total } = ShardedMerkleTree.build(json, shardNybbles, outDirectory)
    const rootHash = tree.getHexRoot()

    if (shouldWrite && rootHash !== '0x') {
      const renamedDir = path.resolve(writeToPath, tree.getHexRoot())
      if (!fs.existsSync(renamedDir)) {
        fs.renameSync(outDirectory, renamedDir)
      }
      if (fs.existsSync(outDirectory) && outDirectory.startsWith('/tmp')) {
        fs.rmSync(outDirectory, { recursive: true, force: true })
      }
      if (options.setLatest) {
        const latestFile = path.resolve(writeToPath, 'latest.json')
        fs.writeFileSync(latestFile, JSON.stringify({ root: rootHash }))
      }
    }
    const onchainPreviousTotalAmount = await this.contract.currentTotalRewards()
    // const additionalAmount = timestampRangeTotal
    console.log(rootHash)
    let calldata : any = {}
    if (rootHash !== '0x') {
      calldata = await this.contract.populateTransaction.setMerkleRoot(rootHash, total)
    }

    const totalFormatted = formatUnits(total.toString(), 18)

    return { rootHash, tree, total, totalFormatted, onchainPreviousTotalAmount, calldata, totalAccounts: totalAccounts.size }
  }

  async getToken (): Promise<Contract> {
    if (this.tokenContract) {
      return this.tokenContract
    }
    const tokenAddress = this.tokenAddress || await this.contract.rewardsToken()
    if (!tokenAddress || tokenAddress === '0x') {
      throw new Error('rewardToken address is not set')
    }
    if (!this.tokenAddress) {
      this.tokenAddress = tokenAddress
    }
    const token = new Contract(tokenAddress, tokenAbi, this.signerOrProvider)
    this.tokenContract = token
    return token
  }

  async getTokenSymbol () {
    if (this.tokenSymbol) {
      return this.tokenSymbol
    }
    const token = await this.getToken()
    const refundTokenSymbol = await token.symbol()
    if (!this.tokenSymbol) {
      this.tokenSymbol = refundTokenSymbol
    }
    return refundTokenSymbol
  }

  async setMerkleRoot (rootHash: string) {
    const rootJsonPath = path.resolve(config.outputRepoPath, rootHash, 'root.json')
    const { root, total } = JSON.parse(fs.readFileSync(rootJsonPath, { encoding: 'utf-8' }))
    const owner = await this.signer.getAddress()
    console.log(root, total)
    const totalBn = BigNumber.from(total)
    const token = await this.getToken()
    const balance = await token.balanceOf(owner)
    console.log('total', formatUnits(totalBn.toString(), 18))
    if (balance.lt(totalBn)) {
      console.log('balance', parseUnits(balance.toString(), 18))
      throw new Error('not enough balance')
    }
    const allowance = await token.allowance(owner, this.rewardsContractAddress)
    if (allowance.lt(totalBn)) {
      const t = await token.approve(this.rewardsContractAddress, constants.MaxUint256)
      console.log('approving', t.hash)
      await t.wait()
    }

    console.log('setting root')
    const tx = await this.contract.setMerkleRoot(root, total)
    console.log('sent', tx.hash)
    await tx.wait()
    console.log('done setting root onchain')
  }

  async claim (root: string, account: string) {
    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    const merkleDataPath = path.resolve(config.outputRepoPath, root)
    const shardedMerkleTree = ShardedMerkleTree.fromFiles(merkleDataPath)
    const [entry, proof] = await shardedMerkleTree.getProof(account)
    if (!entry) {
      throw new Error('no entry')
    }
    const totalAmount = BigNumber.from(entry.balance)

    console.log('claim')
    const tx = await this.contract.claim(account, totalAmount, proof)
    console.log('sent', tx.hash)
    await tx.wait()
    console.log('done claiming onchain')
  }

  async getRewardsForAccount (account: string) {
    if (!this.isStartTimestampReady()) {
      throw new Error('not ready yet')
    }

    if (!config.outputMerklePath) {
      throw new Error('OUTPUT_MERKLE_PATH is required')
    }

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    const onchainRoot = await this.getOnchainRoot()
    const outDirectory = path.resolve(config.outputMerklePath)
    const { root } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, 'latest.json'), 'utf8'))
    const merkleDataPath = path.resolve(config.outputMerklePath, root)
    const shardedMerkleTree = ShardedMerkleTree.fromFiles(merkleDataPath)
    const [entry, proof] = await shardedMerkleTree.getProof(account.toLowerCase())
    if (!entry) {
      console.log('no entry found', 'account', account, 'root', root)
      throw new Error('no entry')
    }
    let lockedBalance = BigNumber.from(entry.balance)
    const isRootSet = !BigNumber.from(onchainRoot).eq(BigNumber.from(0))
    if (isRootSet) {
      const [claimedAmount, claimableAmount] = await Promise.all([this.getClaimed(account), this.getClaimableForAccount(account)])
      lockedBalance = lockedBalance.sub(claimedAmount).sub(claimableAmount)
    }
    if (lockedBalance.lt(0) || onchainRoot === root) {
      lockedBalance = BigNumber.from(0)
    }

    account = account.toLowerCase()
    let amount = BigNumber.from(0)
    let proofBalance = BigNumber.from(0)
    if (isRootSet) {
      try {
        const onchainShardedMerkleTree = this.shardedMerkleTreeCache[onchainRoot] ?? await ShardedMerkleTree.fetchTree(config.merkleBaseUrl, onchainRoot)
        const proofData = this.shardedMerkleTreeProofCache[onchainRoot]?.[account] ?? await onchainShardedMerkleTree.getProof(account)
        const [onchainEntry] = proofData

        if (!this.shardedMerkleTreeCache[onchainRoot]) {
          this.shardedMerkleTreeCache[onchainRoot] = onchainShardedMerkleTree
        }
        if (!this.shardedMerkleTreeProofCache[onchainRoot]) {
          this.shardedMerkleTreeProofCache[onchainRoot] = {}
        }
        if (!this.shardedMerkleTreeProofCache[onchainRoot][account]) {
          this.shardedMerkleTreeProofCache[onchainRoot][account] = proofData
        }

        proofBalance = BigNumber.from(onchainEntry.balance)
        const withdrawn = await this.getWithdrawn(account)
        amount = proofBalance.sub(withdrawn)
      } catch (err) {
        // console.error('tree error (possibly no entry for account as expected):', err)
      }
    }

    let claimableProofBalance = BigNumber.from(0)
    let claimableProof : any[] = []
    try {
      const root = await this.getOnchainRoot()
      const merkleDataPath = path.resolve(config.outputRepoPath, root)
      const shardedMerkleTree = ShardedMerkleTree.fromFiles(merkleDataPath)
      const [_entry, _proof] = await shardedMerkleTree.getProof(account.toLowerCase())
      if (_entry && _proof) {
        claimableProofBalance = BigNumber.from(_entry.balance)
        claimableProof = _proof
      }
    } catch (err: any) {
    }

    return {
      account,
      lockedBalance: lockedBalance.toString(),
      balance: amount.toString(),
      proofBalance: proofBalance.toString(),
      proof,
      claimableProofBalance: claimableProofBalance.toString(),
      claimableProof
    }
  }

  async getHistoryForAccount (account: string) {
    // implemented by child
    return []
  }

  async getClaimableForAccount (account: string) {
    if (!config.outputMerklePath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    const root = await this.getOnchainRoot()
    const merkleDataPath = path.resolve(config.outputRepoPath, root)
    const shardedMerkleTree = ShardedMerkleTree.fromFiles(merkleDataPath)
    try {
      const [entry] = await shardedMerkleTree.getProof(account.toLowerCase())
      if (!entry) {
        return BigNumber.from(0)
      }
      const claimedAmount = await this.getClaimed(account)
      return BigNumber.from(entry.balance).sub(claimedAmount)
    } catch (err) {
      return BigNumber.from(0)
    }
  }

  async getWithdrawn (account: string) {
    account = account.toLowerCase()
    const cached = this.withdrawnCache[account] && this.withdrawnCacheCheckExpiresAt[account] && this.withdrawnCacheCheckExpiresAt[account] > Date.now()
    if (cached) {
      return this.withdrawnCache[account]
    }

    let withdrawn : BigNumber

    const publicRpcProvider = this.publicRpcProviders[this.rewardsContractNetwork]
    if (publicRpcProvider) {
      try {
        withdrawn = await this.contract.connect(publicRpcProvider).withdrawn(account)
      } catch (err: any) {
        withdrawn = await this.contract.withdrawn(account)
      }
    } else {
      withdrawn = await this.contract.withdrawn(account)
    }

    this.withdrawnCache[account] = withdrawn
    this.withdrawnCacheCheckExpiresAt[account] = Date.now() + (60 * 1000)

    return withdrawn
  }

  async getClaimed (account: string) {
    const claimedAmount = await this.getWithdrawn(account)
    // console.log('claimed', formatUnits(claimedAmount, 18))
    return claimedAmount
  }

  async getContractBalance () {
    const token = await this.getToken()
    const balance = await token.balanceOf(this.rewardsContractAddress)
    console.log('total', formatUnits(balance.toString(), 18))
  }

  async getOnchainRoot () {
    const cached = this.onchainRoot && this.onchainRootCheckExpiresAt && this.onchainRootCheckExpiresAt > Date.now()
    if (cached) {
      return this.onchainRoot
    }

    const root = await this.contract.merkleRoot()

    this.onchainRoot = root
    this.onchainRootCheckExpiresAt = Date.now() + (5 * 1000)

    // console.log('root', root)
    return root
  }

  async getData (options: any): Promise<any> {
    // return this.getDataFromRepo(options)
    return this.getDataFromPackage(options)
  }

  setGetDataFromPackage (fn: any) {
    this.getDataFromPackage = fn
  }

  setGetHistoryForAccount (fn: any) {
    this.getHistoryForAccount = fn
  }

  async getDataFromRepo (options: any) {
    let { startTimestamp, endTimestamp } = options
    if (!config.dataRepoPath) {
      throw new Error('DATA_REPO_PATH is required')
    }
    const dataPath = path.resolve(config.dataRepoPath, 'data')
    const paths = await globby(`${dataPath}/*`)
    let data : any = {}
    let timestampRangeTotal = BigNumber.from(0)
    if (paths.length > 1) {
      const updatedData: any = {}
      const filenames = paths.map((filename: string) => {
        return Number(path.parse(filename).name)
      }).sort((a, b) => a - b)
      const info = path.parse(paths[0])
      if (!startTimestamp) {
        startTimestamp = filenames[filenames.length - 1] - 1
      }
      for (const filenameTimestamp of filenames) {
        if (endTimestamp && filenameTimestamp > endTimestamp) {
          continue
        }
        const file = `${info.dir}/${filenameTimestamp}${info.ext}`
        const previousData = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }))
        for (const address in previousData) {
          let amount = BigNumber.from(previousData[address])
          if (startTimestamp && filenameTimestamp >= startTimestamp) {
            timestampRangeTotal = timestampRangeTotal.add(amount)
          }
          if (updatedData[address]) {
            amount = amount.add(BigNumber.from(updatedData[address]))
          }
          updatedData[address] = amount.toString()
        }
      }

      data = updatedData
    } else {
      data = JSON.parse(fs.readFileSync(paths[0], { encoding: 'utf-8' }))
      for (const address in data) {
        const amount = BigNumber.from(data[address])
        timestampRangeTotal = timestampRangeTotal.add(amount)
      }
    }

    return { data, timestampRangeTotal }
  }

  async getDataFromPackage (options: any): Promise<any> {
    throw new Error('not implemented')
  }

  async copyRootDataToOutputRepo (rootHash: string) {
    const outputMerklePath = process.env.OUTPUT_MERKLE_PATH
    if (!outputMerklePath) {
      throw new Error('OUTPUT_MERKLE_PATH is required')
    }

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    const folderToCopy = path.resolve(outputMerklePath, rootHash)
    const outPath = path.resolve(config.outputRepoPath, rootHash)

    fse.copySync(folderToCopy, outPath)

    fs.writeFileSync(path.resolve(config.outputRepoPath, 'latest.json'), JSON.stringify({ root: rootHash }))

    console.log('done copying')
  }

  async postToForum (data: any) {
    const {
      rootHash,
      totalFormatted,
      total,
      startTimestamp,
      endTimestamp
    } = data

    if (!config.rewardsDataOutputGitUrl) {
      throw new Error('REWARDS_DATA_OUTPUT_GIT_URL is required')
    }

    const startDate = DateTime.fromSeconds(startTimestamp)
    const endDate = DateTime.fromSeconds(endTimestamp)
    const postTitle = `AUTOMATED: New Merkle Rewards Root ${endDate.toRFC2822()}`
    const sanitizedGithubUrl = this.getSanitizedGithubUrl(config.rewardsDataOutputGitUrl)
    const chainId = chainSlugToId(this.rewardsContractNetwork)

    const chains = getChainSlugs(this.network)
    const chainsEnvVarString = chains.map((chain: string) => {
      return `${chain.toUpperCase()}_RPC_URL=https://example.com`
    }).join('\n')

    const postContent = `
This is an automated post by the merkle rewards worker bot 🤖

A new merkle root has been published to GitHub:
${sanitizedGithubUrl}

Merkle root hash: ${rootHash}
Merkle root total amount: ${totalFormatted} (${total.toString()})
Start timestamp: ${startTimestamp} (${startDate.toISO()})
End timestamp: ${endTimestamp} (${endDate.toISO()})
Rewards contract address: ${this.rewardsContractAddress}
Rewards contract network: ${this.rewardsContractNetwork}

Instructions to verify merkle root:

\`\`\`
docker pull hopprotocol/merkle-drop-framework
docker run --env-file docker.env -v ~/Downloads/op_merkle_rewards_data:/tmp/feesdb hopprotocol/merkle-drop-framework start:dist generate -- --network=${this.network} --rewards-contract=${this.rewardsContractAddress} --rewards-contract-network=${this.rewardsContractNetwork} --start-timestamp=${startTimestamp} --end-timestamp=${endTimestamp}
\`\`\`

Supply RPC urls in \`docker.env\`:

\`\`\`
${chainsEnvVarString}
USE_API_FOR_ON_CHAIN_DATA=true
\`\`\`

Web app to publish root:
https://mdf.netlify.app/?chainId=${chainId}&rewardsContract=${this.rewardsContractAddress}&merkleBaseUrl=${encodeURIComponent(config.merkleBaseUrl)}

Contract information for multisig signers:

Contract address: \`${this.rewardsContractAddress}\`
Method: \`setMerkleRoot\`
Parameters:
\`_merkleRoot\`: \`${rootHash}\`
\`totalRewards\`: \`${total.toString()}\`
`.trim()

    console.log('forum post:')
    console.log(postTitle)
    console.log(postContent)

    const response = await forumPost(postTitle, postContent)
    console.log('forum post response', JSON.stringify(response, null, 2))
    console.log('post url:', response.postUrl)
    return response
  }

  cachePromise (key: string, promiseFn: any, cacheTimeMs: number) {
    if (cachePromises[key] && cacheTimestamps[key]) {
      const isRecent = cacheTimestamps[key] > Date.now() - cacheTimeMs
      if (isRecent) {
        return cachePromises[key]
      }
    }
    const promise = promiseFn().catch((err: any) => {
      cachePromises[key] = null
      cacheTimestamps[key] = null
      throw err
    })
    cachePromises[key] = promise
    cacheTimestamps[key] = Date.now()
    return promise
  }

  async getLastRepoCheckpointMs (): Promise<number> {
    const key = 'getLastRepoCheckpointMs'
    const cacheTimeMs = 30 * 1000

    return this.cachePromise(key, this._getLastRepoCheckpointMs.bind(this), cacheTimeMs)
  }

  async _getLastRepoCheckpointMs (): Promise<number> {
    const _id = `getLastRepoCheckpointMs ${Date.now()}`
    console.time(_id)
    console.log('getLastRepoCheckpointMs')

    const cached = this.lastCheckpointMs && this.lastCheckpointMsCheckExpiresAt && this.lastCheckpointMsCheckExpiresAt > Date.now()
    if (cached) {
      console.timeEnd(_id)
      return this.lastCheckpointMs
    }

    if (!config.rewardsDataOutputGitUrl) {
      console.timeEnd(_id)
      throw new Error('rewardsDataOutputGitUrl required')
    }

    const git = this.rewardsDataOutputGit ?? simpleGit()
    if (!this.rewardsDataOutputGit) {
      this.rewardsDataOutputGit = git
    }

    if (!config.outputRepoPath) {
      console.timeEnd(_id)
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    console.log('outputRepoPath:', config.outputRepoPath)

    try {
      if (!fs.existsSync(path.resolve(config.outputRepoPath, '.git'))) {
        const _key = `clone ${_id}`
        console.time(_key)
        await git.clone(config.rewardsDataOutputGitUrl, config.outputRepoPath)
        console.timeEnd(_key)
      }
    } catch (err) {
    }

    try {
      const _key = `cwd ${_id}`
      console.time(_key)
      await git.cwd(config.outputRepoPath)
      console.timeEnd(_key)
    } catch (err) {
      console.log('clone error', err)
    }

    try {
      const shouldPull = !this.lastPull.rewardsDataOutputGitUrl || (this.lastPull.rewardsDataOutputGitUrl + (10 * 1000)) < Date.now()
      if (shouldPull) {
        const _key = `pull ${_id}`
        console.time(_key)
        await git.pull('origin', 'master')
        console.timeEnd(_key)
        this.lastPull.rewardsDataOutputGitUrl = Date.now()
      }
    } catch (err) {
      console.log('pull error', err)
    }

    try {
      const gitConfig = await git.listConfig('local')
      console.log('rewardsDataOutputGitUrl:', config.rewardsDataOutputGitUrl)
      if (gitConfig?.values?.['.git/config']?.['remote.origin.url'] !== config.rewardsDataOutputGitUrl) {
        const _key = `addRemote ${_id}`
        console.time(_key)
        await git.addRemote('origin', config.rewardsDataOutputGitUrl)
        console.timeEnd(_key)
      }
    } catch (err) {
      // console.log('remote error', err)
    }

    let lastCheckpointMs = 0
    try {
      const _key = `gitlog ${_id}`
      console.time(_key)
      const logs = await git.log()
      console.timeEnd(_key)
      const latestLog = logs?.latest
      // console.log(latestLog)
      if (latestLog) {
        const date = DateTime.fromISO(latestLog.date)
        const millis = date.toMillis()
        if (millis) {
          lastCheckpointMs = millis
        }
      }
    } catch (err) {
      console.log(err.message)
    }

    this.lastCheckpointMs = lastCheckpointMs
    this.lastCheckpointMsCheckExpiresAt = Date.now() + (5 * 1000)
    console.timeEnd(_id)
    return lastCheckpointMs
  }

  async getRemainingTimeTilCheckpoint () {
    if (!this.isStartTimestampReady()) {
      throw new Error('not ready yet')
    }

    if (!this.checkpointIntervalMs) {
      this.checkpointIntervalMs = config.checkpointIntervalMs
    }

    const oneHour = 60 * 60 * 1000
    const oneDay = oneHour * 24
    const defaultTimeMs = oneDay
    if (!this.checkpointIntervalMs) {
      console.log('this.checkpointIntervalMs not set')
      return defaultTimeMs
    }

    // console.log('getRemainingTimeTilCheckpoint getting onchainRoot')
    let isLatestRootSetOnChain = true
    try {
      const onchainRoot = await this.getOnchainRoot()
      const isSet = !BigNumber.from(onchainRoot).eq(BigNumber.from(0))
      if (isSet) {
        const outDirectory = path.resolve(config.outputRepoPath)
        const { root } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, 'latest.json'), 'utf8'))
        if (root !== onchainRoot) {
          isLatestRootSetOnChain = false
        }
      }
    } catch (err) {
    }

    // console.log('getRemainingTimeTilCheckpoint getting getLastRepoCheckpointMs')

    let lastCheckpointMs = await this.getLastRepoCheckpointMs()
    if (!lastCheckpointMs) {
      console.log('no lastCheckpointMs')
      return this.checkpointIntervalMs
    }

    if (!isLatestRootSetOnChain) {
      const extraTimeMs = 2 * 7 * 24 * 60 * 60 * 1000 // 2 week
      lastCheckpointMs = lastCheckpointMs - this.checkpointIntervalMs - (extraTimeMs)
    }

    const timeTilNextCheckpointMs = this.checkpointIntervalMs - (Date.now() - lastCheckpointMs)
    /*
    if ((timeTilNextCheckpointMs + oneDay) < oneHour) {
      console.log('timeTilNextCheckpointMs < 0', timeTilNextCheckpointMs, this.checkpointIntervalMs, Date.now(), lastCheckpointMs, (Date.now() - lastCheckpointMs))
      return defaultTimeMs
    }
    */

    return timeTilNextCheckpointMs
  }

  getSanitizedGithubUrl (githubUrl: string) {
    if (!githubUrl) {
      githubUrl = ''
    }
    if (githubUrl.startsWith('git')) {
      const gitUrlParts = githubUrl.split(':')
      githubUrl = `https://github.com/${gitUrlParts[1]}`
    }
    const sanitizedGithubUrl = githubUrl.replace(/ghp_.*@/g, '')
    return sanitizedGithubUrl
  }

  isStartTimestampReady () {
    if (!this.startTimestamp) {
      this.startTimestamp = config.startTimestamp
    }

    const isReady = this.startTimestamp < (Date.now() / 1000)
    return isReady
  }

  async pruneMerkleDir () {
    console.log('pruning merkle dir')
    let root : string
    const source = path.resolve(config.outputMerklePath)
    try {
      ({ root } = JSON.parse(fs.readFileSync(path.resolve(source, 'latest.json'), 'utf8')))
    } catch (err) {
    }
    const dirs = (await readdir(source, { withFileTypes: true }))
      .filter(item => item.isDirectory())
      .map(item => path.resolve(config.outputMerklePath, item.name))

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    for (const dirPath of dirs) {
      const mtime = fs.statSync(dirPath).mtime
      const lastModified = DateTime.fromISO(mtime.toISOString())
      if (lastModified.toMillis() < oneDayAgo) {
        if (dirPath.startsWith('/tmp')) {
          if (root && dirPath.includes(root)) {
            continue
          }
          console.log('deleting', dirPath, lastModified.toRelative())
          fs.rmSync(dirPath, { recursive: true, force: true })
        }
      }
    }
  }

  async getRepoRootInfo () {
    try {
      if (!config.outputRepoPath) {
        throw new Error('OUTPUT_REPO_PATH is required')
      }

      const outDirectory = path.resolve(config.outputRepoPath)
      const { root } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, 'latest.json'), 'utf8'))
      const { total } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, root, 'root.json'), 'utf8'))
      if (!root) {
        throw new Error('expected root')
      }
      if (!total) {
        throw new Error('expected total')
      }

      return {
        repoLatestRoot: root,
        repoLatestRootTotal: total
      }
    } catch (err: any) {
      console.error('getRepoRootInfo error:', err)
      return {
        repoLatestRoot: '0x',
        repoLatestRootTotal: BigNumber.from(0)
      }
    }
  }

  async getLockedRewards () {
    if (!config.outputMerklePath) {
      throw new Error('OUTPUT_MERKLE_PATH is required')
    }

    try {
      const outDirectory = path.resolve(config.outputMerklePath)
      const { root } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, 'latest.json'), 'utf8'))
      const { total } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, root, 'root.json'), 'utf8'))
      const onchainPreviousTotalAmount = await this.contract.currentTotalRewards()
      const onchainRoot = await this.getOnchainRoot()
      const totalAmount = BigNumber.from(total.toString())
      const additionalAmount = totalAmount.sub(onchainPreviousTotalAmount)

      return {
        root,
        totalAmount,
        totalAmountFormatted: Number(formatUnits(totalAmount.toString(), 18)),
        additionalAmount,
        additionalAmountFormatted: Number(formatUnits(additionalAmount.toString(), 18)),
        onchainRoot,
        onchainRootTotalAmount: onchainPreviousTotalAmount,
        onchainRootTotalAmountFormatted: Number(formatUnits(onchainPreviousTotalAmount.toString(), 18))
      }
    } catch (err) {
      console.error('getLockedRewards error:', err)
      return {
        root: '0x',
        totalAmount: BigNumber.from(0),
        totalAmountFormatted: 0,
        additionalAmount: BigNumber.from(0),
        additionalAmountFormatted: 0,
        onchainRoot: '0x',
        onchainRootTotalAmount: BigNumber.from(0),
        onchainRootTotalAmountFormatted: 0
      }
    }
  }

  setGetTxInfo (fn: any) {
    this.getTxInfo = fn
  }

  async getTxInfo (chain: string, hash: string): Promise<any> {
    // implemented by child
    return null
  }
}
