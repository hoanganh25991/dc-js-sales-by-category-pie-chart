function drawDailyReportGraph(closures){
	/**
	 * Timezone of closure, currently in SING
	 */
	const timezone = 8 * 60;

	/**
	 * Config heatmap color
	 */
	const emptyColor = 'white';
	const top100Color = '#004b00';
	const top50Color = 'green';
	const bottom10Color = 'red';
	const range10Color = 'yellow';
	const range40Color = 'orange';
	// const startColor = '#03A9F4';
	// const endColor = '#01579B';

	/**
	 * Format closure to timestamp
	 * Closures come from global in views/daily_reports/index.php
	 */
	closures.forEach(closure =>{
		let closureTime = closure.closed_timestamp;
		/**
		 * @WARN try on modified_timestamp
		 */
		if(!closureTime){
			closureTime = closure.modified_timestamp;
		}

		if(!closureTime){
			console.error('Closure closed_timestamp: null');
			throw closure;
		}

		let momentObj = moment(closureTime, 'YYYY-MM-DD HH:mm:ss').utcOffset(timezone);
		closure.timestamp = momentObj.unix();
		closure.momentObj = momentObj;
	});

	let clousreSample = {
		closed_timestamp: '',
		timestamp: 0,
		momentObj: {},
		total: 0,
		num_of_orders: 0,
		pax: 0,
		nett_total: 0,
		gross_total: 0,
		total_discount: 0
	};

	/**
	 * Fullfill each day of year with default value to draw
	 */
// Get out year from ONE CLOSURE
	const year = closures[0].momentObj.year();
//Loop through 12 months
	for(let month = 1; month <= 12; month++){
		let firstDayOfMonth = moment(`${year}-${month}-1`, 'YYYY-M-D').utcOffset(timezone);
		let lastDayOfMonth = firstDayOfMonth.clone().endOf('month');

		let start = firstDayOfMonth.date(), end = lastDayOfMonth.date();

		for(let day = start; day <= end; day++){
			let current = moment(`${year}-${month}-${day}`, 'YYYY-M-D').utcOffset(timezone);
			let sql_timestamp = current.format('YYYY-MM-DD HH:mm:ss');
			let timestamp = current.unix();
			let closure = Object.assign({}, clousreSample);
			closure.closed_timestamp = sql_timestamp;
			closure.timestamp = timestamp;
			closure.momentObj = current;
			closures.push(closure);
		}
	}

	/**
	 * Create dimenstion on date
	 */
	let ndx = crossfilter(closures);

	let weekDim = ndx.dimension(closure =>{
		let dayOfWeek = closure.momentObj.isoWeekday(); //1-7
		let weekOfYear = closure.momentObj.isoWeek(); //1-53
		return [dayOfWeek, weekOfYear];
	});

	let buildCountOn = function(dimension){
		return function(closureAttr){
			return dimension.group().reduce(
				//add
				function(p, v){
					p.sum += Number(v[closureAttr]);
					p.momentObj = v.momentObj;
					return p;
				},
				//remove
				function(p, v){
					p.sum -= Number(v[closureAttr]);
					p.momentObj = v.momentObj;
					return p;
				},
				//init
				function(){
					return {
						momentObj: {},
						sum: 0
					};
				}
			);
		};
	}(weekDim);

	/**
	 * Build the default one
	 */
	let countTotal = buildCountOn('total');

	let dailyReportChart = dc.heatMap('#daily-report-heatmap');

	const dayInWeek = {
		1: 'M',
		3: 'W',
		5: 'F'
	};

	let computeHeatMapRange = function(){
		let valArr = dailyReportChart.group().all().map(c =>{
			return c.value.sum
		});

		let maxVal = valArr.reduce((x, y) =>{
			return x > y ? x : y;
		});
		console.log('MAX VAL: ', maxVal);
		let emptyVal = 0;
		let bottom10Val = maxVal * 0.1 - 1;
		let range10Val = maxVal * 0.1;
		let range40Val = maxVal * 0.4;
		let top50Val = maxVal * 0.5;
		let top100Val = maxVal;

		dailyReportChart.range = [emptyVal, bottom10Val, range10Val, range40Val, top50Val, top100Val];
	}

	const heatColorMapping = function(d){

		return d3.scale.linear()
		         .domain(dailyReportChart.range)
		         .range([emptyColor, bottom10Color, range10Color, range40Color, top50Color, top100Color])(d);
	};

	heatColorMapping.domain = function(){
		return [0, 1];
	};

	//Let chart auto decide on how large of cell
	dailyReportChart
		.xBorderRadius(0)
		.yBorderRadius(0)
		.dimension(weekDim)
		.group(countTotal);

	computeHeatMapRange();

	dailyReportChart
		.keyAccessor(function(d){
			return d.key[1];
		})
		.valueAccessor(function(d){
			return d.key[0];
		})
		.colorAccessor(function(d){
			return d.value.sum;
		})
		.title(function(d){
			return "Σ Sum: " + d.value.sum;
		})
		.colors(heatColorMapping)
		.calculateColorDomain()
	;

	/**
	 * Handle click on cell ~ single day
	 */
	dailyReportChart
		.boxOnClick(function(countObj){
			console.log('A Daily report: clicked');
			console.log(countObj);

			let closureMomentObj = countObj.value.momentObj;
			let closureDate = closureMomentObj.format('YYYY-MM-DD');
			let currentURL = window.location.href;
			if(!currentURL.endsWith("/")){
				currentURL += "/";
			}
			let dailyReportDetail = currentURL + closureDate; //bcs currentURL has end slash "/"
			window.location.href = dailyReportDetail;
		});

	dailyReportChart.rowsLabel(function(d){//1-7
		return dayInWeek[d];
	});

	const firstDayOfYear = moment(year, 'YYYY');

	let showedMonth = "";
	dailyReportChart.colsLabel(function(d){//1-53
		let currentDay = firstDayOfYear.clone().add((d - 1) * 7 + 1, 'd');
		let month = currentDay.format('MMM');
		if(month != showedMonth){
			showedMonth = month;
			return month;
		}

		return "";
	});

	let reDrawChart = function(chart){
		return function(closureAttribute){
			let countOnAttribute = buildCountOn(closureAttribute);
			// redraw chart
			chart.group(countOnAttribute);
			computeHeatMapRange();
			chart.calculateColorDomain();
			//render only on chart to save CPU
			chart.render();
		}
	}(dailyReportChart);

	/**
	 * Bind click closure attr event
	 */
	document.querySelectorAll('#closure-attr-btn-group button').forEach(btn =>{
		console.log(btn);
		btn.addEventListener('click', function(){
			let closureAttr = btn.getAttribute('closure-attr');
			console.log('redraw on attr: ' + closureAttr);
			reDrawChart(closureAttr);
		});
	});

	/**
	 * Self compute with height of heatmap
	 */
	window.addEventListener('resize', function(){
		let heatMapDiv = document.querySelector('#daily-report-heatmap');
		dailyReportChart.width(heatMapDiv.clientWidth);
		dailyReportChart.render();
	});


// monthlyReportChart.colsLabel(function(d){//d = 16782
// 	let date = new Date(d * 86400 * 1000);
// 	return date.getDate();
// });

	dc.renderAll();
};
fetch('data.json').then(res =>{
// 	console.log(res.json());
	return Promise.resolve(res.json());
}).then(categoriesSummary =>{
	// drawDailyReportGraph(categoriesSummary);
	let categories = Object.values(categoriesSummary);
	window.categories = categories;

	//clean categories, make sure val to count is number
	categories.forEach(c =>{
		c.total = Number(c.total);
		c.quantity = Number(c.quantity);
	});

	let compare = function(a, b){
		if(a.total > b.total){
			return -1;
		}
		if(a.total < b.total){
			return 1;
		}
		// a must be equal to b
		return 0;
	}

	categories.sort(compare);
	console.log(categories.length);
	top5 = categories.slice(0, 5);
	res = categories.slice(5);
	resTotal = res.reduce((x, y) =>{
		let total = x.total + y.total;
		return {total};
	});


	categories.forEach((cat, i) =>{
		let pieGroup = "top " + i;
		if(i > 4){
			pieGroup = "Others";
		}

		cat.pieGroup = pieGroup;
	});

	var chart = dc.pieChart("#sales-by-category-pie-chart");

	var ndx = crossfilter(categories);

	groupDimension = ndx.dimension(function(d){
		// return `top ${d.pieGroup}`;
		return d.pieGroup;
	})
	countX = groupDimension.group().reduceSum(function(d){
		return d.total;
	});

	chart
		.width(768)
		.height(480)
		// .slicesCap(5)
		.innerRadius(100)
		.dimension(groupDimension)
		.group(countX)
		.legend(dc.legend())
		.ordinalColors(['black', 'blue', 'green', 'gray', 'yellow', 'red'])
	// workaround for #703: not enough data is accessible through .label() to display percentages
		.on('pretransition', function(chart) {
			chart.selectAll('text.pie-slice').text(function(d) {
				// return d.data.key + ' ' + dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
				// console.log(d);
				// console.log(d.data);
				let label = d.data.key;
				return label + ' ' + Number(d.value).toFixed(2);
			})
		})
	;

	chart.render();
});
