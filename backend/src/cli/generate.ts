import { program } from 'commander'
import { Controller } from '../Controller'
import { formatUnits } from 'ethers/lib/utils'

program
  .command('generate')
  .description('Generate merkle data')
  .action(async (str, options) => {
    try {
      await main()
    } catch (err) {
      console.error(err)
    }
  })

async function main () {
  const controller = new Controller()

  await controller.pullRewardsDataFromRepo()
  const { tree, total, additionalAmount, onchainPreviousTotalAmount, calldata } = await controller.generateRoot({shouldWrite: false})
  const rootHash = tree.getHexRoot()
  console.log('root:', rootHash)
  console.log('total:', `${total.toString()} (${formatUnits(total.toString(), 18)})`)
  console.log('additionalAmount:', `${additionalAmount.toString()} (${formatUnits(additionalAmount.toString(), 18)})`)
  console.log('onchainPreviousTotalAmount:', `${onchainPreviousTotalAmount.toString()} (${formatUnits(onchainPreviousTotalAmount.toString(), 18)})`)
  console.log('calldata:', JSON.stringify(calldata))
  console.log('done')
}
