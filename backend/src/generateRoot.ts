import fs from 'fs'
import path from 'path'
import { parseBalanceMap } from '../src/parseBalanceMap'

const json = require('./input')

const output = JSON.stringify(parseBalanceMap(json), null, 2)
const outfile = path.resolve(__dirname, 'output.json')
fs.writeFileSync(outfile, output)
console.log(output)
