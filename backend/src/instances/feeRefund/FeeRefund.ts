import { FeeRefund } from '@hop-protocol/fee-refund'
import fs from 'fs'
import path from 'path'

const feesDbPath = process.env.FEES_DB_PATH || '/tmp/feesdb'

export class OptimismFeeRefund {
  controller: any
  refundChain = 'optimism'

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

    const refundTokenSymbol = await this.controller.getTokenSymbol()
    const refundPercentage = Number(process.env.REFUND_PERCENTAGE || 0.8)
    const merkleRewardsContractAddress = this.controller.rewardsContractAddress
    const maxRefundAmount = Number(process.env.MAX_REFUND_AMOUNT || 20)

    const _config = { network: this.controller.network, dbDir, rpcUrls: this.controller.rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain: this.refundChain, refundTokenSymbol, maxRefundAmount, endTimestamp }
    console.log('feeRefund pkg config:', _config)
    const feeRefund = new FeeRefund(_config)

    const id = Date.now()

    console.log('seeding')
    console.time('seeding ' + id)
    await feeRefund.seed()
    console.timeEnd('seeding ' + id)
    console.log('calculating fees')
    console.time('calculateFees ' + id)
    const result = await feeRefund.calculateFees(endTimestamp)

    // handle slight price difference discrepancy for account on github published root
    if (result['0x5efc12562565f87122eb451fec621bb997f4d9dd'] === '7218180569302015792') {
      result['0x5efc12562565f87122eb451fec621bb997f4d9dd'] = '7218180570376896310'
    }
    if (result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] === '5680374963235963026') {
      result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] = '5690270670903215311'
    }
    if (result['0xef4d3dd425c985bf4756be8e69733ef8988f8675'] === '4231006839109920037') {
      result['0xef4d3dd425c985bf4756be8e69733ef8988f8675'] = '4228027636380216059'
    }

    console.timeEnd('calculateFees ' + id)
    if (options?.logResult) {
      console.log('getData done:', JSON.stringify(result))
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
}
