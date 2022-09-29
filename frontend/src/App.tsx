import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useInterval } from 'react-use'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LoadingButton from '@mui/lab/LoadingButton'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import './App.css'
import { Contract, BigNumber, providers } from 'ethers'
import { parseUnits, formatEther, formatUnits } from 'ethers/lib/utils'
import merkleRewardsAbi from './abi/MerkleRewards.json'
import { ShardedMerkleTree } from './merkle'
import erc20Abi from '@hop-protocol/core/abi/generated/ERC20.json'
import { useQueryParams } from './hooks/useQueryParams'

function App () {
  const { queryParams, updateQueryParams } = useQueryParams()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [claimRecipient, setClaimRecipient] = useState('')
  const [sending, setSending] = useState(false)
  const [requiredChainId, setRequiredChainId] = useState(() => {
    try {
      return Number(queryParams.chainId as string) || Number(localStorage.getItem('requiredChainId') || 5)
    } catch (err) {
    }
    return 5
  })
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('-')
  const [rewardsTokenAccountBalance, setRewardsTokenAccountBalance] = useState('-')
  const [claimableAmount, setClaimableAmount] = useState('')
  const [onchainRoot, setOnchainRoot] = useState('')
  const [latestRoot, setLatestRoot] = useState('')
  const [latestRootTotal, setLatestRootTotal] = useState('')
  const [rewardsTokenAddress, setRewardsTokenAddress] = useState('')
  const [token, setToken] = useState<any>(undefined)
  const [tokenDecimals, setTokenDecimals] = useState<number|null>(null)
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [newRootAdditionalAmount, setNewRootAdditionalAmount] = useState('')
  const [merkleBaseUrl, setMerkleBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('merkleBaseUrl') || queryParams.merkleBaseUrl as string || ''
    } catch (err) {
    }
    return ''
  })
  const [calldata, setCalldata] = useState('')
  const [rewardsContractAddress, setRewardsContractAddress] = useState(() => {
    try {
      return queryParams.rewardsContract as string || localStorage.getItem('rewardsContractAddress') || ''
    } catch (err) {
    }
    return ''
  })
  const [wallet] = useState(() => {
    if ((window as any).ethereum) {
      return new providers.Web3Provider((window as any).ethereum, 'any').getSigner()
    }
  })
  const [provider] = useState(() => {
    try {
      return new providers.Web3Provider((window as any).ethereum)
    } catch (err: any) {
      setError(err.message)
    }
  })
  const contract = useMemo(() => {
    try {
      if (rewardsContractAddress && (wallet || provider)) {
        return new Contract(rewardsContractAddress, merkleRewardsAbi, wallet || provider)
      }
    } catch (err) {
      console.error(err)
    }
  }, [provider, wallet, rewardsContractAddress])

  useEffect(() => {
    async function update() {
      if (contract) {
        const _token = new Contract(rewardsTokenAddress, erc20Abi, contract.provider)
        setToken(_token)
      }
    }
    update().catch(console.error)
  }, [contract, rewardsTokenAddress])
  useEffect(() => {
    try {
      localStorage.setItem('requiredChainId', requiredChainId?.toString() || '')
      updateQueryParams({ chainId: requiredChainId?.toString() })
    } catch (err) {
    }
  }, [requiredChainId])
  useEffect(() => {
    try {
      localStorage.setItem('rewardsContractAddress', rewardsContractAddress || '')
      updateQueryParams({ rewardsContract: rewardsContractAddress })
    } catch (err) {
    }
  }, [rewardsContractAddress])
  useEffect(() => {
    try {
      localStorage.setItem('merkleBaseUrl', merkleBaseUrl || '')
      updateQueryParams({ merkleBaseUrl: merkleBaseUrl })
    } catch (err) {
    }
  }, [merkleBaseUrl])
  useEffect(() => {
    async function update() {
      if (contract) {
        const _address = await contract.rewardsToken()
        setRewardsTokenAddress(_address)
      }
    }

    update().catch(console.error)
  }, [contract])
  useEffect(() => {
    async function update() {
      if (token) {
        setTokenDecimals(await token.decimals())
        setTokenSymbol(await token.symbol())
      }
    }

    update().catch(console.error)
  }, [token])
  useEffect(() => {
    async function update() {
      if (!(contract && latestRootTotal && tokenDecimals)) {
        setNewRootAdditionalAmount('')
        return
      }
      const previousTotalRewards = Number(formatUnits(await contract.currentTotalRewards(), tokenDecimals))
      const additionalAmount = Number(latestRootTotal) - previousTotalRewards
      setNewRootAdditionalAmount(additionalAmount.toString())
    }

    update().catch(console.error)
  }, [contract, latestRootTotal, tokenDecimals])

  const updateBalance = async () => {
    try {
      if (!provider) {
        return
      }
      if (!address) {
        return
      }
      const _balance = await provider.getBalance(address)
      setBalance(formatEther(_balance.toString()))
    } catch (err: any) {
      console.error(err.message)
    }
  }

  const updateBalanceCb = useCallback(updateBalance, [updateBalance])

  useEffect(() => {
    if (address) {
      updateBalanceCb().catch(console.error)
    }
  }, [address, updateBalanceCb])

  useInterval(updateBalance, 5 * 1000)

  const updateRewardsTokenBalance = async () => {
    try {
      if (!address) {
        return
      }
      if (!token) {
        return
      }
      if (!tokenDecimals) {
        return
      }
      const _balance = await token.balanceOf(address)
      setRewardsTokenAccountBalance(formatUnits(_balance.toString(), tokenDecimals))
    } catch (err: any) {
      console.error(err.message)
    }
  }

  const updateRewardsTokenBalanceCb = useCallback(updateRewardsTokenBalance, [updateRewardsTokenBalance])

  useEffect(() => {
    if (address) {
      updateRewardsTokenBalanceCb().catch(console.error)
    }
  }, [address, token, tokenDecimals, updateRewardsTokenBalanceCb])

  useInterval(updateBalance, 5 * 1000)

  const getOnchainRoot = async () => {
    try {
      if (contract) {
        const root = await contract.merkleRoot()
        setOnchainRoot(root)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getOnchainRoot().catch(console.error)
  }, [contract])

  useInterval(getOnchainRoot, 5 * 1000)

  const getLatestRoot = async () => {
    try {
      if (!merkleBaseUrl) {
        return
      }
      if (!tokenDecimals) {
        return
      }
      const url = `${merkleBaseUrl}/latest.json?cachebust=${Date.now()}`
      const res = await fetch(url)
      const json = await res.json()
      setLatestRoot(json.root)
      const { root, total } = await ShardedMerkleTree.fetchRootFile(merkleBaseUrl, json.root)
      if (root === json.root) {
        setLatestRootTotal(formatUnits(total, tokenDecimals))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getLatestRoot().catch(console.error)
  }, [contract, merkleBaseUrl, tokenDecimals])

  useInterval(getLatestRoot, 5 * 1000)

  const getWalletAddress = async () => {
    try {
      if (wallet) {
        const _address = await wallet.getAddress()
        setAddress(_address)
      } else {
        setAddress('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getWalletAddress().catch(console.error)
  }, [wallet])

  useInterval(getWalletAddress, 5 * 1000)

  const getClaimableAmount = async () => {
    try {
      setClaimableAmount('')
      if (!onchainRoot) {
        return
      }
      if (!contract) {
        return
      }
      if (!merkleBaseUrl) {
        return
      }
      if (!tokenDecimals) {
        return
      }
      if (claimRecipient) {
        const shardedMerkleTree = await ShardedMerkleTree.fetchTree(merkleBaseUrl, onchainRoot)
        const [entry] = await shardedMerkleTree.getProof(claimRecipient)
        if (!entry) {
          return
        }
        const total = BigNumber.from(entry.balance)
        const withdrawn = await contract.withdrawn(claimRecipient)
        const amount = total.sub(withdrawn)
        setClaimableAmount(formatUnits(amount, tokenDecimals))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getClaimableAmount().catch(console.error)
  }, [contract, claimRecipient, onchainRoot, merkleBaseUrl, tokenDecimals])

  useInterval(getClaimableAmount, 5 * 1000)

  useEffect(() => {
    async function update() {
      try {
        await checkCorrectNetwork()
      } catch (err) {
        setError(`invalid connected network. expected chain id ${requiredChainId}. Please connect to correct network and refresh page.`)
      }
    }

    update().catch(console.error)
  }, [requiredChainId])

  async function checkCorrectNetwork () {
    const provider = new providers.Web3Provider((window as any).ethereum)
    const network = await provider.getNetwork()
    const isCorrectNetwork = network.chainId === requiredChainId
    if (!isCorrectNetwork) {
      throw new Error(`Please connect to network id ${requiredChainId}`)
    }
  }

  async function connect () {
    try {
      setError('')
      if (!provider) {
        return
      }
      await checkCorrectNetwork()
      try {
        await provider.send('eth_requestAccounts', [])
      } catch (err) {
        console.error(err)
      }
      try {
        await (window as any).ethereum.enable()
      } catch (err) {
        console.error(err)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function claim () {
    try {
      if (!wallet) {
        return
      }
      if (!contract) {
        return
      }
      if (!provider) {
        return
      }
      if (!address) {
        return
      }
      if (!claimRecipient) {
        return
      }
      if (!onchainRoot) {
        return
      }
      if (!merkleBaseUrl) {
        return
      }
      setSending(true)
      await checkCorrectNetwork()

      const shardedMerkleTree = await ShardedMerkleTree.fetchTree(merkleBaseUrl, onchainRoot)
      const [entry, proof] = await shardedMerkleTree.getProof(claimRecipient)
      if (!entry) {
        throw new Error('no entry')
      }
      const totalAmount = BigNumber.from(entry.balance)
console.log(claimRecipient, totalAmount, proof)
      const tx = await contract.claim(claimRecipient, totalAmount, proof)
      setSuccess(`Sent ${tx.hash}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    }
    setSending(false)
  }

  async function getCalldata() {
    try {
      if (!contract) {
        return
      }
      if (!latestRoot) {
        return
      }
      if (!merkleBaseUrl) {
        return
      }
      await checkCorrectNetwork()

      const { root, total } = await ShardedMerkleTree.fetchRootFile(merkleBaseUrl, latestRoot)
      const totalAmount = BigNumber.from(total)
      const calldata = await contract.populateTransaction.setMerkleRoot(latestRoot, totalAmount)
      setCalldata(JSON.stringify(calldata, null, 2))
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    }
  }

  async function setMerkleRootTx() {
    try {
      if (!wallet) {
        return
      }
      if (!contract) {
        return
      }
      if (!provider) {
        return
      }
      if (!address) {
        return
      }
      if (!latestRoot) {
        return
      }
      if (!onchainRoot) {
        return
      }
      if (!merkleBaseUrl) {
        return
      }
      if (!token) {
        return
      }
      if (!tokenDecimals) {
        return
      }
      await checkCorrectNetwork()

      const owner = await contract.owner()
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`connected account must be contract owner. expected: ${owner}, got: ${address}`)
      }

      if (latestRoot === onchainRoot) {
        throw new Error('new root cannot be the same as existing onchain root. If you are not expecting this error then try clearing your browser cache')
      }

      const { root, total } = await ShardedMerkleTree.fetchRootFile(merkleBaseUrl, latestRoot)
      const totalAmount = BigNumber.from(total)

      const previousTotalRewards = await contract.currentTotalRewards()
      if (totalAmount.lt(previousTotalRewards)) {
        throw new Error(`new totalAmount (${formatUnits(totalAmount.toString(), tokenDecimals)}) must be greater than previousTotalRewards (${formatUnits(previousTotalRewards.toString(), tokenDecimals)})`)
      }

      const tokenBalance = await token.balanceOf(address)
      const additionalAmount = totalAmount.sub(previousTotalRewards)
      if (tokenBalance.lt(additionalAmount)) {
        throw new Error(`not enough rewards token balance to set merkle root. expected, ${formatUnits(additionalAmount.toString(), tokenDecimals)}, got: ${formatUnits(tokenBalance.toString(), tokenDecimals)}`)
      }

      const spender = contract.address
      const allowance = await token.allowance(address, spender)
      if (allowance.lt(totalAmount)) {
        console.log('approving token')
        const _tx = await token.connect(wallet).approve(spender, parseUnits('100', tokenDecimals))
        await _tx.wait()
      }
      console.log('sending setMerkleRoot tx')
      const tx = await contract.setMerkleRoot(latestRoot, totalAmount)
      setSuccess(`Sent ${tx.hash}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    }
  }

  return (
    <Box>
      <Box width="400px" p={4} m="0 auto" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Box mb={4}>
          <Typography variant="h4">
            Merkle Drop
          </Typography>
        </Box>
        <Box mb={4} display="flex" flexDirection="column">
          <Box mb={2} display="flex">
            <Typography variant="body2">
              required network: {requiredChainId}
            </Typography>
          </Box>
          {!!address && (
              <Box mb={2} display="flex">
                <Typography variant="body2">
                  account address: {address}
                </Typography>
              </Box>
          )}
          {!!address && (
            <Box mb={2}>
              <Typography variant="body2">
                account balance: <span>{balance} ETH</span>
              </Typography>
            </Box>
          )}
          <Box mb={2} display="flex">
            <Typography variant="body2">
              onchain merkle root: {onchainRoot}
            </Typography>
          </Box>
          <Box mb={2} display="flex">
            <Typography variant="body2">
              latest repo merkle root (may need to clear browser cache): {latestRoot}
            </Typography>
          </Box>
          <Box mb={2} display="flex">
            <Typography variant="body2">
              latest repo merkle root total: {latestRootTotal}
            </Typography>
          </Box>
          <Box mb={2} display="flex">
            <Typography variant="body2">
              latest repo merkle root additional amount: {newRootAdditionalAmount}
            </Typography>
          </Box>
          <Box mb={2} display="flex">
            <Typography variant="body2">
              rewards token: {tokenSymbol} ({tokenDecimals}) {rewardsTokenAddress}
            </Typography>
          </Box>
          <Box mb={2} display="flex">
            <Typography variant="body2">
              rewards token account balance: {rewardsTokenAccountBalance}
            </Typography>
          </Box>
        </Box>
        {!address && (
          <Box mb={4}>
            <Button onClick={connect} variant="contained">Connect</Button>
          </Box>
        )}
        <Box mb={4} display="flex" flexDirection="column">
          <Box mb={2}>
            <TextField style={{ width: '420px' }} value={requiredChainId.toString()} onChange={(event: any) => {
              setRequiredChainId(Number(event.target.value))
            }} label="Contract Chain ID" placeholder="5" />
          </Box>
        </Box>
        <Box mb={4} display="flex" flexDirection="column">
          <Box mb={2}>
            <TextField style={{ width: '420px' }} value={rewardsContractAddress} onChange={(event: any) => {
              setRewardsContractAddress(event.target.value)
            }} label="Merkle rewards contract address" placeholder="0x..."/>
          </Box>
        </Box>
        <Box mb={4} display="flex" flexDirection="column">
          <Box mb={2}>
            <TextField style={{ width: '520px' }} value={merkleBaseUrl} onChange={(event: any) => {
              setMerkleBaseUrl(event.target.value.replace(/\/$/, ''))
            }} label="Merkle data repo base url" placeholder="https://raw.githubusercontent.com/hop-protocol/merkle-data-output/master"/>
          </Box>
        </Box>
        {!!wallet && (
          <Box mb={4} display="flex" flexDirection="column">
            <Box mb={2}>
              <TextField style={{ width: '420px' }} value={claimRecipient} onChange={(event: any) => {
                setClaimRecipient(event.target.value)
              }} label="Claim address" placeholder="0x..."/>
            </Box>
            <Box mb={2}>
              <LoadingButton variant="contained" onClick={claim} loading={sending}>Claim</LoadingButton>
            </Box>
            {!!claimableAmount && (
              <Box mb={2} display="flex">
                <Typography variant="body2">
                  claimable amount: {claimableAmount}
                </Typography>
              </Box>
            )}
          </Box>
        )}
        <Box mb={4}>
          <Box mb={2}>
            <Button onClick={getCalldata} variant="contained">Get setMerkleRoot calldata</Button>
          </Box>
          {!!calldata && (
            <Box>
              <TextField style={{ width: '500px' }} multiline value={calldata} />
            </Box>
          )}
        </Box>
        {!!address && (
          <Box mb={4}>
            <Box mb={2}>
              <Button onClick={setMerkleRootTx} variant="contained">setMerkleRoot</Button>
            </Box>
          </Box>
        )}
        {!!error && (
          <Box mb={4} style={{ maxWidth: '400px', wordBreak: 'break-word' }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        {!!success && (
          <Box mb={4}>
            <Alert severity="success">{success}</Alert>
          </Box>
        )}
        <Box>
          <a href="https://github.com/hop-protocol/merkle-drop-framework/tree/master/frontend" target="_blank" rel="noopener noreferrer">Github</a>
        </Box>
      </Box>
    </Box>
  )
}

export default App
