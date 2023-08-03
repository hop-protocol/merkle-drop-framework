import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/addresses'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getChainSlugs (network: string) {
  const bridges = networks[network].bridges
  const set = new Set([])
  for (const tokenSymbol in bridges) {
    for (const chain in bridges[tokenSymbol]) {
      set.add(chain)
    }
  }
  return Array.from(set)
}
