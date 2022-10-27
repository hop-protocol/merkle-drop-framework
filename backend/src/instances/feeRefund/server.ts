import { responseCache } from '../../responseCache'
import { feeRefund } from './instance'

export function setAdditionalRoutes (app: any) {
  app.get('/v1/refund-amount', responseCache, async (req: any, res: any) => {
    try {
      const {
        gasCost,
        gasLimit,
        gasPrice,
        amount,
        token,
        bonderFee,
        fromChain
      } = req.query

      if (!gasCost) {
        if (!gasLimit) {
          throw new Error('gasLimit is required')
        }

        if (!gasPrice) {
          throw new Error('gasPrice is required')
        }
      }

      if (!amount) {
        throw new Error('amount is required')
      }

      if (!token) {
        throw new Error('token is required')
      }

      if (!bonderFee) {
        throw new Error('bonderFee is required')
      }

      if (!fromChain) {
        throw new Error('fromChain is required')
      }

      const transfer = {
        gasCost: gasCost?.toString(),
        gasLimit: gasLimit?.toString(),
        gasPrice: gasPrice?.toString(),
        timestamp: Math.floor(Date.now() / 1000),
        amount: amount.toString(),
        token,
        bonderFee: bonderFee.toString(),
        chain: fromChain.toString()
      }

      const {
        totalUsdCost,
        price,
        refundAmount,
        refundAmountAfterDiscount,
        refundAmountAfterDiscountUsd,
        refundTokenSymbol,
        sourceTxCostUsd,
        bonderFeeUsd,
        ammFeeUsd
      } = await feeRefund.getRefundAmount(transfer)

      const negativeBuffer = 0.80 // minus 20% for UI estimate
      const data = {
        refund: {
          costInUsd: totalUsdCost,
          costInRefundToken: refundAmount,
          refundTokenPrice: price,
          refundAmountInRefundToken: refundAmountAfterDiscount * negativeBuffer,
          refundAmountInUsd: refundAmountAfterDiscountUsd * negativeBuffer,
          refundTokenSymbol,
          sourceTxCostUsd,
          bonderFeeUsd,
          ammFeeUsd
        }
      }
      res.status(200).json({ status: 'ok', data })
    } catch (err) {
      if (!/Invalid Entry/gi.test(err?.message)) {
        console.error('/refund-amount request error:', err)
      }
      res.status(400).json({ error: err.message })
    }
  })
}
