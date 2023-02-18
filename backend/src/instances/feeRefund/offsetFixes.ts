// this is to handle slight price difference discrepancy for account (off by a few cents) on github published root.
// This issue was orginally caused by not rounding fractions of token prices to 2 decimals in fee refund package,
// because coingecko api would return slightly different prices when querying at a later time causing undeterministic prices.

export function offsetFixes (result: Record<string, string>) {
  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x679480522fad173e50f5604f7ee114b6ea38c9ae687fdab6d5837ba7f7d6f3ac

  if (result['0x5efc12562565f87122eb451fec621bb997f4d9dd'] === '7218180569302015792') {
    result['0x5efc12562565f87122eb451fec621bb997f4d9dd'] = '7218180570376896310'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x4fb1b98791a22830f47d85de1ecefbda49ac4ab23f665a043c1c4ae8957ca9d8

  if (result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] === '5680374963235963026') {
    result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] = '5690270670903215311'
  }

  if (result['0xef4d3dd425c985bf4756be8e69733ef8988f8675'] === '4231006839109920037') {
    result['0xef4d3dd425c985bf4756be8e69733ef8988f8675'] = '4228027636380216059'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x2e9fcfe03606e0e0f09854ea1bbd8b894540af1a67fb52e2644b6228e041aca6

  if (result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] === '6006131131769983589') {
    result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] = '6016026839437235874'
  }

  if (result['0x61c708d28928a18a84851f815fdbbff8e137ca98'] === '1120106079591103143') {
    result['0x61c708d28928a18a84851f815fdbbff8e137ca98'] = '1120106080287928296'
  }

  if (result['0x737132193582198728515329dcb551088767b8de'] === '345149428958359206') {
    result['0x737132193582198728515329dcb551088767b8de'] = '345445232718322726'
  }

  if (result['0xaa71d845e6da88069f69e56be7421a77e2fa87b2'] === '318615009557284112') {
    result['0xaa71d845e6da88069f69e56be7421a77e2fa87b2'] = '318615009562104146'
  }

  if (result['0xd3c85eb21abc986053300851456c457b0fb88b15'] === '937608690285083757') {
    result['0xd3c85eb21abc986053300851456c457b0fb88b15'] = '939965804282735129'
  }

  if (result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] === '301301788842941509') {
    result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] = '302221944542915011'
  }

  if (result['0xfc2d9450ee35fc00ccc290e785d9e24bbacf7d86'] === '700087569526555154') {
    result['0xfc2d9450ee35fc00ccc290e785d9e24bbacf7d86'] = '701867448211757339'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x5cda1c29c1b9ca8c3a1bda215cc6fb89fefda5058c6fabde77fd4cf97b480130

  if (result['0x03142911da6456c041038e5b3964ea7b7bfb28af'] === '4831927620081823138') {
    result['0x03142911da6456c041038e5b3964ea7b7bfb28af'] = '4831935047007015649'
  }

  if (result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] === '2843103306004940933') {
    result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] = '2844023461704914435'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0xcfa9b5cbd664e43113e44bad75ab881b802580bb4b5289b3ba5084c49fe8e246

  if (result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] === '3470018434312672984') {
    result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] = '3475821024218329891'
  }

  if (result['0x190236c3840f258a95fe11e8c45e623dd8174e1e'] === '268493463083297301') {
    result['0x190236c3840f258a95fe11e8c45e623dd8174e1e'] = '266465227436841312'
  }

  if (result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] === '267834360748183731') {
    result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] = '267261396184453603'
  }

  if (result['0xa1029b5d1021a9bafd48234c1b8cbb8dbe7fd01f'] === '676135710932368517') {
    result['0xa1029b5d1021a9bafd48234c1b8cbb8dbe7fd01f'] = '681954872562865577'
  }

  if (result['0xf1d75e75e375d0656bedad4c0298f4c4668b3e21'] === '315842016464965680') {
    result['0xf1d75e75e375d0656bedad4c0298f4c4668b3e21'] = '321175117266767396'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x43bb366e6b61ae8f5fb702c8ab29c938349eea9961a86570720b66089909eaaa

  if (result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] === '3924330225410361806') {
    result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] = '3930132815316018713'
  }

  if (result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] === '6427328448541149375') {
    result['0x60c56ef505b8c9d7ac1c7f180a9006a5ea3c3875'] = '6437224156208401660'
  }

  if (result['0xd3c85eb21abc986053300851456c457b0fb88b15'] === '1244416409311115413') {
    result['0xd3c85eb21abc986053300851456c457b0fb88b15'] = '1246773523308766785'
  }

  if (result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] === '3251625753151451026') {
    result['0xe17b279d3891b48c36ef616a5f70a586e80b5b98'] = '3252545908851424528'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x72865d331afd5dfbaf9f4a5aa124b297c3cedbc8d3f395243e5f44c6ecb973ad

  if (result['0xaa71d845e6da88069f69e56be7421a77e2fa87b2'] === '498615009557284112') {
    result['0xaa71d845e6da88069f69e56be7421a77e2fa87b2'] = '498615009562104146'
  }

  // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0x12b40cfa56bb740a466b2e80363c8d8f61c6651b6f2b56f9ae28535287af2f36

  if (result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] === '507834360748183731') {
    result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] = '507261396184453603'
  }

  return result
}
