import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import globby from 'globby'
import { ShardedMerkleTree } from './merkle'
import simpleGit from 'simple-git'
import { constants, Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { rewardsContractAddress, tokenAddress } from './config'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')
const tokenAbi = require('./abi/ERC20.json')

const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const rewardsDataGitUrl = process.env.REWARDS_DATA_GIT_URL
const rewardsDataOutputGitUrl = process.env.REWARDS_DATA_OUTPUT_GIT_URL
const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)
const token = new Contract(tokenAddress, tokenAbi, signer)
const dataRepoPath = '/tmp/rewards-data'
const outputRepoPath = '/tmp/rewards-output'

export class Controller {
  async pullRewardsDataFromRepo () {
    if (!rewardsDataGitUrl) {
      throw new Error('rewardsDataGitUrl required')
    }
    const git = simpleGit()

    try {
      await git.clone(rewardsDataGitUrl, dataRepoPath)
      // await git.addRemote('origin', rewardsDataGitUrl)
    } catch (err) {
    }
    await git.pull('origin', 'master')
    // await git.add('*.json')
    // await git.commit('Update data')
    // await git.push('origin', 'main')
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
    const paths = await globby(dataPath + '/*')
    let data : any = {}
    if (paths.length > 1) {
      // combine
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

  async setMerkleRoot () {
    const { root, total } = require('./generated2/root.json')
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
}
