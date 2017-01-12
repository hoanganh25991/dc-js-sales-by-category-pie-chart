function drawLegend(range, type, divContainerId){
		//Scale for calendar
		let colors = [emptyColor, bottom10Color, range10Color, range40Color, top50Color, top100Color];

		const suffix = {
			nett_total: '$',
			gross_total: '$',
			total_discount: '$'
		};

		let computeRange = function(range, type){
			range = range.map(val =>{
				val = Number(val).toFixed(2);
				if(suffix[type]){
					val = suffix[type] + ' ' + val;
				}

				return val;
			});

			return range;
		};


		let computeSampleOrdinal = function(range, type){
			let domainRange = computeRange(range, type);

			return d3.scale.ordinal()
			         .domain(domainRange)
			         .range(colors)
				;
		};


		let computeVerticalLegend = function(range, type){
			let sampleOrdinal = computeSampleOrdinal(range, type);

			return d3.svg.legend()
			         .labelFormat('none')
			         .orientation('vertical')
			         .cellWidth(13)
			         .cellHeight(13)
			         .cellPadding(1)
			         .inputScale(sampleOrdinal)
				;
		};


		let verticalLegend = computeVerticalLegend(range, type);


		let chart =
			d3.select('#' + divContainerId)
			  .append('svg:svg')
			  .attr('width', 100)
			  .attr('height', 100)
			  .append('g')
			  .attr('transform', 'translate(0,0)')
			  .attr('class', 'legend');

		chart.call(verticalLegend);

		chart.reDrawChart = function(range){
			let verticalLegend = computeVerticalLegend(range);
			chart.call(verticalLegend);
		};

		return chart;
	}