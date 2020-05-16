'use strict'

const axios = require('axios').default
const { JSDOM } = require("jsdom")
const csvParse = require('csv-parse')
const unzipper = require('unzipper')
const fs = require('fs')
const path = require('path')
const os = require('os')
const _ = require('lodash')


const code = {
   monthly: {
      'rainfall': 139,
      'mintemperature': 38,
      'maxtemperature': 36
   },
   daily: {
      'rainfall': 136,
      'maxtemperature': 122,
      'mintemperature': 123
   }
}

const productCode = {
   daily: {
      'rainfall': 'IDCJAC0009',
      'maxtemperature': 'IDCJAC0010',
      'mintemperature': 'IDCJAC0011'
   }
}

const reqParams = {
   base: 'http://www.bom.gov.au',
   pathAllYear: '/jsp/ncc/cdio/weatherData/av',
   pathAYear: '/tmp/cdio',
   pathPc: '/jsp/ncc/cdio/weatherStationDirectory/d?',

   avParam: (params) => {
      return {
         p_display_type: params.displayType,
         p_stn_num: params.stnNum,
         p_c: params.pc,
         p_nccObsCode: params.nccObsCode,
         p_startYear: params.startYear
      }
   }
}

let logging = false

async function getDailyStats(params) {

   logging = params.logging

   if (params.year == null) {
      log('Start fetching: all years of daily data')
      return await getAllYearData({
         displayType: 'dailyZippedDataFile',
         stnNum: params.station,
         nccObsCode: code.daily[params.about],
         startYear: params.year,
         internal: { dataKey: params.about }
      })
   }

   log('Start fetching: a year of daily data')
   return await getAYearData({
      displayType: 'dailyDataFile',
      stnNum: params.station,
      nccObsCode: code.daily[params.about],
      productCode: productCode.daily[params.about],
      startYear: params.year,
      internal: { dataKey: params.about }
   })

}

async function getMonthlyStats(params) {
   log('Start fetching: all years of montly data')
   return await getAllYearData({
      displayType: 'monthlyZippedDataFile',
      stnNum: params.station,
      nccObsCode: code.monthly[params.about],
      startYear: '',
      internal: { dataKey: null }
   })
}

// http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?
// p_nccObsCode=123&p_display_type=dailyDataFile&p_startYear=2010&p_c=--1490865028&p_stn_num=086338

// http://www.bom.gov.au/tmp/cdio/IDCJAC0011_086338_2013.zip
async function getAYearData(params) {
   const hisStn = await findHistoricalStn(params.stnNum, params.nccObsCode)
   
   if (hisStn.pc == null) {
      return Promise.reject('p_c not found')
   }
   log('Found p_c: ' + hisStn.pc)
   
   // use historical station number instead of origin station
   params.stnNum = hisStn.station
   params.pc = hisStn.pc

   await axios.get(reqParams.base + reqParams.pathAllYear, { params: reqParams.avParam(params) })

   const url = reqParams.base + reqParams.pathAYear + '/' + params.productCode + '_'
      + params.stnNum + '_' + params.startYear + '.zip'
   const res = await axios.get(url, { responseType: 'stream' })
   log('Got response from bom')

   return await pasrseZipResponse(res, params)
}

async function getAllYearData(params) {
   const hisStn = await findHistoricalStn(params.stnNum, params.nccObsCode)

   if (hisStn.pc == null) {
      return Promise.reject('p_c not found')
   }
   log('Found p_c: ' + hisStn.pc)

   // use historical station number instead of origin station
   params.stnNum = hisStn.station
   params.pc = hisStn.pc

   const url = reqParams.base + reqParams.pathAllYear
   const res = await axios.get(url, {
      params: reqParams.avParam(params),
      responseType: 'stream'
   })
   log('Got response from bom')

   return await pasrseZipResponse(res, params)

}

async function pasrseZipResponse(res, params) {
   // 1. download the return zip file to tmp dir
   const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bom-stat-'))

   const zipFiles = res.data.pipe(unzipper.Parse({ forceStream: true }));
   let csvFileStreams = []
   for await (const entry of zipFiles) {
      const fileName = entry.path;

      if (fileName.endsWith('.csv')) {
         log('Downloaded file: ' + fileName)
         const csvFile = path.join(tmpDir, fileName)
         csvFileStreams.push(entry.pipe(fs.createWriteStream(csvFile)))
      } else entry.autodrain()
   }

   // 2. parse the .csv file

   const csvFile = csvFileStreams.pop().path
   log('Parsing csv file: ' + csvFile)

   const fmtFunc = csvFile.endsWith('2.csv') ? format2 : format1
   const opts = {
      columns: true,
      skip_empty_lines: true,
      cast: value => { return value === 'null' ? null : value }
   }

   const csvContent = fs.readFileSync(csvFile)
   return new Promise((resolve, reject) => {
      csvParse(csvContent, opts, function (err, csvDatas) {
         const result = csvDatas && csvDatas.map(v => fmtFunc(v, params))

         fs.rmdirSync(tmpDir, { recursive: true })

         log('bomstat result: ' + result ? err : result.length)
         return result ? resolve(result) : reject(err)
      })
   })
}

function format1(csvdata, params) {
   let foundKey = ''
   if (params.internal.dataKey) {
      foundKey = Object.keys(csvdata).find(k => {
         const key = k.toLowerCase()
         return key.includes('rainfall') || key.includes('temperature')
      })
   }

   return {
      station: params.stnNum,
      year: csvdata.Year,
      month: csvdata.Month,
      day: csvdata.Day,
      data: csvdata[foundKey]
   }
}

function format2(csvdata, params) {
   
   const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
   let annual = csvdata.Annual
   if (annual === null) {
      let monthsValues = monthNames.map(m => Number(csvdata[m]))
      monthsValues = _.compact(monthsValues)
      
      annual = _.sum(monthsValues) / monthsValues.length
   }

   return {
      station: params.stnNum,
      year: csvdata.Year,
      data: {
         annual: annual,
         months: monthNames.map(m => csvdata[m])
      }
   }
}

function findHistoricalStn(stationNum, nccObsCode) {
   const params = {
      p_display_type: 'ajaxStnListing',
      p_nccObsCode: nccObsCode,
      p_radius: 10,
      p_stnNum: stationNum
   }

   return new Promise((resolve, reject) => {
      axios.get(reqParams.base + reqParams.pathPc, { params: params })
         .then(function (res) {
            let stn = parseStnsHtml(res.data)
            return stn ? resolve(stn) : reject('p_c not found')
         })
         .catch(function (error) {
            return reject('p_c not found')
         })
   })
}

function parseStnsHtml(data) {
   const dom = new JSDOM(data)
   const firstLine = dom.window.document.querySelector('tbody tr')
   const station = firstLine.children[1].textContent
   const pc = firstLine.lastChild.textContent
   return {
      station: station,
      pc: pc
   }
}

function log(msg) {
   if (logging) console.log(msg)
}

exports.getMonthlyStats = getMonthlyStats
exports.getDailyStats = getDailyStats