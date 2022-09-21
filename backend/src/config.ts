require('dotenv').config()
export const port = Number(process.env.PORT || 8000)
export const ipRateLimitReqPerSec = Number(process.env.IP_RATE_LIMIT_REQ_PER_SEC || 100)
export const ipRateLimitWindowMs = Number(process.env.IP_RATE_LIMIT_WINDOW_MS || 1 * 1000)
export const forumBaseUrl = process.env.FORUM_BASE_URL ?? 'http://localhost:4200'
export const forumUsername = process.env.FORUM_USERNAME
export const forumApiKey = process.env.FORUM_API_KEY
export const disableResponseCache = process.env.DISABLE_RESPONSE_CACHE
export const responseCacheDurationMs = Number(process.env.RESPONSE_CACHE_DURATION_MS || 10 * 1000)
export const config = {
  network: process.env.NETWORK,
  rewardsContractAddress: process.env.REWARDS_CONTRACT_ADDRESS,
  rewardsContractNetwork: process.env.REWARDS_CONTRACT_NETWORK || 'mainnet',
  privateKey: process.env.PRIVATE_KEY,
  rewardsDataGitUrl: process.env.REWARDS_DATA_GIT_URL,
  rewardsDataOutputGitUrl: process.env.REWARDS_DATA_OUTPUT_GIT_URL,
  dataRepoPath: process.env.DATA_REPO_PATH,
  outputRepoPath: process.env.OUTPUT_REPO_PATH,
  feesDbPath: process.env.FEES_DB_PATH || __dirname,
  outputMerklePath: process.env.OUTPUT_MERKLE_PATH,
  checkpointIntervalMs: 0,
  merkleBaseUrl: process.env.MERKLE_BASE_URL
}
export const slackChannel = process.env.SLACK_CHANNEL
export const slackWarnChannel = process.env.SLACK_WARN_CHANNEL // optional
export const slackErrorChannel = process.env.SLACK_ERROR_CHANNEL // optional
export const slackInfoChannel = process.env.SLACK_INFO_CHANNEL // optional
export const slackLogChannel = process.env.SLACK_LOG_CHANNEL // optional
export const slackSuccessChannel = process.env.SLACK_SUCCESS_CHANNEL // optional
export const slackAuthToken = process.env.SLACK_AUTH_TOKEN
export const slackUsername = process.env.SLACK_USERNAME ?? 'Merkle Rewards Worker'
