export const merkleBaseUrl = ''
export const port = Number(process.env.PORT || 8000)
export const ipRateLimitReqPerSec = Number(process.env.IP_RATE_LIMIT_REQ_PER_SEC || 100)
export const ipRateLimitWindowMs = Number(process.env.IP_RATE_LIMIT_WINDOW_MS || 1 * 1000)
export const forumBaseUrl = process.env.FORUM_BASE_URL ?? 'http://localhost:4200'
export const forumUsername = process.env.FORUM_USERNAME
export const forumApiKey = process.env.FORUM_API_KEY
export const config = {
  network: process.env.NETWORK,
  rewardsContractAddress: process.env.REWARDS_CONTRACT_ADDRESS,
  privateKey: process.env.PRIVATE_KEY,
  rewardsDataGitUrl: process.env.REWARDS_DATA_GIT_URL,
  rewardsDataOutputGitUrl: process.env.REWARDS_DATA_OUTPUT_GIT_URL,
  dataRepoPath: process.env.DATA_REPO_PATH,
  outputRepoPath: process.env.OUTPUT_REPO_PATH,
  feesDbPath: process.env.FEES_DB_PATH || __dirname,
  outputMerklePath: process.env.OUTPUT_MERKLE_PATH,
  checkpointIntervalMs: 0
}
