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
    //const changed = await controller.pullRewardsDataFromRepo()

    const startTimestamp = Math.floor((Date.now()/1000) - 60 * 60)
    const endTimestamp = Math.floor(Date.now()/1000)
    console.log('startTimestamp:', startTimestamp)
    console.log('endTimestamp:', endTimestamp)
    await controller.fetchOutputRepoFirst()

    //if (changed) {
      console.log('generating root')
      await controller.generateRoot({shouldWrite: true, startTimestamp, endTimestamp})

      console.log('pushing merkle data')
      await controller.pushOutputToRemoteRepo()
    //}

    console.log('poll done')
    await wait(10 * 60 * 1000)
  }
}
