import { Controller } from '../../Controller'
import { OptimismFeeRefund } from './FeeRefund'
export const controller = new Controller()
export const feeRefund = new OptimismFeeRefund(controller)
