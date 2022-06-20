import { program } from 'commander'

require('./worker')
require('./generate')
require('./cli')

program.parse()
