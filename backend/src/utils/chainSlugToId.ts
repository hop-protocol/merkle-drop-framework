import { getNetwork } from '@hop-protocol/fee-refund'
import { config } from '../config.js'

export function chainSlugToId (chainSlug: string) {
  const net = getNetwork(config.network as any)
  return net.chains[chainSlug]?.chainId
}
