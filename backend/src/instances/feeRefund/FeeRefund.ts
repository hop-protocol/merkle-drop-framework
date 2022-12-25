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

    if (result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] === '6006131131769983589') {
      result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] = '6016026839437235874'
    }

    if (result['0x61c708d28928a18a84851f815fdbbff8e137ca98'] === '1120106079591103143') {
      result['0x61c708d28928a18a84851f815fdbbff8e137ca98'] = '1120106080287928296'
    }

    if (result['0x737132193582198728515329dcb551088767b8de'] === '345149428958359206') {
      result['0x737132193582198728515329dcb551088767b8de'] = '345445232718322726'
    }

    if (result['0xaa71d845e6da88069f69e56be7421a77e2fa87b2'] === '318615009557284112') {
      result['0xaa71d845e6da88069f69e56be7421a77e2fa87b2'] = '318615009562104146'
    }

    if (result['0xd3c85eb21abc986053300851456c457b0fb88b15'] === '937608690285083757') {
      result['0xd3c85eb21abc986053300851456c457b0fb88b15'] = '939965804282735129'
    }

    if (result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] === '301301788842941509') {
      result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] = '302221944542915011'
    }

    if (result['0xfc2d9450ee35fc00ccc290e785d9e24bbacf7d86'] === '700087569526555154') {
      result['0xfc2d9450ee35fc00ccc290e785d9e24bbacf7d86'] = '701867448211757339'
    }

    if (result['0x03142911da6456c041038e5b3964ea7b7bfb28af'] === '4831927620081823138') {
      result['0x03142911da6456c041038e5b3964ea7b7bfb28af'] = '4831935047007015649'
    }

    if (result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] === '2843103306004940933') {
      result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] = '2844023461704914435'
    }

    if (result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] === '3470018434312672984') {
      result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] = '3475821024218329891'
    }

    if (result['0x190236c3840f258a95fe11e8c45e623dd8174e1e'] === '268493463083297301') {
      result['0x190236c3840f258a95fe11e8c45e623dd8174e1e'] = '266465227436841312'
    }

    if (result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] === '267834360748183731') {
      result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] = '267261396184453603'
    }

    if (result['0xa1029b5d1021a9bafd48234c1b8cbb8dbe7fd01f'] === '676135710932368517') {
      result['0xa1029b5d1021a9bafd48234c1b8cbb8dbe7fd01f'] = '681954872562865577'
    }

    if (result['0xf1d75e75e375d0656bedad4c0298f4c4668b3e21'] === '315842016464965680') {
      result['0xf1d75e75e375d0656bedad4c0298f4c4668b3e21'] = '321175117266767396'
    }

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
}
