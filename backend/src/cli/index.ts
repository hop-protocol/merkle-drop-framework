import { program } from 'commander'

require('./worker')
require('./generate')
require('./refundAmount')

program.parse()
