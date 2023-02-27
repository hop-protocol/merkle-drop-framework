import { FeeRefund, SeedOptions } from '@hop-protocol/fee-refund'
import fs from 'fs'
import path from 'path'
import { offsetFixes } from './offsetFixes'
import { DateTime } from 'luxon'
import { promiseTimeout } from '../../utils/promiseTimeout'

const feesDbPath = process.env.FEES_DB_PATH || '/tmp/feesdb'

export class OptimismFeeRefund {
  controller: any
  refundChain = 'optimism'

  constructor (controller: any) {
    this.controller = controller
    this.controller.setGetDataFromPackage(this.getDataFromPackage.bind(this))
    this.controller.setGetHistoryForAccount(this.getHistoryForAccount.bind(this))
  }

  async getDataFromPackage (options: any): Promise<any> {
    const { startTimestamp, endTimestamp } = options
    if (!feesDbPath) {
      throw new Error('FEES_DB_PATH is required')
    }
    const dbDir = path.resolve(feesDbPath, 'db')

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)

    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain: this.refundChain, refundTokenSymbol, maxRefundAmount, endTimestamp }
    console.log('feeRefund pkg config:', _config)
    const feeRefund = new FeeRefund(_config)

    const id = Date.now()
    const seedOptions: SeedOptions = {}
    const hopTransfersStartTime = Number(process.env.HOP_TRANSERS_SYNC_START_TIME)
    if (hopTransfersStartTime) {
      seedOptions.hopTransfersStartTime = hopTransfersStartTime
    }

    console.log('seeding')
    console.time('seeding ' + id)
    await promiseTimeout(feeRefund.seed(seedOptions), 60 * 60 * 1000)
    console.timeEnd('seeding ' + id)
    console.log('calculating fees')
    console.time('calculateFees ' + id)
    let result = await feeRefund.calculateFees(endTimestamp)

    result = offsetFixes(result)

    console.timeEnd('calculateFees ' + id)
    if (options?.logResult) {
      console.log('getData done:', JSON.stringify(result))
    }

    if (options?.writeResultToTempFile) {
      try {
        if (!fs.existsSync('/outdir')) {
          fs.mkdirSync('/outdir', { recursive: true })
        }
        fs.writeFileSync('/outdir/out.json', JSON.stringify(result, null, 2))
      } catch (err) {
        console.log('file write error', err)
      }
    }

    return { data: result }
  }

  async getRefundAmount (transfer: any) {
    if (!this.controller.isStartTimestampReady()) {
      throw new Error('not ready yet')
    }

    if (!feesDbPath) {
      throw new Error('FEES_DB_PATH is required')
    }
    const dbDir = path.resolve(feesDbPath, 'db')

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)

    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp: this.controller.startTimestamp, refundPercentage, refundChain: this.refundChain, refundTokenSymbol, maxRefundAmount }
    const feeRefund = new FeeRefund(_config)

    if (transfer.chain === 'ethereum') {
      transfer.chain = 'mainnet'
    }

    if (transfer.chain === 'xdai') {
      transfer.chain = 'gnosis'
    }

    if (transfer.token === 'WETH') {
      transfer.token = 'ETH'
    }

    if (transfer.token === 'XDAI') {
      transfer.token = 'DAI'
    }

    if (transfer.token === 'WXDAI') {
      transfer.token = 'DAI'
    }

    if (transfer.token === 'WMATIC') {
      transfer.token = 'MATIC'
    }

    const _transfer: any = {
      amount: transfer.amount,
      gasCost: transfer.gasCost,
      gasUsed: transfer.gasLimit,
      gasPrice: transfer.gasPrice,
      chain: transfer.chain,
      timestamp: transfer.timestamp,
      bonderFee: transfer.bonderFee,
      token: transfer.token
    }

    const {
      totalUsdCost,
      price,
      refundAmount,
      refundAmountAfterDiscount,
      refundAmountAfterDiscountWei,
      refundAmountAfterDiscountUsd,
      refundTokenSymbol: _refundTokenSymbol,
      sourceTxCostUsd,
      bonderFeeUsd,
      ammFeeUsd
    } = await feeRefund.getRefundAmount(_transfer)
    return {
      totalUsdCost,
      price,
      refundAmount,
      refundAmountAfterDiscount,
      refundAmountAfterDiscountWei,
      refundAmountAfterDiscountUsd,
      refundTokenSymbol: _refundTokenSymbol,
      sourceTxCostUsd,
      bonderFeeUsd,
      ammFeeUsd
    }
  }

  async getTokenPrice (tokenSymbol: string, timestamp: number, startTimestamp: number) {
    const dbDir = path.resolve(feesDbPath, 'db')
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)
    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain: this.refundChain, refundTokenSymbol, maxRefundAmount }
    const feeRefund = new FeeRefund(_config)
    return feeRefund.getTokenPrice(tokenSymbol, timestamp)
  }

  async getHistoryForAccount (account: string) {
    const dbDir = path.resolve(feesDbPath, 'db')
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)
    const startTimestamp = this.controller.startTimestamp
    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain: this.refundChain, refundTokenSymbol, maxRefundAmount }
    const feeRefund = new FeeRefund(_config)
    const transfers = await feeRefund.getAccountHistory(account)
    return transfers?.sort((a: any, b: any) => b?.timestamp - a?.timestamp).map((x: any) => {
      if (x.timestamp) {
        const time = DateTime.fromSeconds(x.timestamp)
        x.timestampRelative = time.toRelative()
      }
      return { ...x }
    })
  }
}
