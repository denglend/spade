/* globals d3,SpadeSettings,document,window,Globals, GetPanel */

// Might still be a few lines of code left from: http://bl.ocks.org/mbostock/3887235

SpadeSettings.Visualizations.push({
			name: "Pie",
			Functions: {
				DrawFunc:PieDraw,
				DrawInitFunc: PieDrawInit
			},
			Settings: {
				RedrawOnVerticalResize: true,
				RedrawOnHorizontalResize: true,
			},
			Panels: {
				DataSetPanel: {},
				VisualizationPanel: {},
				SplitPanel: {
					Splits: [
						{NoSplit:true,Name:"Circles"},
						{NoSplit:false,Name:"Wedges"}
					]
				},
				AggregatorPanel: {},
				FilterPanel: {},
				AdvancedOptionsPanel: {},
				ColorPanel: {ColorScale: true}
			},
			AdvancedOptions: [ 
			]
		});

function PieDrawInit() {
	GetPanel("ColorPanel").Functions.DataInit();
	return true;
}

function PieDraw(Data,SelectVals,MainDiv) {
	var CanvasWidth,CanvasHeight;
	
	for (var CurCircleSplit in Data.PivotObj) {
		/* jshint loopfunc: true */
		if (CurCircleSplit == "(no split)") {
			CanvasWidth = document.getElementById("MainDiv").scrollWidth-40;
			CanvasHeight = window.innerHeight-d3.select("#HeaderDiv").node().offsetHeight-60;
		}
		else {
			CanvasWidth = 200;
			CanvasHeight = 200;
		}
		var CurDiv = MainDiv.append("div")
							.attr("class","PieChartDiv")	
							.style("width",CanvasWidth+"px")
							.style("height",CanvasHeight+35+"px")
							.style("padding","2px");
		
		if (CurCircleSplit != "(no split)") CurDiv.append("div").attr("class","PieChartTitle").text(CurCircleSplit);

		var Radius = Math.min(CanvasWidth, CanvasHeight) / 2;
		var AllValues = [];

		var DataArray = Object.keys(Data.PivotObj[CurCircleSplit]).map(function(d) {
			if (Data.PivotObj[CurCircleSplit][d].length === 0) return {val: null};
			var AggregatedVal = SpadeSettings.Aggregators[SelectVals.AggregatorType].func(Data.PivotObj[CurCircleSplit][d]);
			AllValues.push(AggregatedVal);
			return {label:d,val:AggregatedVal};
		}).filter(function(d) { return d.val !== null;});

		var ColorPanel = GetPanel("ColorPanel");
		Globals.Catalog[SelectVals.Split2Attribute].FilteredUniqueList.forEach(function(d) {ColorPanel.Functions.AddData(d,MainDiv);});


		var arc = d3.svg.arc()
			.outerRadius(Radius - 10)
			.innerRadius(0);

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return d.val; });

		var svg = CurDiv.append("svg")
			.attr("width", CanvasWidth)
			.attr("height", CanvasHeight)
			.append("g")
			.attr("transform", "translate(" + CanvasWidth / 2 + "," + CanvasHeight / 2 + ")");

		var g = svg.selectAll(".arc")
			.data(pie(DataArray))
			.enter().append("g")
			.attr("class", "arc");

		g.append("path")
			.attr("d", arc)
			.style("fill",function(d) { return ColorPanel.Functions.GetBackgroundColor(d.data.label);})
			.append("title").text(function(d) {return SpadeSettings.Aggregators[SelectVals.AggregatorType].name+" "+SelectVals.AggregatorAttribute+": "+d.value;});

	  g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
	  	.style("fill",function(d) { return ColorPanel.Functions.GetTextColor(d.data.label);})
		.text(function(d) { return d.data.label; });
	}
	
}
