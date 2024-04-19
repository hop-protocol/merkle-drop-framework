import { networks } from '@hop-protocol/fee-refund'
import { config } from '../config.js'

const { mainnet: mainnetAddresses, goerli: goerliAddresses } = networks

const nets = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function chainSlugToId (chainSlug: string) {
  return nets[config.network][chainSlug].networkId
}
