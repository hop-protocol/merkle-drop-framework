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
import { formatEther, formatUnits } from 'ethers/lib/utils'
import merkleRewardsAbi from './abi/MerkleRewards.json'
import { ShardedMerkleTree } from './merkle'

const rpcUrl = 'https://goerli.rpc.authereum.com'
const requiredChainId = 5
const networkName = 'goerli'

function App () {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [claimRecipient, setClaimRecipient] = useState('')
  const [sending, setSending] = useState(false)
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('-')
  const [claimableAmount, setClaimableAmount] = useState('')
  const [onchainRoot, setOnchainRoot] = useState('')
  const [latestRoot, setLatestRoot] = useState('')
  const [latestRootTotal, setLatestRootTotal] = useState('')
  const [merkleBaseUrl, setMerkleBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('merkleBaseUrl') || ''
    } catch (err) {
    }
    return ''
  })
  const [calldata, setCalldata] = useState('')
  const [rewardsContractAddress, setRewardsContractAddress] = useState(() => {
    try {
      return localStorage.getItem('rewardsContractAddress') || ''
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
      const _provider = new providers.StaticJsonRpcProvider(rpcUrl)
      return _provider
      // return new providers.Web3Provider((window as any).ethereum)
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
    try {
      localStorage.setItem('rewardsContractAddress', rewardsContractAddress || '')
    } catch (err) {
    }
  }, [rewardsContractAddress])
  useEffect(() => {
    try {
      localStorage.setItem('merkleBaseUrl', merkleBaseUrl || '')
    } catch (err) {
    }
  }, [merkleBaseUrl])

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
      const res = await fetch(`${merkleBaseUrl}/latest.json`)
      const json = await res.json()
      setLatestRoot(json.root)
      const { root, total } = await ShardedMerkleTree.fetchRootFile(merkleBaseUrl, json.root)
      if (root === json.root) {
        setLatestRootTotal(formatUnits(total, 18))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getLatestRoot().catch(console.error)
  }, [contract, merkleBaseUrl])

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
      if (claimRecipient) {
        const shardedMerkleTree = await ShardedMerkleTree.fetchTree(merkleBaseUrl, onchainRoot)
        const [entry] = await shardedMerkleTree.getProof(claimRecipient)
        if (!entry) {
          return
        }
        const total = BigNumber.from(entry.balance)
        const withdrawn = await contract.withdrawn(claimRecipient)
        const amount = total.sub(withdrawn)
        setClaimableAmount(formatUnits(amount, 18))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getClaimableAmount().catch(console.error)
  }, [contract, claimRecipient, onchainRoot, merkleBaseUrl])

  useInterval(getClaimableAmount, 5 * 1000)

  async function checkCorrectNetwork () {
    const provider = new providers.Web3Provider((window as any).ethereum)
    const network = await provider.getNetwork()
    const isCorrectNetwork = network.chainId === requiredChainId
    if (!isCorrectNetwork) {
      throw new Error(`Please connect to ${networkName} network`)
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
      if (!merkleBaseUrl) {
        return
      }
      await checkCorrectNetwork()

      const { root, total } = await ShardedMerkleTree.fetchRootFile(merkleBaseUrl, latestRoot)
      const totalAmount = BigNumber.from(total)
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
              network: {networkName}
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
              latest repo merkle root: {latestRoot}
            </Typography>
          </Box>
          <Box mb={2} display="flex">
            <Typography variant="body2">
              latest repo merkle root total: {latestRootTotal}
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
      </Box>
    </Box>
  )
}

export default App
