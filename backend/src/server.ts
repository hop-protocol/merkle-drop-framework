import express from 'express'
import { port } from './config'
import cors from 'cors'
import { ipRateLimitMiddleware } from './rateLimit'

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

app.get('/v1/data', async (req: any, res: any) => {
  try {
    res.status(200).json({ status: 'ok' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

const argv = require('minimist')(process.argv.slice(2))
console.debug('flags:', argv)

if (argv.worker) {
}

const host = '0.0.0.0'
app.listen(port, host, () => {
  console.log(`Listening on port ${port}`)
})
