import { program } from 'commander'
import wait from 'wait'
import { Controller } from '../Controller'
import { Level } from 'level'
import { DateTime } from 'luxon'

const levelDbPath = process.env.LEVEL_DB_PATH

if (!levelDbPath) {
  throw new Error('LEVEL_DB_PATH is required')
}

const db = new Level(levelDbPath)

program
  .command('worker')
  .description('Start worker')
  .option('--start-timestamp <value>', 'Start timestamp in seconds')
  .option('--end-timestamp <value>', 'End timestamp in seconds')
  .option('--poll-interval <value>', 'Poll interval in seconds')
  .action(async (source: any) => {
    try {
      await main(source)
    } catch (err) {
      console.error(err)
    }
  })

async function main (options: any) {
  console.log('options:', options)
  const controller = new Controller()
  console.log('running worker')

  const pollInterval = (Number(options.pollInterval) || 10) * 1000
  let i = 0

  while (true) {
    try {
      console.log('poll running')
      // console.log('pulling rewards data')
      // const changed = await controller.pullRewardsDataFromRepo()

      let startTimestamp = Number(options.startTimestamp) || Math.floor((Date.now() / 1000) - 60 * 60)
      let endTimestamp = Number(options.endTimestamp) || Math.floor(Date.now() / 1000)

      try {
        let lastTimestamp: any = await db.get('lastTimestamp')
        if (lastTimestamp) {
          lastTimestamp = Number(lastTimestamp)
          startTimestamp = lastTimestamp + 1
          endTimestamp = startTimestamp + pollInterval
          console.log('got lastTimestamp')
        }
      } catch (err) {
        console.log(err.message)
      }

      endTimestamp = Math.min(endTimestamp, Math.floor(Date.now() / 1000))
      startTimestamp = Math.min(startTimestamp, endTimestamp)

      console.log('startTimestamp:', startTimestamp, DateTime.fromSeconds(startTimestamp).toISO())
      console.log('endTimestamp:', endTimestamp, DateTime.fromSeconds(endTimestamp).toISO())
      await controller.fetchOutputRepoFirst()

      console.log('generating root and writing data to disk')
      await controller.generateRoot({
        shouldWrite: true,
        startTimestamp,
        endTimestamp
      })

      console.log('pushing merkle data from disk to repo')
      await controller.pushOutputToRemoteRepo()

      await db.put('lastTimestamp', startTimestamp.toString())

      console.log('poll done')
      console.log('next poll in ', pollInterval)
      i++
    } catch (err) {
      console.error('poll error', err)
    }
    await wait(pollInterval)
  }
}
