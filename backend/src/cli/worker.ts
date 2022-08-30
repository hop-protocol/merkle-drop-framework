import { program } from 'commander'
import wait from 'wait'
import { Controller } from '../Controller'
import { Level } from 'level'
import { DateTime } from 'luxon'
import { startServer } from '../server'

const levelDbPath = process.env.LEVEL_DB_PATH
let lastCheckpointMs = 0

program
  .command('worker')
  .description('Start worker')
  .option('--start-timestamp <value>', 'Start timestamp in seconds')
  .option('--end-timestamp <value>', 'End timestamp in seconds')
  .option('--poll-interval <value>', 'Poll interval in seconds')
  .option('--checkpoint-interval <value>', 'Checkpoint interval in seconds')
  .option('--post-forum [boolean]', 'Set to true to post to forum')
  .option('--no-checkpoint [boolean]', 'Set to true to not push to github')
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
          //lastTimestamp = Number(lastTimestamp)
          //startTimestamp = lastTimestamp + 1
          //endTimestamp = startTimestamp + pollInterval
          //console.log('got lastTimestamp')
        }
      } catch (err) {
        console.log(err.message)
      }

      endTimestamp = Math.min(endTimestamp, Math.floor(Date.now() / 1000))
      startTimestamp = Math.min(startTimestamp, endTimestamp)
      const checkpointIntervalMs = (Number(options.checkpointInterval) || 1 * 60 * 60) * 1000

      if (!lastCheckpointMs) {
        const lastRepoCheckpointMs = await controller.getLastRepoCheckpointMs()
        if (lastRepoCheckpointMs) {
          lastCheckpointMs = lastRepoCheckpointMs
        }
      }

      console.log('startTimestamp:', startTimestamp, DateTime.fromSeconds(startTimestamp).toISO())
      console.log('endTimestamp:', endTimestamp, DateTime.fromSeconds(endTimestamp).toISO())
      await controller.fetchOutputRepoFirst()

      const outputMerklePath = process.env.OUTPUT_MERKLE_PATH
      if (!outputMerklePath) {
        throw new Error('OUTPUT_MERKLE_PATH is required')
      }
      console.log('outputMerklePath', outputMerklePath)
      console.log('generating root and writing data to disk')
      const writePath = outputMerklePath
      const { rootHash, totalFormatted } = await controller.generateRoot({
        shouldWrite: true,
        writePath,
        startTimestamp,
        endTimestamp
      })

      console.log('root:', rootHash)
      console.log('total:', `${totalFormatted}`)

      const isExpired = lastCheckpointMs + checkpointIntervalMs < Date.now()
      const shouldCheckpoint = !options.noCheckpoint && isExpired && rootHash !== '0x'
      if (shouldCheckpoint) {
        console.log('checkpointing')
        await controller.copyRootDataToOutputRepo(rootHash)
        console.log('pushing merkle data from disk to repo')
        const { alreadyUpdated } = await controller.pushOutputToRemoteRepo()
        lastCheckpointMs = Date.now()
        console.log('alreadyUpdated:', alreadyUpdated)

        const shouldPost = !alreadyUpdated && options.postForum
        if (shouldPost) {
          try {
            await controller.postToForum({
              rootHash,
              totalFormatted,
              startTimestamp,
              endTimestamp
            })
          } catch (err) {
            console.error('post to forum failed:', err)
          }
        }
      }

      await db.put('lastTimestamp', startTimestamp.toString())

      console.log('poll done')
      console.log(`next poll in ${pollInterval} seconds`)
    } catch (err) {
      console.error('poll error', err)
    }
    await wait(pollInterval * 1000)
  }
}
