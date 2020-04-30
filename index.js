'use strict'

const Validate = require('validate')
const { getMonthlyStats, getDailyStats } = require('./lib/core')

const paramValidator = new Validate({
  station: {
    type: String,
    length: 6,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['daily', 'monthly']
  },
  about: {
    type: String,
    required: true,
    enum: ['rainfall', 'mintemperature', 'maxtemperature']
  },
  year: {
    type: Number,
    length: { min: 1800, max: 2050 }
  },
  logging: {
    type: Boolean
  }
})

function getHistoricalData(params, cb) {
  
  const paramErrors = paramValidator.validate(params)
  if (paramErrors.length !== 0) {
    if (cb) cb(paramErrors[0], null)
    return Promise.reject(paramErrors[0])
  }

  let ret = null
  if (params.type === 'monthly') {
    ret = getMonthlyStats(params)
  } else if (params.type === 'daily') {
    ret = getDailyStats(params)
  }

  if (cb) cb(null, ret)
  return ret

}

module.exports = {
  getHistoricalData: getHistoricalData
}

