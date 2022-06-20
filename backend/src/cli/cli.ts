import { Controller } from '../Controller'

const controller = new Controller()

async function main () {
  await controller.pullRewardsDataFromRepo()
  await controller.generateRoot()
  await controller.pushOutputToRemoteRepo()

  //const rootHash = '0xdb4beed18949aa3a409986717886e99a3bd1302fa77038cf75b86352015f2823'
  //await controller.setMerkleRoot(rootHash)

  //const account = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'// .toLowerCase()
  //await controller.claim(rootHash, account)

  // await controller.getClaimed(account)
  //await controller.getOnchainRoot()
}
