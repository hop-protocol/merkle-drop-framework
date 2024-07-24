import { getNetwork } from '@hop-protocol/fee-refund'

export function getDefaultRpcUrl (network: string, chain: string) {
  const net = getNetwork(network as any)
  return net.chains[chain]?.publicRpcUrl
}
