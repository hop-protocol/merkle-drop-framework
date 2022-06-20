import wait from 'wait'
import { Controller } from '../Controller'

const controller = new Controller()

async function main () {
  while (true) {
    const changed = await controller.pullRewardsDataFromRepo()
    if (changed) {
      await controller.generateRoot()
      await controller.pushOutputToRemoteRepo()
    }
    console.log('poll done')
    await wait(10 * 60 * 1000)
  }
}

main().catch(console.error)
