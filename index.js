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
    return cb(paramErrors[0], null)
  }

  if (params.type === 'monthly') {
    getMonthlyStats(params)
      .then(v => cb(null, v))
      .catch(err => cb(err, null))
  } else if (params.type === 'daily') {
    getDailyStats(params)
      .then(v => cb(null, v))
      .catch(err => cb(err, null))
  }

}

module.exports = {
  getHistoricalData: getHistoricalData
}

