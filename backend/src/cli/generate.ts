import { program } from 'commander'
import { Controller } from '../Controller'
import { formatUnits } from 'ethers/lib/utils'

program
  .command('generate')
  .description('Generate merkle data')
  .option('--start-timestamp <value>', 'Start timestamp in seconds')
  .option('--end-timestamp <value>', 'End timestamp in seconds')
  .option('--poll-interval <value>', 'Poll interval in seconds')
  .option('--network <network>', 'Network chain, (ie optimism)')
  .option('--rewards-contract <address>', 'Rewards contract address')
  .option('--rewards-contract-network <network>', 'Rewards contract network')
  .action(async (source: any) => {
    try {
      await main(source)
    } catch (err) {
      console.error(err)
    }
  })

async function main (options: any = {}) {
  console.log('options:', options)
  const startTimestamp = Number(options.startTimestamp) || Math.floor((Date.now()/1000) - 60 * 60)
  const endTimestamp = Number(options.endTimestamp) || Math.floor(Date.now()/1000)

  // TODO: clean up (SoC)
  const { OptimismFeeRefund } = require('../instances/feeRefund/FeeRefund')
  const controller = new Controller(options.network, options.rewardsContract, options.rewardsContractNetwork)
  const feeRefund = new OptimismFeeRefund(controller)

  console.log('source code:', 'https://github.com/hop-protocol/merkle-drop-framework')
  console.log('network:', options.network)
  console.log('rewardsContract:', options.rewardsContract)
  console.log('startTimestamp:', startTimestamp)
  console.log('endTimestamp:', endTimestamp)

  const { tree, total, onchainPreviousTotalAmount, calldata } = await controller.generateRoot({shouldWrite: false, startTimestamp, endTimestamp})
  const rootHash = tree.getHexRoot()
  console.log('root:', rootHash)
  console.log('total:', `${total.toString()} (${formatUnits(total.toString(), 18)})`)
  console.log('onchainPreviousTotalAmount:', `${onchainPreviousTotalAmount.toString()} (${formatUnits(onchainPreviousTotalAmount.toString(), 18)})`)
  console.log('calldata:', JSON.stringify(calldata))
  console.log('done')
}
