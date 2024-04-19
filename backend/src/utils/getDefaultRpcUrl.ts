import { networks } from '@hop-protocol/fee-refund'

const { mainnet: mainnetAddresses, goerli: goerliAddresses } = networks

const nets = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getDefaultRpcUrl (network: string, chain: string) {
  return nets[network]?.[chain]?.publicRpcUrl
}
