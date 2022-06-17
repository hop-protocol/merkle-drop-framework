import path from 'path'
import 'dotenv/config'
import { Wallet, BigNumber, Contract, providers } from 'ethers'
import { ShardedMerkleTree } from './merkle'
import { rewardsContractAddress } from './config'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')

const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)

async function main () {
  const account = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'// .toLowerCase()
  const shardedMerkleTree = await ShardedMerkleTree.fromFiles(path.resolve(__dirname, './generated2/'))
  const [entry, proof] = await shardedMerkleTree.getProof(account)
  const totalAmount = BigNumber.from(entry.balance)

  console.log('claim')
  const tx = await contract.claim(account, totalAmount, proof)
  console.log('sent', tx.hash)
  await tx.wait()
  console.log('done')
}

main()
  .catch(console.error)
