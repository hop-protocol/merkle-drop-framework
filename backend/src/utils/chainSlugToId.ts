import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/networks'
import { config } from '../config'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function chainSlugToId (chainSlug: string) {
  return networks[config.network][chainSlug].networkId
}
