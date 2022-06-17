import { Controller } from '../Controller'

const controller = new Controller()

async function main () {
  //await controller.pullRewardsDataFromRepo()
  //await controller.generateRoot()
  //await controller.pushOutputToRemoteRepo()
  const rootHash = '0x87d9e583e549564488accf449e23f4e92ac33bf9ef76da52025e2683a7852914'
  await controller.setMerkleRoot(rootHash)
}

main().catch(console.error)
