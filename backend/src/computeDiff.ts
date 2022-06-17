import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import { Wallet, BigNumber, Contract, providers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { rewardsContractAddress, tokenAddress } from './config'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')
const tokenAbi = require('./abi/ERC20.json')

const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)
const token = new Contract(tokenAddress, tokenAbi, signer)

async function main () {
  const previousData = require('./data/simple.json')
  const newData = require('./data/simple2.json')
  const updatedData: any = {}

  for (const address in previousData) {
    let amount = BigNumber.from(previousData[address])
    if (newData[address]) {
      amount = amount.add(BigNumber.from(newData[address]))
    }
    updatedData[address] = amount.toString()
  }

  const output = JSON.stringify(updatedData, null, 2)
  console.log(output)
  const outfile = path.resolve(__dirname, 'data/data.json')
  fs.writeFileSync(outfile, output)
}

main()
  .catch(console.error)
