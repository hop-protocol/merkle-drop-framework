const instanceToUse = 'feeRefund'

let controller: any = null
let setAdditionalRoutes: any = null

if (instanceToUse === 'feeRefund') {
  ({ controller, setAdditionalRoutes } = require('./instances/feeRefund'))
}

export { controller, setAdditionalRoutes }
