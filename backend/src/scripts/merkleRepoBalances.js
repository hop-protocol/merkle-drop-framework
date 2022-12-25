const fs = require('fs')
const { BigNumber } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

const repoPath = '/tmp/optimism-refund-merkle-rewards'
const { root } = require(repoPath + '/latest.json')
const all = {}
const list = fs.readdirSync(repoPath + '/' + root)
for (const file of list) {
  const filepath = repoPath + '/' + root + '/' + file
  const data = require(filepath)
  for (const address in data.entries) {
    const amount = data.entries[address].balance
    all[address] = amount
  }
}

let sum = BigNumber.from(0)
for (const addr in all) {
  sum = sum.add(BigNumber.from(all[addr]))
}

console.log(JSON.stringify(all, null, 2))
console.log(sum.toString(), formatUnits(sum, 18))

// diff_files /tmp/cli.json /tmp/repo.json
