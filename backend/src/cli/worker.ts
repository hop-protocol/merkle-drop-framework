import { program } from 'commander'
import { wait } from '../utils/wait.js'
import { Level } from 'level'
import { DateTime } from 'luxon'
import { startServer } from '../server.js'
import { config, InstanceType } from '../config.js'

const levelDbPath = process.env.LEVEL_DB_PATH
let lastCheckpointMs = 0

program
  .command('worker')
  .description('Start worker')
  .option('--start-timestamp <value>', 'Start timestamp in seconds')
  .option('--end-timestamp <value>', 'End timestamp in seconds')
  .option('--do-last-checkpoint <value>', 'Perform final checkpoint, value is end timestamp in seconds') // TODO: rename to end-timestamp, this was added as a quick fix
  .option('--poll-interval <value>', 'Poll interval in seconds')
  .option('--checkpoint-interval <value>', 'Checkpoint interval in seconds')
  .option('--post-forum [boolean]', 'Set to true to post to forum')
  .option('--noCheckpoint [boolean]', 'Set to true to not push to github')
  .option('--server', 'Start server')
  .option('--migrate', 'Run migration')
  .option('--instance-type <string>', `Instance type. Options are: ${Object.values(InstanceType)}`)
  .action(async (source: any) => {
    try {
      await main(source)
    } catch (err) {
      console.error(err)
    }
  })

async function main (options: any) {
  console.log('options:', options)
  console.log('running worker')
  const instanceType = options.instanceType || InstanceType.FeeRefund

  if (instanceType !== InstanceType.FeeRefund) {
    throw new Error('instance type not found')
  }

  if (options.server) {
    console.log('starting server')
    startServer(options)
  }

  const { controller } = await import('../instance.js')

  const pollInterval = (Number(options.pollInterval) || 10)

  if (!levelDbPath) {
    throw new Error('LEVEL_DB_PATH is required')
  }

  const db = new Level(levelDbPath)

  while (true) {
    try {
      if (options.doLastCheckpoint) {
        console.log('checking if last checkpoint is needed')
        const lastRepoCheckpointMs = await controller.getLastRepoCheckpointMs()
        if (!lastRepoCheckpointMs) {
          console.log('no last checkpoint found, exiting')
          process.exit(0)
        }

        const lastRepoCheckpointDate = DateTime.fromMillis(lastRepoCheckpointMs)
        const endDateForLastCheckpoint = DateTime.fromSeconds(Number(options.doLastCheckpoint))

        const diffInDays = endDateForLastCheckpoint.diff(lastRepoCheckpointDate, 'days').days
        console.log(diffInDays, 'days difference between lastRepoCheckpointDate and endDateForLastCheckpoint')

        if (Math.abs(diffInDays) <= 2) {
          console.log('last checkpoint is within 2 days, exiting worker')
          break
        }
      }

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

      const checkpointIntervalMs = (Number(options.checkpointInterval) || 1 * 60 * 60) * 1000
      config.checkpointIntervalMs = checkpointIntervalMs
      config.startTimestamp = startTimestamp

      if (!lastCheckpointMs) {
        const lastRepoCheckpointMs = await controller.getLastRepoCheckpointMs()
        if (lastRepoCheckpointMs) {
          lastCheckpointMs = lastRepoCheckpointMs
        }
      }

      console.log('startTimestamp:', startTimestamp, DateTime.fromSeconds(startTimestamp).toISO())
      console.log('endTimestamp:', endTimestamp, DateTime.fromSeconds(endTimestamp).toISO())
      console.log('lastCheckpointMs:', lastCheckpointMs)
      console.log('pollInterval:', pollInterval)
      console.log('checkpointIntervalMs:', checkpointIntervalMs)
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
        endTimestamp,
        setLatest: true
      })

      console.log('root:', rootHash)
      console.log('total:', `${totalFormatted}`)

      let isExpired = (lastCheckpointMs || startTimestamp) + checkpointIntervalMs < Date.now()
      if (options.doLastCheckpoint) {
        isExpired = Number(options.doLastCheckpoint) < Math.floor(Date.now() / 1000) // note: uncomment when running last checkpoint
        // TODO: handle endTimestamp and lastCheckpointMs
      }
      let shouldCheckpoint = isExpired && rootHash !== '0x'
      if (options.noCheckpoint) {
        shouldCheckpoint = false
      }
      console.log('shouldCheckpoint:', shouldCheckpoint)
      if (shouldCheckpoint) {
        const now = Math.floor(Date.now() / 1000)
        endTimestamp = Math.floor(DateTime.fromSeconds(now).toUTC().minus({ days: 1 }).startOf('hour').toSeconds())
        const { rootHash, total, totalFormatted } = await controller.generateRoot({
          shouldWrite: true,
          writePath,
          startTimestamp,
          endTimestamp,
          logResult: true
        })
        console.log('generated', { rootHash, totalFormatted, startTimestamp, endTimestamp })

        console.log('checkpointing')
        await controller.copyRootDataToOutputRepo(rootHash)
        console.log('pushing merkle data from disk to repo', { startTimestamp, endTimestamp, rootHash, totalFormatted })
        const { alreadyUpdated, githubUrl } = await controller.pushOutputToRemoteRepo()
        lastCheckpointMs = Date.now()
        console.log('alreadyUpdated:', alreadyUpdated)

        if (!alreadyUpdated) {
          controller.notifier.log(`
            Github repo updated
            Github url: ${githubUrl}
            New root hash: ${rootHash}
            New root total amount: ${totalFormatted}
            Start timestamp: ${startTimestamp}
            End timestamp: ${endTimestamp}
          `.trim())
        }
        const shouldPost = !alreadyUpdated && options.postForum
        console.log('shouldForumPost:', shouldPost)
        if (shouldPost) {
          try {
            const { postUrl } = await controller.postToForum({
              rootHash,
              totalFormatted,
              total,
              startTimestamp,
              endTimestamp
            })
            controller.notifier.log(`
             Forum post created
             Forum url: ${postUrl}
             New root hash: ${rootHash}
             New root total amount: ${totalFormatted}
             Start timestamp: ${startTimestamp}
             End timestamp: ${endTimestamp}
            `.trim())
          } catch (err) {
            console.error('post to forum failed:', err)
          }
        }
      }

      await db.put('lastTimestamp', startTimestamp.toString())

      await controller.pruneMerkleDir()

      console.log('poll done')

      if (options.doLastCheckpoint) {
        const now = Math.floor(Date.now() / 1000)
        if (Number(options.doLastCheckpoint) < now) {
          console.log('endTimestamp reached, exiting worker loop.')
          break
        }
      }

      console.log(`next poll in ${pollInterval} seconds`)
    } catch (err) {
      console.error('poll error', err)
    }
    await wait(pollInterval * 1000)
  }
}
