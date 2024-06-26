import express from 'express'
import { port } from './config.js'
import cors from 'cors'
import { ipRateLimitMiddleware } from './rateLimit.js'
import { getAddress } from 'ethers/lib/utils.js'
import { responseCache } from './responseCache.js'
import { DateTime } from 'luxon'

export async function startServer () {
  const { controller, setAdditionalRoutes } = await import('./instance.js')
  const app = express()

  app.enable('trust proxy')
  app.use(cors())
  app.use(express.json({ limit: '500kb' }))
  app.use(express.urlencoded({ extended: false, limit: '500kb', parameterLimit: 50 }))
  app.options('*', cors())

  app.use('/static', ipRateLimitMiddleware, express.static('static'))

  app.get('/', ipRateLimitMiddleware, (req: any, res: any) => {
    res.status(404).json({ error: 'not found' })
  })

  app.get('/health', ipRateLimitMiddleware, (req: any, res: any) => {
    res.status(200).json({ status: 'ok' })
  })

  app.get('/v1/rewards', ipRateLimitMiddleware, responseCache, async (req: any, res: any) => {
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

  app.get('/v1/rewards-info', ipRateLimitMiddleware, async (req: any, res: any) => {
    try {
      // console.log('/rewards-info getting estimatedTimeMsTilCheckpoint lockedRewards')
      const [estimatedTimeMsTilCheckpoint, lockedRewards, repoRootInfo] = await Promise.all([
        controller.getRemainingTimeTilCheckpoint(),
        controller.getLockedRewards(),
        controller.getRepoRootInfo()
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
        onchainRootTotalAmountFormatted: lockedRewards.onchainRootTotalAmountFormatted,
        repoLatestRoot: repoRootInfo.repoLatestRoot,
        repoLatestRootTotal: repoRootInfo.repoLatestRootTotal.toString()
      }

      res.json({ data })
    } catch (err) {
      console.error('/rewards-info request error:', err)
      res.status(200).json({ error: err.message })
    }
  })

  app.get('/v1/tx-info', responseCache, async (req: any, res: any) => {
    try {
      const { chain, hash } = req.query
      if (!chain) {
        throw new Error('chain is requred')
      }
      if (!hash) {
        throw new Error('hash is requred')
      }
      const info = await controller.getTxInfo(chain, hash)
      const data = info
      res.status(200).json({ status: 'ok', data })
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  })

  setAdditionalRoutes(app, { ipRateLimitMiddleware })

  const host = '0.0.0.0'
  app.listen(port, host, () => {
    console.log(`Listening on port ${port}`)
  })
}
