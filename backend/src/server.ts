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

const argv = require('minimist')(process.argv.slice(2))
console.debug('flags:', argv)

if (argv.worker) {
  console.log('todo')
}

const host = '0.0.0.0'
app.listen(port, host, () => {
  console.log(`Listening on port ${port}`)
})