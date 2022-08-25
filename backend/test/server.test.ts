import fetch from 'isomorphic-fetch'

describe.skip('server', () => {
  it('return rewards amount', async () => {
    const payload = {
      address: '0x9997da3de3ec197c853bcc96caecf08a81de9d69'
    }

    const query = new URLSearchParams(payload).toString()
    const url = `http://localhost:8000/v1/rewards?${query}`
    console.log(url)
    const res = await fetch(url)
    const json = await res.json()
    console.log(json)
    expect(json.data.rewards.balance).toBeTruthy()
    expect(json.data.rewards.proof).toBeTruthy()
  })
  it('return refund amount', async () => {
    const payload = {
      gasLimit: '144561',
      gasPrice: '9408027411',
      amount: '1000000000000000',
      token: 'ETH',
      bonderFee: '0',
      fromChain: 'mainnet'
    }

    const query = new URLSearchParams(payload).toString()
    const url = `http://localhost:8000/v1/refund-amount?${query}`
    console.log(url)
    const res = await fetch(url)
    const json = await res.json()
    console.log(json)
    expect(json.data.refund.amount).toBeTruthy()
  })
})
