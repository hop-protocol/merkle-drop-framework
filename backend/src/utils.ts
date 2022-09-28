import { config } from './config'

export function chainSlugToId (chainSlug: string) {
  let ids: any = {
    ethereum: 1,
    optimism: 10,
    arbitrum: 42161,
    gnosis: 100,
    polygon: 137
  }

  if (config.network === 'goerli') {
    ids = {
      ethereum: 5,
      optimism: 420,
      arbitrum: 421613,
      polygon: 80001
    }
  }

  return ids[chainSlug]
}
