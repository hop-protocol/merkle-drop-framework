import express from 'express'
import { port, config } from './config'
import cors from 'cors'
import { ipRateLimitMiddleware } from './rateLimit'
import { getAddress } from 'ethers/lib/utils'
import { responseCache } from './responseCache'
import { controller } from './instance'

const app = express()

app.enable('trust proxy')
app.use(cors())
app.use(express.json({ limit: '500kb' }))
app.use(express.urlencoded({ extended: false, limit: '500kb', parameterLimit: 50 }))
app.use(ipRateLimitMiddleware)

app.use('/static', express.static('static'))

app.get('/', (req: any, res: any) => {
  res.status(404).json({ error: 'not found' })
})

app.get('/health', (req: any, res: any) => {
  res.status(200).json({ status: 'ok' })
})

app.get('/v1/rewards', responseCache, async (req: any, res: any) => {
  try {
    let { address } = req.query
    if (!address) {
      throw new Error('address is requred')
    }
    address = getAddress(address)
    console.log('address:', address)
    const rewards = await controller.getRewardsForAccount(address)
    const data = {
      address,
      rewards
    }
    res.status(200).json({ status: 'ok', data })
  } catch (err) {
    console.error('request error:', err)
    res.status(400).json({ error: err.message })
  }
})

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
    } = await controller.getRefundAmount(transfer)
    const data = {
      refund: {
        costInUsd: totalUsdCost,
        costInRefundToken: refundAmount,
        refundTokenPrice: price,
        refundAmountInRefundToken: refundAmountAfterDiscount,
        refundAmountInUsd: refundAmountAfterDiscountUsd,
        refundTokenSymbol,
        sourceTxCostUsd,
        bonderFeeUsd,
        ammFeeUsd
      }
    }
    res.status(200).json({ status: 'ok', data })
  } catch (err) {
    console.error('request error:', err)
    res.status(400).json({ error: err.message })
  }
})

app.get('/v1/rewards-info', async (req: any, res: any) => {
  try {
    const estimatedTimeMsTilCheckpoint = await controller.getRemainingTimeTilCheckpoint()
    const estimatedDateMs = Date.now() + estimatedTimeMsTilCheckpoint
    const data = {
      estimatedTimeMsTilCheckpoint,
      estimatedDateMs
    }

    res.json({ data })
  } catch (err) {
    console.error('request error:', err)
    res.status(400).json({ error: err.message })
  }
})

export async function startServer () {
  const host = '0.0.0.0'
  app.listen(port, host, () => {
    console.log(`Listening on port ${port}`)
  })
}
