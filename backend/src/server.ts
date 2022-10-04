import express from 'express'
import { port } from './config'
import cors from 'cors'
import { ipRateLimitMiddleware } from './rateLimit'
import { getAddress } from 'ethers/lib/utils'
import { responseCache } from './responseCache'
import { DateTime } from 'luxon'

export async function startServer () {
  const { controller, setAdditionalRoutes } = require('./instance')
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
      // console.log('address:', address)
      const rewards = await controller.getRewardsForAccount(address)
      const data = {
        address,
        rewards
      }
      res.status(200).json({ status: 'ok', data })
    } catch (err) {
      if (!/Invalid Entry/gi.test(err?.message)) {
        console.error('/rewards request error:', err)
      }
      res.status(400).json({ error: err.message })
    }
  })

  app.get('/v1/rewards-info', async (req: any, res: any) => {
    try {
      const [estimatedTimeMsTilCheckpoint, lockedRewards] = await Promise.all([
        controller.getRemainingTimeTilCheckpoint(),
        controller.getLockedRewards()
      ])
      const estimatedDateMs = Date.now() + estimatedTimeMsTilCheckpoint

      const end = DateTime.fromMillis(estimatedDateMs)
      const now = DateTime.now()
      const remaining = end.diff(now)
      const countdownFormatted = remaining.toFormat("d'd' h'h' m'm' ss")

      const data = {
        estimatedTimeMsTilCheckpoint,
        estimatedDateMs,
        lockedRoot: lockedRewards.root,
        lockedTotal: lockedRewards.total.toString(),
        lockedTotalFormatted: lockedRewards.totalFormatted,
        countdownMs: remaining.seconds,
        countdownFormatted,
        checkpointIntervalMs: controller.checkpointIntervalMs
      }

      res.json({ data })
    } catch (err) {
      console.error('/rewards-info request error:', err)
      res.status(400).json({ error: err.message })
    }
  })

  setAdditionalRoutes(app)

  const host = '0.0.0.0'
  app.listen(port, host, () => {
    console.log(`Listening on port ${port}`)
  })
}
