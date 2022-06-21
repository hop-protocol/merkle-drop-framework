import { program } from 'commander'
import { Controller } from '../Controller'
import { formatUnits } from 'ethers/lib/utils'

program
  .command('generate')
  .description('Generate merkle data')
  .option('--previous-snapshot-timestamp <value>', 'Start timestamp in seconds')
  .option('--snapshot-timestamp <value>', 'End timestamp in seconds')
  .action(async (source, options) => {
    try {
      await main(source)
    } catch (err) {
      console.error(err)
    }
  })

async function main (options: any = {}) {
  const startTimestamp = Number(options.previousSnapshotTimestamp)
  const endTimestamp = Number(options.snapshotTimestamp)
  const controller = new Controller()

  await controller.pullRewardsDataFromRepo()
  const { tree, total, additionalAmount, onchainPreviousTotalAmount, calldata } = await controller.generateRoot({shouldWrite: false, startTimestamp, endTimestamp})
  const rootHash = tree.getHexRoot()
  console.log('root:', rootHash)
  console.log('total:', `${total.toString()} (${formatUnits(total.toString(), 18)})`)
  console.log('additionalAmount:', `${additionalAmount.toString()} (${formatUnits(additionalAmount.toString(), 18)})`)
  console.log('onchainPreviousTotalAmount:', `${onchainPreviousTotalAmount.toString()} (${formatUnits(onchainPreviousTotalAmount.toString(), 18)})`)
  console.log('calldata:', JSON.stringify(calldata))
  console.log('done')
}
