import 'dotenv/config'
import { Wallet, BigNumber, Contract, providers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
const merkleRewardsAbi = require('./abi/MerkleRewards.json')
const tokenAbi = require('./abi/ERC20.json')

const rewardsContractAddress = '0x36213016E1f2B916060D19550887c40Fe178D912'
const tokenAddress = '0xC61bA16e864eFbd06a9fe30Aab39D18B8F63710a'
const provider = new providers.StaticJsonRpcProvider('https://goerli.rpc.authereum.com')

const privateKey = process.env.PRIVATE_KEY
const signer = new Wallet(privateKey, provider)
const contract = new Contract(rewardsContractAddress, merkleRewardsAbi, signer)
const token = new Contract(tokenAddress, tokenAbi, signer)

async function main () {
  const { root, total } = require('./generated/root.json')
  const owner = await signer.getAddress()
  console.log(root, total)
  const totalBn = BigNumber.from(total)
  const balance = await token.balanceOf(owner)
  console.log('total', parseUnits(totalBn.toString(), 6))
  if (balance.lt(totalBn)) {
    console.log('balance', parseUnits(balance.toString(), 6))
    throw new Error('not enough balance')
  }
  const allowance = await token.allowance(owner, rewardsContractAddress)
  if (allowance.lt(totalBn)) {
    const t = await token.approve(rewardsContractAddress, total)
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
