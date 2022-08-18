export const merkleBaseUrl = ''
export const port = Number(process.env.PORT || 8000)
export const ipRateLimitReqPerSec = Number(process.env.IP_RATE_LIMIT_REQ_PER_SEC || 100)
export const ipRateLimitWindowMs = Number(process.env.IP_RATE_LIMIT_WINDOW_MS || 1 * 1000)
export const forumBaseUrl = process.env.FORUM_BASE_URL ?? 'http://localhost:4200'
export const forumUsername = process.env.FORUM_USERNAME
export const forumApiKey = process.env.FORUM_API_KEY
