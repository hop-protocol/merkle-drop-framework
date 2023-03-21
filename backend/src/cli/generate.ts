import { program } from 'commander'
import { Controller } from '../Controller'
import { formatUnits } from 'ethers/lib/utils'
import { DateTime } from 'luxon'

program
  .command('generate')
  .description('Generate merkle data')
  .option('--start-timestamp <value>', 'Start timestamp in seconds')
  .option('--end-timestamp <value>', 'End timestamp in seconds')
  .option('--poll-interval <value>', 'Poll interval in seconds')
  .option('--network <network>', 'Network chain, (ie optimism)')
  .option('--rewards-contract <address>', 'Rewards contract address')
  .option('--rewards-contract-network <network>', 'Rewards contract network')
  .option('--log-token-prices [boolean]', 'Log token prices')
  .option('--log-address-data [boolean]', 'Log addresses data')
  .option('--instance-type <string>', 'Instance type. Options are: fee-refund')
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
  const instanceType = options.instanceType || 'fee-refund'

  let instance : any
  let controller : any
  if (instanceType === 'fee-refund') {
    const { FeeRefundInstance } = require('../instances/feeRefund/FeeRefund')
    controller = new Controller(options.network, options.rewardsContract, options.rewardsContractNetwork)
    instance = new FeeRefundInstance(controller)
  }

  if (!(controller && instance)) {
    throw new Error('invalid instance type')
  }

  console.log('source code:', 'https://github.com/hop-protocol/merkle-drop-framework')
  console.log('network:', options.network)
  console.log('rewardsContract:', options.rewardsContract)
  console.log('startTimestamp:', startTimestamp)
  console.log('endTimestamp:', endTimestamp)

  const { tree, total, onchainPreviousTotalAmount, calldata, totalAccounts } = await controller.generateRoot({ shouldWrite: false, startTimestamp, endTimestamp, logResult: !!options.logAddressData, writeResultToTempFile: true })
  const rootHash = tree.getHexRoot()
  console.log('----------------')
  console.log('startTimestamp:', startTimestamp)
  console.log('endTimestamp:', endTimestamp)
  console.log('root:', rootHash)
  console.log('total:', `${total.toString()} (${formatUnits(total.toString(), 18)})`)
  console.log('totalAccounts:', totalAccounts)
  console.log('onchainPreviousTotalAmount:', `${onchainPreviousTotalAmount.toString()} (${formatUnits(onchainPreviousTotalAmount.toString(), 18)})`)
  console.log('calldata:', JSON.stringify(calldata))
  console.log('----------------')
  console.log('done')

  if (options.logTokenPrices) {
    const tokens = ['OP', 'ETH', 'USDC', 'USDT', 'DAI', 'SNX']
    for (const token of tokens) {
      for (let i = 1; i < 60; i++) {
        const dt = DateTime.now().toUTC().startOf('day').minus({ days: i })
        const timestamp = Math.floor(dt.toSeconds())
        const tokenPrice = await instance.getTokenPrice(token, timestamp, startTimestamp)
        console.log('tokenPrice:', token, tokenPrice, dt.toString(), timestamp)
      }
    }
  }
}
