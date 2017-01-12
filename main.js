const emptyColor = 'white';
const top100Color = '#004b00'; //nearly dark green
const top50Color = 'green';
const bottom10Color = 'red';
const range10Color = 'yellow';
const range40Color = 'orange';

function txPieChart(data, elementId){


};

class TxPieChar {


	constructor(rawData, elementId, labelBy, ...drawAttrs){
		this.rawData = rawData;
		this.elementId = elementId;
		this.labelBy = labelBy;
		drawAttrs = drawAttrs.length > 0 ? drawAttrs : ['total'];
		this.drawAttrs = drawAttrs;

		this._chart = dc.pieChart('#' + this.elementId);
	}

	_sortTop5(attr){
		this.rawData.sort((a, b) =>{
			if(a[attr] > b[attr]){
				return -1;
			}

			if(a[attr] < b[attr]){
				return 1;
			}

			return 0;

		});


		this.rawData.forEach((c, i) =>{
			let pieGroup = i;
			if(i > 4){
				pieGroup = 5;
			}
			c.pieGroup = pieGroup;
		});
	}

	setDrawAttrs(attrs){
		this.drawAttrs = attrs;
		this._cleanData();
	}

	_cleanData(){
		this.rawData.forEach(c =>{
			this.drawAttrs.forEach(attr =>{
				c[attr] ? (c[attr] = Number(c[attr])) : false;
			});
		});
	}

	render(attr){
		this._sortTop5(attr);
		let ndx = crossfilter(this.rawData);
		let groupDim = ndx.dimension((d) =>{
			return d.pieGroup;
		});

		let countAttr = groupDim.group().reduceSum(d =>{
			return d[attr];
		});

		let txPieChart = this;

		this._chart
		    .width(768)
		    .height(480)
		    .innerRadius(100)
		    .dimension(groupDim)
		    .group(countAttr)
		    .legend(dc.legend().legendText(dcPieObj => {
			    let suffix = '';
			    if(attr == 'total'){
				    suffix = '$';
			    }

			    return suffix + Number(dcPieObj.data).toFixed(2);
		    }))
		    .ordinalColors([emptyColor, bottom10Color, range10Color, range40Color, top50Color, top100Color]) //the first one is OTHERS
		    /** @BUGGS
		     */
		    // .label(d => {
		    //      // d ONLY ASSOCIATE WITH
		    //      // {
		    //      //      key: 0, //group
		    //      //      value: 192.65
		    //      // }
		    //      // console.log(d);
		    // 	let label = 'Others';
		    //
		    // 	let cIndex = d.key;
		    // 	console.log(cIndex); // 0 1 2 5, NO 3 4, BUGSSSS
		    // 	if(cIndex < 5){
		    // 		label = this.rawData[cIndex][this.labelBy];
		    // 	}
		    //
		    // 	console.log(label);
		    //
		    // 	return `${label}: ${Number(d.value).toFixed(2)}`;
		    // })
		    // workaround for #703: not enough data is accessible through .label() to display percentages
		    .on('pretransition', chart =>{
			    chart.selectAll('text.pie-slice').text(function(d){
				    d = d.data; //restore as normal d {key: 0, value: 195.56}

				    let label = 'Others';

				    let cIndex = d.key;
				    // console.log(cIndex); // 0 1 2 5, NO 3 4, BUGSSSS
				    if(cIndex < 5){
					    label = txPieChart.rawData[cIndex][txPieChart.labelBy];
				    }

				    return `${label}: ${Number(d.value).toFixed(2)}`;
			    })
		    })

		;

		this._chart.render();
	}
}
;
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

	// var chart = dc.pieChart("#sales-by-category-pie-chart");
	//
	// var ndx = crossfilter(categories);
	//
	// groupDimension = ndx.dimension(function(d){
	// 	// return `top ${d.pieGroup}`;
	// 	return d.pieGroup;
	// })
	// countX = groupDimension.group().reduceSum(function(d){
	// 	return d.total;
	// });
	//
	// chart
	// 	.width(768)
	// 	.height(480)
	// 	// .slicesCap(5)
	// 	.innerRadius(100)
	// 	.dimension(groupDimension)
	// 	.group(countX)
	// 	.legend(dc.legend())
	// 	.ordinalColors(['black', 'blue', 'green', 'gray', 'yellow', 'red'])
	// 	// workaround for #703: not enough data is accessible through .label() to display percentages
	// 	.on('pretransition', function(chart){
	// 		chart.selectAll('text.pie-slice').text(function(d){
	// 			// return d.data.key + ' ' + dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
	// 			// console.log(d);
	// 			// console.log(d.data);
	// 			let label = d.data.key;
	// 			return label + ' ' + Number(d.value).toFixed(2);
	// 		})
	// 	})
	// ;
	//
	// chart.render();
	txPieChart = new TxPieChar(categories, 'sales-by-category-pie-chart', 'display_name', 'total', 'quantity');
	txPieChart.render('total');

	document.addEventListener('click', function(){
		txPieChart.render('quantity');
	});
});
