import mcache from 'memory-cache'
import { disableResponseCache, responseCacheDurationMs } from './config'

export function responseCache (req: any, res: any, next: any) {
  const urlKey = req.originalUrl || req.url
  const key = `__express__${urlKey}`
  const cachedBody = mcache.get(key)
  if (cachedBody && !disableResponseCache) {
    // console.log('cache hit:', key)
    res.send(cachedBody)
    return
  }

  res.sendResponse = res.send
  res.send = (body: any) => {
    try {
      const parsed = JSON.parse(body)
      if (parsed.data) {
        // console.log('cached:', key)
        mcache.put(key, body, responseCacheDurationMs)
      }
    } catch (err) { }
    res.sendResponse(body)
  }

  next()
}
