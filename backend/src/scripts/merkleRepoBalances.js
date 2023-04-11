const fs = require('fs')
const { BigNumber } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

// cd /tmp
// git clone git@github.com:hop-protocol/optimism-refund-merkle-rewards.git
// for cli output run with run with docker flag `-v /tmp/outdir:/outdir` and cli json output will be in /output/out.json
// docker run --env-file docker.env -v /tmp/outdir:/outdir -v ~/.tmp/feesdb:/tmp/feesdb hopprotocol/merkle-drop-framework start:dist generate -- --network=mainnet --rewards-contract=0x45269F59aA76bB491D0Fc4c26F468D8E1EE26b73 --rewards-contract-network=optimism --start-timestamp=1663898400 --end-timestamp=1680274800
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
// console.log(sum.toString(), formatUnits(sum, 18))

// after cloning the repo and running the above commands, run:
// cat /tmp/outdir/out.json | jq --sort-keys > /tmp/cli.json
// node src/scripts/merkleRepoBalances.js | jq --sort-keys > /tmp/repo.json
// diff_files /tmp/cli.json /tmp/repo.json
