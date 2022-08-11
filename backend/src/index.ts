require('./cli')

process.on('uncaughtException', (err: any) => {
  console.error('uncaughtException', err)
  process.exit(0)
})

process.on('SIGNINT', () => {
  process.exit(0)
})
