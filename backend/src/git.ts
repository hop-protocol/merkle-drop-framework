import simpleGit from 'simple-git'

async function main () {
  const git = simpleGit('/tmp/515ed64a978df4fda73e64d29a40d5a0')

  try {
    await git.addRemote('origin', 'git@gist.github.com:515ed64a978df4fda73e64d29a40d5a0.git')
  } catch (err) {
  }
  await git.pull()
  await git.add('*.json')
  await git.commit('Update data')
  await git.push('origin', 'main')
  console.log('done')
}

main().catch(console.error)
