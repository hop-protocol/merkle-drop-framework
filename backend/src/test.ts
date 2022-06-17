import BalanceTree from './balanceTree'
import { bufferToHex, keccak256 } from 'ethereumjs-util'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'

const merkleData = require('./output.json')
const leaves = []
for (const address in merkleData.claims) {
  leaves.push({account: address, amount: Buffer.from(merkleData.claims[address].amount.replace('0x', ''), 'hex') })
}

const wallet0 = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'

const tree = new BalanceTree(leaves)

const amount = BigNumber.from('0x01000000000000000000')
const proof0 = tree.getProof(4, wallet0, amount)
console.log(proof0)

const index = 4
const account = wallet0
const proof = proof0.map((el) => Buffer.from(el.slice(2), 'hex'))
const root = Buffer.from(merkleData.merkleRoot.replace('0x', ''), 'hex')
const verified = BalanceTree.verifyProof(index, account, amount, proof, root)
console.log(verified)
/*
[
  '0xf40e33d2923e993115b2bb545a8bfff2beef78e11ffbff0c40fedc50b99e90a9',
  '0x6b2845388c6c64e0910eb0763ed7965b8b6f0c7687d6e596871cbbb498774f6e'
]
*/
