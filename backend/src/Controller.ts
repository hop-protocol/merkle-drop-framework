import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import globby from 'globby'
import { ShardedMerkleTree } from './merkle'
import simpleGit from 'simple-git'
import { constants, Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { rewardsContractAddress, tokenAddress } from './config'
import merkleRewardsAbi from './abi/MerkleRewards.json'
import tokenAbi from './abi/ERC20.json'

const privateKey = process.env.PRIVATE_KEY
const rewardsDataGitUrl = process.env.REWARDS_DATA_GIT_URL
const rewardsDataOutputGitUrl = process.env.REWARDS_DATA_OUTPUT_GIT_URL
const dataRepoPath = process.env.DATA_REPO_PATH
const outputRepoPath = process.env.OUTPUT_REPO_PATH

const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')
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
      await git.clone(rewardsDataGitUrl, dataRepoPath)
    } catch (err) {
    }
    await git.pull('origin', 'master')
    console.log('done')
  }

  async pushOutputToRemoteRepo () {
    if (!rewardsDataOutputGitUrl) {
      throw new Error('rewardsDataOutputGitUrl required')
    }
    const git = simpleGit(outputRepoPath)

    try {
      await git.init()
    } catch (err) {
      console.log(err)
    }

    try {
      await git.clone(rewardsDataOutputGitUrl, outputRepoPath)
    } catch (err) {
    }
    try {
      await git.addRemote('origin', rewardsDataOutputGitUrl)
    } catch (err) {
    }
    try {
      await git.pull('origin', 'master')
    } catch (err) {
    }
    await git.add('*')
    await git.commit('Update data')
    await git.push('origin', 'master')
    console.log('done')
  }

  async generateRoot () {
    /*
    const json = fs
      .readFileSync(path.resolve(__dirname, './data/data.json'), { encoding: 'utf-8' })
      .split('\n')
      .filter(x => x.length > 0)
      .map(line => {
        const data = JSON.parse(line)
        const owner = data.owner
        delete data.owner
        return [owner, data]
      })
    */
    const dataPath = path.resolve(dataRepoPath, 'data')
    const paths = await globby(`${dataPath}/*`)
    let data : any = {}
    if (paths.length > 1) {
      const updatedData: any = {}
      // TODO: read base name as timestamp
      for (let i = 0; i < paths.length; i++) {
        const info = path.parse(paths[0])
        const file = `${info.dir}/${i}${info.ext}`
        const previousData = require(file)
        for (const address in previousData) {
          let amount = BigNumber.from(previousData[address])
          if (updatedData[address]) {
            amount = amount.add(BigNumber.from(updatedData[address]))
          }
          updatedData[address] = amount.toString()
        }
      }

      data = updatedData
    } else {
      data = require(paths[0])
    }

    const json: any[] = []
    for (const address in data) {
      json.push([address, { balance: data[address] }])
    }

    const shardNybbles = 2
    const outDirectory = path.resolve(outputRepoPath, 'data')

    const tree = ShardedMerkleTree.build(json, shardNybbles, outDirectory)
    const renamedDir = path.resolve(outputRepoPath, tree.getHexRoot())
    fs.renameSync(outDirectory, renamedDir)
    console.log(tree.getHexRoot())
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
    console.log('done')
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
    console.log('done')
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
}
