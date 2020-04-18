# bom-stat

This is a dead simple api to fetch a range of statistics, recent weather observations and climate data from the [Australian Data Archive for Meteorology](http://www.bom.gov.au/climate/cdo/images/about/ADAM.pdf), a database which holds weather observations dating back to the mid 1800s. 

It provide same functionality of [Climate Data Online (CDO)](http://www.bom.gov.au/climate/data/index.shtml).

Provide station number and it will return all the historical data, rainfall, minimum, or maximum temperature.


## Installation
```
npm install bom-scraper --save
```


## Usage
```
const { getHistoricalData } = require('bom-stat')

const params = {
	station:  '086338',
	type:  'monthly',
	about:  'rainfall'
}

getHistoricalData(params, function (err, data) {
	console.log(data)
})
```
## Return 
```
[
	{
	    station: '086338',	// Station Number
	    year: '2013',
	    data: { 
		    annual: '374.4', 
		    months: [64.4, 54.2, ...]	// 12 elements, each represents a month, Jan, Feb, ...
		}
	},
	...
]
```
## Params
All the params are similar to the inputs in the [Climate Data Online system]([http://www.bom.gov.au/climate/data/index.shtml](http://www.bom.gov.au/catalogue/data-feeds.shtml)).

### station
#### Type: String
#### Required: true
#### Example: '086338'
A unique 6-digits number represent a station. You could get this by lat/lon according to the [Observations List from BOM]([http://www.bom.gov.au/catalogue/data-feeds.shtml](http://www.bom.gov.au/catalogue/data-feeds.shtml)).

### type
#### Type: String
#### Required: true
#### Value: 'daily' | 'monthly'
The type of data.

### about
#### Type: String
#### Required: true
#### Value: 'rainfall' | 'mintemperature' | 'maxtemperature'
The type of data.

### year
#### Type: Number
#### Value: Number | null
Only use for daily data. Set it to null for all years of data.

