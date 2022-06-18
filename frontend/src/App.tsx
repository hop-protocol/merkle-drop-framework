import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useInterval } from 'react-use'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LoadingButton from '@mui/lab/LoadingButton'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import './App.css'
import { Contract, BigNumber, providers, Wallet } from 'ethers'
import { keccak256, formatEther, formatUnits } from 'ethers/lib/utils'
import merkleRewardsAbi from './abi/MerkleRewards.json'
import { ShardedMerkleTree } from './merkle'
import { merkleLatestRootUrl } from './config'

const rpcUrl = 'https://goerli.rpc.authereum.com'
const requiredChainId = 5
const networkName = 'goerli'
export const rewardsContractAddress = '0xbBd7842391Bd2f8FFa6b625eEC4491b7712DA814'

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
  const [wallet, setWallet] = useState(() => {
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
    return new Contract(rewardsContractAddress, merkleRewardsAbi, wallet)
  }, [wallet])

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
      updateBalanceCb()
    }
  }, [address, updateBalanceCb])

  useInterval(updateBalance, 5 * 1000)

  useEffect(() => {
    const update = async () => {
      if (contract) {
        const root = await contract.merkleRoot()
        setOnchainRoot(root)
      }
    }
    update().catch(console.error)
  }, [contract])

  useEffect(() => {
    const update = async () => {
      const res = await fetch(merkleLatestRootUrl)
      const json = await res.json()
      setLatestRoot(json.root)
    }
    update().catch(console.error)
  }, [contract])

  useEffect(() => {
    const update = async () => {
      setAddress('')
      if (wallet) {
        const _address = await wallet.getAddress()
        setAddress(_address)
      }
    }
    update().catch(console.error)
  }, [wallet])

  useEffect(() => {
    const update = async () => {
      setClaimableAmount('')
      if (claimRecipient) {
        const shardedMerkleTree = await ShardedMerkleTree.fetchTree()
        const [entry] = await shardedMerkleTree.getProof(claimRecipient)
        if (!entry) {
          return
        }
        const total = BigNumber.from(entry.balance)
        const withdrawn = await contract.withdrawn(claimRecipient)
        const amount = total.sub(withdrawn)
        setClaimableAmount(formatUnits(amount, 18))
      }
    }
    update().catch(console.error)
  }, [contract, claimRecipient])

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
      if (!provider) {
        return
      }
      if (!address) {
        return
      }
      if (!claimRecipient) {
        return
      }
      setSending(true)
      await checkCorrectNetwork()

      const shardedMerkleTree = await ShardedMerkleTree.fetchTree()
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

  return (
    <Box>
      <Box width="400px" p={4} m="0 auto" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Box mb={4}>
          <Typography variant="h4">
            Merkle Drop
          </Typography>
        </Box>
        {!!address && (
          <Box display="flex" flexDirection="column">
            <Box mb={2} display="flex">
              <Typography variant="body2">
                network: {networkName}
              </Typography>
            </Box>
            <Box mb={2} display="flex">
              <Typography variant="body2">
                address: {address}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2">
                balance: <span>{balance} ETH</span>
              </Typography>
            </Box>
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
          </Box>
        )}
        {!address && (
          <Box mb={4}>
            <Button onClick={connect} variant="contained">Connect</Button>
          </Box>
        )}
        {!!wallet && (
          <Box mt={20} mb={4} display="flex" flexDirection="column">
            <Box mb={2}>
              <TextField style={{ width: '420px' }} value={claimRecipient} onChange={(event: any) => {
                setClaimRecipient(event.target.value)
              }} label="Claim address" placeholder="0x..."/>
            </Box>
            <Box>
              <LoadingButton variant="contained" onClick={claim} loading={sending}>Claim</LoadingButton>
            </Box>
            <Box mb={2} display="flex">
              <Typography variant="body2">
                claimable amount: {claimableAmount}
              </Typography>
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
