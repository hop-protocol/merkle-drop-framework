import 'dotenv/config'
import fs from 'fs'
import fse from 'fs-extra'
import path from 'path'
import globby from 'globby'
import { ShardedMerkleTree } from './merkle'
import simpleGit from 'simple-git'
import { constants, Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import merkleRewardsAbi from './abi/MerkleRewards.json'
import tokenAbi from './abi/ERC20.json'
import { FeeRefund } from '@hop-protocol/fee-refund'
import { forumPost } from './forumPost'
import { DateTime } from 'luxon'
import { config } from './config'

const rpcUrls = {
  mainnet: process.env.ETHEREUM_RPC_URL ?? 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213', // from ethers
  polygon: process.env.POLYGON_RPC_URL ?? 'https://polygon-rpc.com',
  gnosis: process.env.GNOSIS_RPC_URL ?? 'https://rpc.gnosischain.com',
  arbitrum: process.env.ARBITRUM_RPC_URL ?? 'https://arb1.arbitrum.io/rpc',
  optimism: process.env.OPTIMISM_RPC_URL ?? 'https://mainnet.optimism.io'
}

console.log(rpcUrls)

export class Controller {
  network: string
  rewardsContractAddress: string
  contract: any
  signer: any
  signerOrProvider: any

  constructor (network: string = config.network, rewardsContractAddress: string = config.rewardsContractAddress) {
    if (!network) {
      throw new Error('NETWORK is required')
    }

    if (!rewardsContractAddress) {
      throw new Error('REWARDS_CONTRACT_ADDRESS is required')
    }
    const provider = new providers.StaticJsonRpcProvider(rpcUrls[network])

    let signer : any
    if (config.privateKey) {
      signer = new Wallet(config.privateKey, provider)
    }

    const signerOrProvider = signer ?? provider
    this.contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signerOrProvider)
    this.signer = signer
    this.signerOrProvider = signerOrProvider
    this.network = network
    this.rewardsContractAddress = rewardsContractAddress
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
      await git.clone(config.rewardsDataOutputGitUrl, config.outputRepoPath)
    } catch (err) {
    }

    try {
      await git.clone(config.rewardsDataGitUrl, config.dataRepoPath)
    } catch (err) {
      // console.log('clone error', err)
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
    const git = simpleGit()

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    try {
      await git.clone(config.rewardsDataOutputGitUrl, config.outputRepoPath)
    } catch (err) {
    }

    console.log('outputRepoPath:', config.outputRepoPath)

    try {
      await git.cwd(config.outputRepoPath)
    } catch (err) {
      console.log('clone error', err)
    }

    try {
      console.log('rewardsDataOutputGitUrl:', config.rewardsDataOutputGitUrl)
      await git.addRemote('origin', config.rewardsDataOutputGitUrl)
    } catch (err) {
      // console.log('remote error', err)
    }
  }

  async pushOutputToRemoteRepo () {
    if (!config.rewardsDataOutputGitUrl) {
      throw new Error('rewardsDataOutputGitUrl required')
    }
    const git = simpleGit()

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
      console.log('rewardsDataOutputGitUrl:', config.rewardsDataOutputGitUrl)
      await git.addRemote('origin', config.rewardsDataOutputGitUrl)
    } catch (err) {
      // console.log('remote error', err)
    }

    try {
      const emailConfig = await git.getConfig('user.email')
      if (!emailConfig.value) {
        await git.addConfig('user.email', process.env.GIT_USER_EMAIL, false, 'local')
      }
      const nameConfig = await git.getConfig('user.name')
      if (!nameConfig.value) {
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
    return { alreadyUpdated }
  }

  async generateRoot (options: any = {}) {
    let shouldWrite = true
    if (options.shouldWrite === false) {
      shouldWrite = false
    }

    const writeToPath = options.writePath ?? config.outputRepoPath

    const { data } = await this.getData(options)

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
      const latestFile = path.resolve(writeToPath, 'latest.json')
      fs.writeFileSync(latestFile, JSON.stringify({ root: rootHash }))
    }
    const onchainPreviousTotalAmount = await this.contract.previousTotalRewards()
    // const additionalAmount = timestampRangeTotal
    console.log(rootHash)
    let calldata : any = {}
    if (rootHash !== '0x') {
      calldata = await this.contract.populateTransaction.setMerkleRoot(rootHash, total)
    }

    const totalFormatted = formatUnits(total.toString(), 18)

    return { rootHash, tree, total, totalFormatted, onchainPreviousTotalAmount, calldata }
  }

  async getToken () {
    const tokenAddress = await this.contract.rewardsToken()
    const token = new Contract(tokenAddress, tokenAbi, this.signerOrProvider)
    return token
  }

  async setMerkleRoot (rootHash: string) {
    const rootJsonPath = path.resolve(config.outputRepoPath, rootHash, 'root.json')
    const { root, total } = require(rootJsonPath)
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
    if (!config.outputMerklePath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    const outDirectory = path.resolve(config.outputMerklePath)
    const { root } = JSON.parse(fs.readFileSync(path.resolve(outDirectory, 'latest.json'), 'utf8'))
    const merkleDataPath = path.resolve(config.outputRepoPath, root)
    const shardedMerkleTree = ShardedMerkleTree.fromFiles(merkleDataPath)
    const [entry, proof] = await shardedMerkleTree.getProof(account.toLowerCase())
    if (!entry) {
      throw new Error('no entry')
    }
    return {
      balance: entry.balance,
      proof
    }
  }

  async getClaimed (account: string) {
    const claimedAmount = await this.contract.withdrawn(account)
    console.log('claimed', formatUnits(claimedAmount, 18))
  }

  async getContractBalance () {
    const token = await this.getToken()
    const balance = await token.balanceOf(this.rewardsContractAddress)
    console.log('total', formatUnits(balance.toString(), 18))
  }

  async getOnchainRoot () {
    const root = await this.contract.merkleRoot()
    console.log('root', root)
  }

  async getData (options: any) {
    // return this.getDataFromRepo(options)
    return this.getDataFromPackage(options)
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
        const previousData = require(file)
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
      data = require(paths[0])
      for (const address in data) {
        const amount = BigNumber.from(data[address])
        timestampRangeTotal = timestampRangeTotal.add(amount)
      }
    }

    return { data, timestampRangeTotal }
  }

  async getDataFromPackage (options: any) {
    const { startTimestamp, endTimestamp } = options
    if (!config.feesDbPath) {
      throw new Error('FEES_DB_PATH is required')
    }
    const dbDir = path.resolve(config.feesDbPath, 'db')

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const refundChain = 'optimism'
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.rewardsContractAddress

    const _config = { dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain }
    const feeRefund = new FeeRefund(_config)

    const id = Date.now()

    console.log('seeding')
    console.time('seeding ' + id)
    await feeRefund.seed()
    console.timeEnd('seeding ' + id)
    console.log('calculating fees')
    console.time('calculateFees ' + id)
    const result = await feeRefund.calculateFees(endTimestamp)
    const filtered = result

    // for testing
    // TODO: remove when live
    /*
    filtered = {
      '0x9997da3de3ec197c853bcc96caecf08a81de9d69': result['0x9997da3de3ec197c853bcc96caecf08a81de9d69']
    }
    */

    console.timeEnd('calculateFees ' + id)
    console.log('getData done', result)
    console.log('filtered', filtered)
    return { data: filtered }
  }

  async copyRootDataToOutputRepo (rootHash: string) {
    const outputMerklePath = process.env.OUTPUT_MERKLE_PATH
    if (!outputMerklePath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    if (!config.outputRepoPath) {
      throw new Error('OUTPUT_REPO_PATH is required')
    }

    const folderToCopy = path.resolve(outputMerklePath, rootHash)
    const outPath = path.resolve(config.outputRepoPath, rootHash)

    fse.copySync(folderToCopy, outPath)

    fse.copySync(path.resolve(outputMerklePath, 'latest.json'), path.resolve(config.outputRepoPath, 'latest.json'))

    console.log('done copying')
  }

  async postToForum (data: any) {
    const {
      rootHash,
      totalFormatted,
      startTimestamp,
      endTimestamp
    } = data

    if (!config.rewardsDataOutputGitUrl) {
      throw new Error('REWARDS_DATA_OUTPUT_GIT_URL is required')
    }

    const gitUrlParts = config.rewardsDataOutputGitUrl.split(':')
    const githubUrl = `https://github.com/${gitUrlParts[1]}`

    const startDate = DateTime.fromSeconds(startTimestamp)
    const endDate = DateTime.fromSeconds(endTimestamp)
    const postTitle = `AUTOMATED: New Merkle Rewards Root ${endDate.toRFC2822()}`
    const postContent = `
    This is an automated post by the merkle rewards worker bot.

    A new merkle root has been published to GitHub:
    ${githubUrl}

    Merkle root hash: ${rootHash}
    Merkle root total amount: ${totalFormatted}
    Start timestamp: ${startTimestamp} (${startDate.toISO()})
    End timestamp: ${endTimestamp} (${endDate.toISO()})

    Instructions to verify merkle root:

    \`\`\`
    docker run hopprotocol/merkle-drop-framework start:dist generate -- --network=${this.network} --rewards-contract=${this.rewardsContractAddress} --start-timestamp=${startTimestamp} --end-timestamp=${endTimestamp}
    \`\`\`
    `

    console.log('forum post:')
    console.log(postTitle)
    console.log(postContent)

    const response = await forumPost(postTitle, postContent)
    console.log('forum post response', JSON.stringify(response, null, 2))
    console.log('post url:', response.postUrl)
    return response
  }

  async getRefundAmount (transfer: any) {
    const startTimestamp = Math.floor(Date.now() / 1000)
    if (!config.feesDbPath) {
      throw new Error('FEES_DB_PATH is required')
    }
    const dbDir = path.resolve(config.feesDbPath, 'db')

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const refundChain = 'optimism'
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.rewardsContractAddress

    const _config = { dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain }
    const feeRefund = new FeeRefund(_config)

    const _transfer: any = {
      amount: transfer.amount,
      gasUsed: transfer.gasLimit,
      gasPrice: transfer.gasPrice,
      chain: transfer.chain,
      timestamp: transfer.timestamp,
      bonderFee: transfer.bonderFee,
      token: transfer.token
    }

    await feeRefund.seed()
    return feeRefund.getRefundAmount(_transfer)
  }
}
