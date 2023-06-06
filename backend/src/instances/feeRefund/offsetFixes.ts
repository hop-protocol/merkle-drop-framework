// this is to handle slight price difference discrepancy for account (off by a few cents) on github published root.
// This issue was orginally caused by not rounding fractions of token prices to 2 decimals in fee refund package,
// because coingecko api would return slightly different prices when querying at a later time causing undeterministic prices.

export function offsetFixes (rewardsContractAddress: string, result: Record<string, string>) {
  if (rewardsContractAddress.toLowerCase() === '0x45269f59aa76bb491d0fc4c26f468d8e1ee26b73') {
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

    // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0xbe756b065ef97adf87ac10426134b49d2fd7a83bbc94128c01ed209a2d12a895

    if (result['0x05cef0858578b419091af98062b153ca0f2103d0'] === '210000000000000000') {
      result['0x05cef0858578b419091af98062b153ca0f2103d0'] = '220000000000000000'
    }

    if (result['0x0c9711684142c27cc0c9206f4c7886cceb17eb79'] === '190000000000000000') {
      result['0x0c9711684142c27cc0c9206f4c7886cceb17eb79'] = '200000000000000000'
    }

    if (result['0x11250da6e4147aea777fc4e87f1c04c203777255'] === '2020000000000000000') {
      result['0x11250da6e4147aea777fc4e87f1c04c203777255'] = '2040000000000000000'
    }

    if (result['0x2d4dbb65bfeb78bf33db8381b381f7e909a395be'] === '436683504480148108869') {
      result['0x2d4dbb65bfeb78bf33db8381b381f7e909a395be'] = '436763504480148108869'
    }

    if (result['0x3bb04a55ae6bce7d71827cbeb1b33d2122437835'] === '250000000000000000') {
      result['0x3bb04a55ae6bce7d71827cbeb1b33d2122437835'] = '260000000000000000'
    }

    if (result['0x48688736cf8819f648a3e0634a1f00130d8a46be'] === '530000000000000000') {
      result['0x48688736cf8819f648a3e0634a1f00130d8a46be'] = '540000000000000000'
    }

    if (result['0x48688736cf8819f648a3e0634a1f00130d8a46be'] === '530000000000000000') {
      result['0x48688736cf8819f648a3e0634a1f00130d8a46be'] = '540000000000000000'
    }

    if (result['0x4c4ea36abac2a5dc80948d0b004cf08e5232cf81'] === '1532622898049338358') {
      result['0x4c4ea36abac2a5dc80948d0b004cf08e5232cf81'] = '1542622898049338358'
    }

    if (result['0x4fc196638d7299eee6b1569ab4efa0d628013ec3'] === '2550000000000000000') {
      result['0x4fc196638d7299eee6b1569ab4efa0d628013ec3'] = '2560000000000000000'
    }

    if (result['0x50c0a9f5ac996f6618ac2a7e2831f0cbb10ecf30'] === '763576497045622617') {
      result['0x50c0a9f5ac996f6618ac2a7e2831f0cbb10ecf30'] = '773576497045622617'
    }

    if (result['0x5ddb25070b70268b0f152cad66a637c3fb0222c6'] === '142160000000000000000') {
      result['0x5ddb25070b70268b0f152cad66a637c3fb0222c6'] = '142380000000000000000'
    }

    if (result['0x606f217248e7d71e5b7efac2014af1a97796e194'] === '810000000000000000') {
      result['0x606f217248e7d71e5b7efac2014af1a97796e194'] = '820000000000000000'
    }

    if (result['0x6325a40a520d14a2e0d4c81ad438275c5d29d1c5'] === '5970000000000000000') {
      result['0x6325a40a520d14a2e0d4c81ad438275c5d29d1c5'] = '6030000000000000000'
    }

    if (result['0x736766b9a41aceea10c89aa93468d93b1aae1907'] === '8936484293599576144') {
      result['0x736766b9a41aceea10c89aa93468d93b1aae1907'] = '8946484293599576144'
    }

    if (result['0x7515c5bcc56400c3a68091064acc118b8047afca'] === '360000000000000000') {
      result['0x7515c5bcc56400c3a68091064acc118b8047afca'] = '370000000000000000'
    }

    if (result['0x793491fe4a7b25eee0065e484a52c7a0dfd8c0d9'] === '630364469217448369525') {
      result['0x793491fe4a7b25eee0065e484a52c7a0dfd8c0d9'] = '630514469217448369525'
    }

    if (result['0x7aaee75e1cf3079b7d49093b9651b362f8268734'] === '180000000000000000') {
      result['0x7aaee75e1cf3079b7d49093b9651b362f8268734'] = '190000000000000000'
    }

    if (result['0x8bd5a5b51b601d3cd9fc3b1e6ab29069a50764d5'] === '6026967018425431952') {
      result['0x8bd5a5b51b601d3cd9fc3b1e6ab29069a50764d5'] = '6036967018425431952'
    }

    if (result['0x8de7bb14218d4e1bf210a6eca81b0b8d9e82a0e4'] === '9017463051160959144') {
      result['0x8de7bb14218d4e1bf210a6eca81b0b8d9e82a0e4'] = '9027463051160959144'
    }

    if (result['0x90c510df6faee3b8c57f2175c30a6d28a327f57c'] === '160000000000000000') {
      result['0x90c510df6faee3b8c57f2175c30a6d28a327f57c'] = '170000000000000000'
    }

    if (result['0x9c39990672d8687f3920b41ac4d27934307f5485'] === '290000000000000000') {
      result['0x9c39990672d8687f3920b41ac4d27934307f5485'] = '300000000000000000'
    }

    if (result['0xb328d306c4bc5e55423df6c7185522c540765871'] === '48211457882110738120') {
      result['0xb328d306c4bc5e55423df6c7185522c540765871'] = '48221457882110738120'
    }

    if (result['0xb6847c148fcc41cd0edb72bba6e58c2ab583be23'] === '14720000000000000000') {
      result['0xb6847c148fcc41cd0edb72bba6e58c2ab583be23'] = '14740000000000000000'
    }

    if (result['0xb8ef3b0a34711f9c3b4c0aa6eb9c98169c178396'] === '140000000000000000') {
      result['0xb8ef3b0a34711f9c3b4c0aa6eb9c98169c178396'] = '150000000000000000'
    }

    if (result['0xcdbf1e7ed2ece766537aab5855d79b370e59e3b1'] === '180000000000000000') {
      result['0xcdbf1e7ed2ece766537aab5855d79b370e59e3b1'] = '190000000000000000'
    }

    if (result['0xcefedd6534fbcf4983283b4757c22c1f98095568'] === '360000000000000000') {
      result['0xcefedd6534fbcf4983283b4757c22c1f98095568'] = '370000000000000000'
    }

    if (result['0xdbd08d75a614567ff03f50e75b2a72ff9af35700'] === '133830000000000000000') {
      result['0xdbd08d75a614567ff03f50e75b2a72ff9af35700'] = '133970000000000000000'
    }

    if (result['0xfa007e88948944219b4a4c93de9efe55a9fa3e14'] === '677624605910053965') {
      result['0xfa007e88948944219b4a4c93de9efe55a9fa3e14'] = '687624605910053965'
    }

    // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0xe5a7dd16aba46491e5c5fede45c706387e13d44a1bbff22d9b89c837e8511786

    if (result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] === '4164330225410361806') {
      result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] = '4170132815316018713'
    }

    // https://github.com/hop-protocol/optimism-refund-merkle-rewards/tree/master/0xf997b65595b7fa3770c13fdeaa6ef8e2217eb74a604821a95fa0d6c89c765d87

    if (result['0x639973e8d33f7e9cc79b82ab92caafaa007bfd01'] === '800000000000000000') {
      result['0x639973e8d33f7e9cc79b82ab92caafaa007bfd01'] = '820000000000000000'
    }

    if (result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] === '4170132815357698373') {
      result['0x15c3d6298743e3115df3794f6da20ec4079d1eee'] = '4170132815316018713'
    }

    if (result['0x190236c3840f258a95fe11e8c45e623dd8174e1e'] === '266465227058373000') {
      result['0x190236c3840f258a95fe11e8c45e623dd8174e1e'] = '266465227436841312'
    }

    if (result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] === '507261396082267566') {
      result['0x9963fea7d54bf9d378a23420302c2f35314aac93'] = '507261396184453603'
    }

    if (result['0xf1d75e75e375d0656bedad4c0298f4c4668b3e21'] === '321175117705741198') {
      result['0xf1d75e75e375d0656bedad4c0298f4c4668b3e21'] = '321175117266767396'
    }

    if (result['0xfc2d9450ee35fc00ccc290e785d9e24bbacf7d86'] === '701867448211852763') {
      result['0xfc2d9450ee35fc00ccc290e785d9e24bbacf7d86'] = '701867448211757339'
    }
  }

  return result
}
