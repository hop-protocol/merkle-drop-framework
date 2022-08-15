import { program } from 'commander'
import wait from 'wait'
import { Controller } from '../Controller'
import { Level } from 'level'
import { DateTime } from 'luxon'
import { startServer } from '../server'

const levelDbPath = process.env.LEVEL_DB_PATH

program
  .command('worker')
  .description('Start worker')
  .option('--start-timestamp <value>', 'Start timestamp in seconds')
  .option('--end-timestamp <value>', 'End timestamp in seconds')
  .option('--poll-interval <value>', 'Poll interval in seconds')
  .option('--server', 'Start server')
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

  if (options.server) {
    console.log('starting server')
    startServer()
  }

  const pollInterval = (Number(options.pollInterval) || 10)
  let i = 0

  if (!levelDbPath) {
    throw new Error('LEVEL_DB_PATH is required')
  }

  const db = new Level(levelDbPath)

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
      const { rootHash } = await controller.generateRoot({
        shouldWrite: true,
        startTimestamp,
        endTimestamp
      })

      if (rootHash !== '0x') {
        console.log('pushing merkle data from disk to repo')
        await controller.pushOutputToRemoteRepo()
      }

      await db.put('lastTimestamp', startTimestamp.toString())

      console.log('poll done')
      console.log(`next poll in ${pollInterval} seconds`)
      i++
    } catch (err) {
      console.error('poll error', err)
    }
    await wait(pollInterval * 1000)
  }
}
