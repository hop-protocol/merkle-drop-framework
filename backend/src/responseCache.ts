import mcache from 'memory-cache'

const durationMs = 10 * 1000

export function responseCache (req: any, res: any, next: any) {
  const urlKey = req.originalUrl || req.url
  const key = `__express__${urlKey}`
  const cachedBody = mcache.get(key)
  if (cachedBody) {
    console.log('cache hit:', key)
    res.send(cachedBody)
    return
  }

  res.sendResponse = res.send
  res.send = (body: any) => {
    try {
      const parsed = JSON.parse(body)
      if (parsed.data) {
        console.log('cached:', key)
        mcache.put(key, body, durationMs)
      }
    } catch (err) { }
    res.sendResponse(body)
  }

  next()
}
