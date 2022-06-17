import { Controller } from '../Controller'

const controller = new Controller()

async function main () {
  // await controller.pullRewardsDataFromRepo()
  //await controller.generateRoot()
  await controller.pushOutputToRemoteRepo()
}

main().catch(console.error)
