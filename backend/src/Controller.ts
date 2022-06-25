import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import globby from 'globby'
import { ShardedMerkleTree } from './merkle'
import simpleGit from 'simple-git'
import { constants, Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import merkleRewardsAbi from './abi/MerkleRewards.json'
import tokenAbi from './abi/ERC20.json'
import { FeeRefund } from '@hop-protocol/fee-refund'

const rewardsContractAddress = process.env.REWARDS_CONTRACT_ADDRESS
const tokenAddress = process.env.TOKEN_ADDRESS
const privateKey = process.env.PRIVATE_KEY
const rewardsDataGitUrl = process.env.REWARDS_DATA_GIT_URL
const rewardsDataOutputGitUrl = process.env.REWARDS_DATA_OUTPUT_GIT_URL
const dataRepoPath = process.env.DATA_REPO_PATH
const outputRepoPath = process.env.OUTPUT_REPO_PATH
const network = process.env.NETWORK

if (!network) {
  throw new Error('network env var is required')
}

const rpcUrls = {
  mainnet: process.env.ETHEREUM_RPC_URL,
  polygon: process.env.POLYGON_RPC_URL,
  gnosis: process.env.GNOSIS_RPC_URL,
  arbitrum: process.env.ARBITRUM_RPC_URL,
  optimism: process.env.OPTIMISM_RPC_URL
}

console.log(rpcUrls)

const provider = new providers.StaticJsonRpcProvider(rpcUrls[network])
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)
const token = new Contract(tokenAddress, tokenAbi, signer)

if (!dataRepoPath) {
  throw new Error('dataRepoPath required')
}

if (!outputRepoPath) {
  throw new Error('outputRepoPath required')
}

export class Controller {
  async pullRewardsDataFromRepo () {
    if (!rewardsDataGitUrl) {
      throw new Error('rewardsDataGitUrl required')
    }
    const git = simpleGit()

    try {
      await git.clone(rewardsDataOutputGitUrl, outputRepoPath)
    } catch (err) {
    }

    try {
      await git.clone(rewardsDataGitUrl, dataRepoPath)
    } catch (err) {
      // console.log('clone error', err)
    }

    try {
      await git.cwd(dataRepoPath)
      await git.pull('origin', 'master')
    } catch (err) {
      console.log('pull error')
      throw err
    }
    console.log('done pulling data')
    return true
  }

  async pushOutputToRemoteRepo () {
    if (!rewardsDataOutputGitUrl) {
      throw new Error('rewardsDataOutputGitUrl required')
    }
    const git = simpleGit()

    try {
      await git.cwd(outputRepoPath)
    } catch (err) {
      console.log('clone error', err)
    }
    try {
      await git.addRemote('origin', rewardsDataOutputGitUrl)
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

    try {
      await git.push('origin', 'master')
    } catch (err) {
      console.log('push error', err)
      throw err
    }
    console.log('done pushing merkle data')
  }

  async generateRoot (options: any = {}) {
    let shouldWrite = true
    if (options.shouldWrite === false) {
      shouldWrite = false
    }

    const { data } = await this.getData(options)

    const json: any[] = []
    for (const address in data) {
      json.push([address, { balance: data[address] }])
    }

    const shardNybbles = 2
    let outDirectory : any
    if (shouldWrite) {
      outDirectory = path.resolve(outputRepoPath, 'data')
      if (fs.existsSync(outDirectory) && outDirectory.startsWith('/tmp')) {
        fs.rmSync(outDirectory, { recursive: true, force: true })
      }
    }

    const { tree, total } = ShardedMerkleTree.build(json, shardNybbles, outDirectory)
    const rootHash = tree.getHexRoot()

    if (shouldWrite) {
      const renamedDir = path.resolve(outputRepoPath, tree.getHexRoot())
      if (!fs.existsSync(renamedDir)) {
        fs.renameSync(outDirectory, renamedDir)
      }
      if (fs.existsSync(outDirectory) && outDirectory.startsWith('/tmp')) {
        fs.rmSync(outDirectory, { recursive: true, force: true })
      }
      const latestFile = path.resolve(outputRepoPath, 'latest.json')
      fs.writeFileSync(latestFile, JSON.stringify({ root: rootHash }))
    }
    const onchainPreviousTotalAmount = await contract.previousTotalRewards()
    // const additionalAmount = timestampRangeTotal
    console.log(rootHash)
    const calldata = await contract.populateTransaction.setMerkleRoot(rootHash, total)
    return { tree, total, onchainPreviousTotalAmount, calldata }
  }

  async setMerkleRoot (rootHash: string) {
    const rootJsonPath = path.resolve(outputRepoPath, rootHash, 'root.json')
    const { root, total } = require(rootJsonPath)
    const owner = await signer.getAddress()
    console.log(root, total)
    const totalBn = BigNumber.from(total)
    const balance = await token.balanceOf(owner)
    console.log('total', formatUnits(totalBn.toString(), 18))
    if (balance.lt(totalBn)) {
      console.log('balance', parseUnits(balance.toString(), 18))
      throw new Error('not enough balance')
    }
    const allowance = await token.allowance(owner, rewardsContractAddress)
    if (allowance.lt(totalBn)) {
      const t = await token.approve(rewardsContractAddress, constants.MaxUint256)
      console.log('approving', t.hash)
      await t.wait()
    }

    console.log('setting root')
    const tx = await contract.setMerkleRoot(root, total)
    console.log('sent', tx.hash)
    await tx.wait()
    console.log('done setting root onchain')
  }

  async claim (root: string, account: string) {
    const merkleDataPath = path.resolve(outputRepoPath, root)
    const shardedMerkleTree = ShardedMerkleTree.fromFiles(merkleDataPath)
    const [entry, proof] = await shardedMerkleTree.getProof(account)
    if (!entry) {
      throw new Error('no entry')
    }
    const totalAmount = BigNumber.from(entry.balance)

    console.log('claim')
    const tx = await contract.claim(account, totalAmount, proof)
    console.log('sent', tx.hash)
    await tx.wait()
    console.log('done claiming onchain')
  }

  async getClaimed (account: string) {
    const claimedAmount = await contract.withdrawn(account)
    console.log('claimed', formatUnits(claimedAmount, 18))
  }

  async getContractBalance () {
    const balance = await token.balanceOf(rewardsContractAddress)
    console.log('total', formatUnits(balance.toString(), 18))
  }

  async getOnchainRoot () {
    const root = await contract.merkleRoot()
    console.log('root', root)
  }

  async getData (options: any) {
    // return this.getDataFromRepo(options)
    return this.getDataFromPackage(options)
  }

  async getDataFromRepo (options: any) {
    let { startTimestamp, endTimestamp } = options
    const dataPath = path.resolve(dataRepoPath, 'data')
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
    const dbDir = path.resolve(__dirname, 'db')
    const refundChain = 'optimism'
    const refundPercentage = 0.5
    const merkleRewardsContractAddress = rewardsContractAddress

    const _config = { dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain }
    const feeRefund = new FeeRefund(_config)

    console.log('seeding')
    console.time('seeding')
    await feeRefund.seed()
    console.timeEnd('seeding')
    console.log('calculating fees')
    console.time('calculateFees')
    const result = await feeRefund.calculateFees(endTimestamp)
    console.timeEnd('calculateFees')
    console.log('getData done', result)
    return { data: result }
  }
}
