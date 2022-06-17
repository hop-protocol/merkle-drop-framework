import path from 'path'
import 'dotenv/config'
import { Wallet, BigNumber, Contract, providers } from 'ethers'
import { ShardedMerkleTree } from './merkle'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')

const rewardsContractAddress = '0x36213016E1f2B916060D19550887c40Fe178D912'
const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)

async function main () {
  const account = '0x00000000000a29a0800f6f557ddbbe8249397de7'.toLowerCase()
  const shardedMerkleTree = await ShardedMerkleTree.fromFiles(path.resolve(__dirname, './generated/'))
  const [entry, proof] = await shardedMerkleTree.getProof(account?.toLowerCase())
  const totalAmount = BigNumber.from(entry.balance)

  console.log('claim')
  const tx = await contract.claim(account, totalAmount, proof)
  console.log('sent', tx.hash)
  await tx.wait()
  console.log('done')
}

main()
  .catch(console.error)
