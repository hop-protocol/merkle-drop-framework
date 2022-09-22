import { FeeRefund } from '@hop-protocol/fee-refund'
import { config } from '../../config'
import fs from 'fs'
import path from 'path'

const feesDbPath = process.env.FEES_DB_PATH || __dirname

export class OptimismFeeRefund {
  controller: any

  constructor (controller: any) {
    this.controller = controller
    this.controller.setGetDataFromPackage(this.getDataFromPackage.bind(this))
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

    const refundChain = 'optimism'
    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)

    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain, refundTokenSymbol, maxRefundAmount }
    const feeRefund = new FeeRefund(_config)

    const id = Date.now()

    console.log('seeding')
    console.time('seeding ' + id)
    await feeRefund.seed()
    console.timeEnd('seeding ' + id)
    console.log('calculating fees')
    console.time('calculateFees ' + id)
    const result = await feeRefund.calculateFees(endTimestamp)
    const filtered = result

    // for testing
    // TODO: remove when live
    /*
    filtered = {
      '0x9997da3de3ec197c853bcc96caecf08a81de9d69': result['0x9997da3de3ec197c853bcc96caecf08a81de9d69']
    }
    */

    console.timeEnd('calculateFees ' + id)
    console.log('getData done', result)
    console.log('filtered', filtered)
    return { data: filtered }
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

    const refundChain = 'optimism'
    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)

    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp: this.controller.startTimestamp, refundPercentage, refundChain, refundTokenSymbol, maxRefundAmount }
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
}
