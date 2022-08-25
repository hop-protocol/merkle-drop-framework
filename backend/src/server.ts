import express from 'express'
import { port } from './config'
import cors from 'cors'
import { ipRateLimitMiddleware } from './rateLimit'
import { getAddress } from 'ethers/lib/utils'
import { Controller } from './Controller'

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

app.get('/v1/rewards', async (req: any, res: any) => {
  try {
    let { address } = req.query
    if (!address) {
      throw new Error('address is requred')
    }
    address = getAddress(address)
    console.log('address:', address)
    const controller = new Controller()
    const rewards = await controller.getRewardsForAccount(address)
    const data = {
      address,
      rewards
    }
    res.status(200).json({ status: 'ok', data })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/v1/refund-amount', async (req: any, res: any) => {
  try {
    const {
      gasLimit,
      gasPrice,
      amount,
      token,
      bonderFee,
      fromChain
    } = req.query

    if (!gasLimit) {
      throw new Error('gasLimit is required')
    }

    if (!gasPrice) {
      throw new Error('gasPrice is required')
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

    const controller = new Controller()

    const transfer = {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      timestamp: Math.floor(Date.now() / 1000),
      amount: amount.toString(),
      token,
      bonderFee: bonderFee.toString(),
      chain: fromChain.toString()
    }

    const refundAmount = await controller.getRefundAmount(transfer)
    const data = {
      refund: {
        amount: refundAmount.toString()
      }
    }
    res.status(200).json({ status: 'ok', data })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export async function startServer () {
  const host = '0.0.0.0'
  app.listen(port, host, () => {
    console.log(`Listening on port ${port}`)
  })
}
