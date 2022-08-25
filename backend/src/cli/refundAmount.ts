import { program } from 'commander'
import { Controller } from '../Controller'

program
  .command('refund-amount')
  .description('get refund amount')
  .action(async (source: any) => {
    try {
      await main(source)
    } catch (err) {
      console.error(err)
    }
  })

async function main (options: any = {}) {
  console.log('options:', options)

  // test data
  const transfer = {
    gasLimit: '144561',
    gasPrice: '9408027411',
    timestamp: 1660793656,
    amount: '1000000000000000',
    token: 'ETH',
    bonderFee: 0,
    chain: 'ethereum'
  }

  const controller = new Controller(options.network, options.rewardsContract)
  const refundAmount = await controller.getRefundAmount(transfer)
  console.log(refundAmount.toString())
}
