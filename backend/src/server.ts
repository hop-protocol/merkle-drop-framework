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
      let { address, history: shouldGetHistory } = req.query
      if (!address) {
        throw new Error('address is requred')
      }
      address = getAddress(address)
      // console.log('address:', address)
      const rewards = await controller.getRewardsForAccount(address)
      let history : any
      try {
        if (shouldGetHistory) {
          history = await controller.getHistoryForAccount(address)
        }
      } catch (err: any) {
        console.error('getHistoryForAccount error:', err)
      }
      const data = {
        address,
        rewards,
        history
      }
      res.status(200).json({ status: 'ok', data })
    } catch (err) {
      if (!/Invalid Entry/gi.test(err?.message)) {
        console.error('/rewards request error:', err)
      }
      res.status(200).json({ error: err.message })
    }
  })

  app.get('/v1/rewards-info', async (req: any, res: any) => {
    try {
      // console.log('/rewards-info getting estimatedTimeMsTilCheckpoint lockedRewards')
      const [estimatedTimeMsTilCheckpoint, lockedRewards] = await Promise.all([
        controller.getRemainingTimeTilCheckpoint(),
        controller.getLockedRewards()
      ])

      // console.log('/rewards-info done getting estimatedTimeMsTilCheckpoint lockedRewards')

      const extraTimeMs = 7 * 24 * 60 * 60 * 1000 // 1 week
      let estimatedDateMs = Date.now() + estimatedTimeMsTilCheckpoint
      const estimatedDateRelative = DateTime.fromMillis(estimatedDateMs).toRelative()
      const estimatedCheckpointEndTimestampMs = estimatedDateMs - extraTimeMs
      const estimatedCheckpointEndTimestampRelative = DateTime.fromMillis(estimatedCheckpointEndTimestampMs).toRelative()

      estimatedDateMs = estimatedDateMs + extraTimeMs // add extra time in order for multisig signers to publish root on chain

      const end = DateTime.fromMillis(estimatedDateMs)
      const now = DateTime.now()
      const remaining = end.diff(now)
      const countdownFormatted = remaining.toFormat("d'd' h'h' m'm' ss")
      const countdownRelative = end.toRelative()

      // console.log('/rewards-info returning response')

      const data = {
        estimatedTimeMsTilCheckpoint,
        estimatedDateMs,
        estimatedDateRelative,
        lockedRoot: lockedRewards.root,
        lockedRootTotal: lockedRewards.totalAmount.toString(),
        lockedRootTotalFormatted: lockedRewards.totalAmountFormatted,
        lockedRootAdditionalAmount: lockedRewards.additionalAmount.toString(),
        lockedRootAdditionalAmountFormatted: lockedRewards.additionalAmountFormatted,
        countdownSeconds: remaining.seconds,
        countdownFormatted,
        countdownRelative,
        checkpointIntervalMs: controller.checkpointIntervalMs,
        estimatedCheckpointEndTimestampMs,
        estimatedCheckpointEndTimestampRelative,
        onchainRoot: lockedRewards.onchainRoot,
        onchainRootTotalAmount: lockedRewards.onchainRootTotalAmount.toString(),
        onchainRootTotalAmountFormatted: lockedRewards.onchainRootTotalAmountFormatted
      }

      res.json({ data })
    } catch (err) {
      console.error('/rewards-info request error:', err)
      res.status(200).json({ error: err.message })
    }
  })

  setAdditionalRoutes(app)

  const host = '0.0.0.0'
  app.listen(port, host, () => {
    console.log(`Listening on port ${port}`)
  })
}
