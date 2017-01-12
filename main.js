function txPieChart(data, elementId){


};

class txPieChar {
	constructor(rawData, elementId, ...drawAttrs){
		this.rawData = rawData;
		this.elementId = elementId;
		drawAttrs = drawAttrs.length > 0 ? drawAttrs : ['total'];
		this.drawAttrs = drawAttrs;

		this._chart = dc.pieChart('#' + this.elementId);
	}

	_sortTop5(attr){
		this.rawData.sort((a, b) => {
			if(a[attr] > b[attr]){
				return -1;
			}

			if(a[attr] < b[attr]){
				return 1;
			}

			return 0;

		});


		this.rawData.forEach((c, i) => {
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
		this.rawData.forEach(c => {
			this.drawAttrs.forEach(attr => {
				c[attr] ? (c[attr] = Number(c[attr])) : false;
			});
		});
	}

	render(attr){
		this._sortTop5(attr);
		let ndx = crossfilter(this.rawData);
		let groupDim = ndx.dimension((d) => {
			return d.pieGroup;
		});

		let countAttr = groupDim.group().reduceSum(d => {
			return d[attr];
		});

		this._chart
		    .width(768)
		    .height(480)
		    .innerRadius(100)
		    .dimension(groupDim)
		    .group(countAttr)
		    .legend(dc.legend())
		    .ordinalColors(['black', 'blue', 'green', 'gray', 'yellow', 'red'])
		;
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
		.on('pretransition', function(chart){
			chart.selectAll('text.pie-slice').text(function(d){
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
