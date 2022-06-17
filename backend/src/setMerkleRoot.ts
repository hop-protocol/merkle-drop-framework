import 'dotenv/config'
import { constants, Wallet, BigNumber, Contract, providers } from 'ethers'
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

main()
  .catch(console.error)
