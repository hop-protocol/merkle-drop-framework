import fs from 'fs'
import path from 'path'
import { ShardedMerkleTree } from './merkle'

/*
const json = fs
  .readFileSync(path.resolve(__dirname, './data/data.json'), { encoding: 'utf-8' })
  .split('\n')
  .filter(x => x.length > 0)
  .map(line => {
    const data = JSON.parse(line)
    const owner = data.owner
    delete data.owner
    return [owner, data]
  })
*/
const data = require('./data/data.json')
const json: any[] = []
for (const address in data) {
  json.push([address, { balance: data[address] }])
}

const shardNybbles = 2
const outDirectory = path.resolve(__dirname, 'generated2')

const tree = ShardedMerkleTree.build(json, shardNybbles, outDirectory)
console.log(tree.getHexRoot())
