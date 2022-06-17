import path from 'path'
import 'dotenv/config'
import { Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { rewardsContractAddress } from './config'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')

const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)

async function main () {
  const account = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
  const claimedAmount = await contract.withdrawn(account)
  console.log('claimed', formatUnits(claimedAmount, 18))
}

main()
  .catch(console.error)
