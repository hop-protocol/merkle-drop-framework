import 'dotenv/config'
import { Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { rewardsContractAddress, tokenAddress } from './config'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')
const tokenAbi = require('./abi/ERC20.json')

const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const token = new Contract(tokenAddress, tokenAbi, signer)

async function main () {
  const balance = await token.balanceOf(rewardsContractAddress)
  console.log('total', formatUnits(balance.toString(), 18))
}

main()
  .catch(console.error)
