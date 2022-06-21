import { program } from 'commander'
import wait from 'wait'
import { Controller } from '../Controller'

program
  .command('worker')
  .description('Start worker')
  .action(async (str, options) => {
    try {
      await main()
    } catch (err) {
      console.error(err)
    }
  })

async function main () {
  const controller = new Controller()
  console.log('running worker')

  while (true) {
    console.log('pulling rewards data')
    const changed = await controller.pullRewardsDataFromRepo()

    if (changed) {
      console.log('generating root')
      await controller.generateRoot()

      console.log('pushing merkle data')
      await controller.pushOutputToRemoteRepo()
    }

    console.log('poll done')
    await wait(10 * 60 * 1000)
  }
}
