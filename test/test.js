const { getHistoricalData } = require('./../index')

describe('getHistoricalData', function () {
  this.timeout(5000)

  // Fetch monthly data

  it('Monthly rainfall', function (done) {
    const params = {
      station: '086338',
      type: 'monthly',
      about: 'rainfall',
      year: null
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  it('Monthly min temperature', function (done) {
    const params = {
      station: '086338',
      type: 'monthly',
      about: 'mintemperature',
      year: null
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  it('Monthly max temperature', function (done) {
    const params = {
      station: '086338',
      type: 'monthly',
      about: 'maxtemperature',
      year: null
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  // Fetch daily data - all years

  it('All years daily rainfall', function (done) {
    const params = {
      station: '086338',
      type: 'daily',
      about: 'rainfall',
      year: null
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  it('All years daily max temperature', function (done) {
    const params = {
      station: '086338',
      type: 'daily',
      about: 'maxtemperature',
      year: null
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  it('All years daily min temperature', function (done) {
    const params = {
      station: '086338',
      type: 'daily',
      about: 'mintemperature',
      year: null
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  // Fetch daily data - specific year

  it('Specific year daily rainfall', function (done) {
    const params = {
      station: '086338',
      type: 'daily',
      about: 'rainfall',
      year: 2018
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  it('Specific year daily min temperature', function (done) {
    const params = {
      station: '086338',
      type: 'daily',
      about: 'mintemperature',
      year: 2018
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })

  it('Specific year daily max temperature', function (done) {
    const params = {
      station: '086338',
      type: 'daily',
      about: 'maxtemperature',
      year: 2018
    }
    getHistoricalData(params, function (err, data) {
      done(err)
    })
  })
});