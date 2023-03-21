import { InstanceType } from './config'

const argv = require('minimist')(process.argv.slice(2))
const instanceToUse = argv.instanceType || InstanceType.FeeRefund

let controller: any = null
let setAdditionalRoutes: any = null

if (instanceToUse === InstanceType.FeeRefund) {
  ({ controller, setAdditionalRoutes } = require('./instances/feeRefund'))
}

export { controller, setAdditionalRoutes }
