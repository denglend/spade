/* globals ss,SplitPanelInit,AttributePanelInit,AggregatorPanelInit,SelectPanelInit,FilterPanelInit,AdvancedOptionsPanelInit */

var PivotSettings = {
	Version: "0.3.0",
	MaxFilters: 5,
	NumberOfShades: 7,
	HiddenAttributes: {				//Should all be in upper case; will be checked case insensitively
		FilterAttributeSelect: [],
		DisplayAttribute: []
	},
	DataSets: [
		{name: "Calendar Test",path:"../../sampledata/",file:"calendar_test",defaulthash:"a=Adj%20Close&b=0&c=3&k=(no%20split)&j=(no%20split)&g=calendar_test&h=Date&F0e=(any)&F0d=0&F0f=Adj%20Close&Va=0&l="},
		{name: "Upload Data Set",file:"(upload)"}
	],
	ColorScales: [ 
		{name: "Blues", prefix: "B",js:"Blues" },
		{name: "Red-Green", prefix:"Q",js:"RdYlGn" },
		{name: "Green-Red", prefix:"GR", js:"GnYlRd"},
		{name: "Contrasing", prefix: "C", js:"Set1"},
		{name: "Grayscale", prefix: "G",js:"Greys" },
		{name: "None", prefix: "N",js:"None"}
	],
	Comparators: [
		{name: "Equal to", func: function(a) {return function(b) { return a == b;};}},
		{name: "Not Equal to", func: function(a) {return function(b) {return a != b;};}},
		{name: "At Least", func: function(a) {return function(b) {return +a <= +b;};}},
		{name: "At Most", func: function(a) {return function(b) {return +a >= +b;};}}
	],
	Aggregators: [	//THESE SHOULD MOVE TO PANEL-AGGREGATOR
		{name: "Average of", shortname: "Average", func: function(a) {return a.reduce(function(v1, v2) { return parseFloat(v1) + parseFloat(v2); })/a.length;}},
		{name: "Count of", shortname: "Count", func: function(a) {return a.length;}},
		{name: "Max of", shortname: "Max", func: function(a) {return Math.max.apply(null,a);}},
		{name: "Min of", shortname: "Min", func: function(a) {return Math.min.apply(null,a);}},
		{name: "Median of", shortname: "Median", func: function(a) {return ss.median(a.map(function(val) { return parseFloat(val);}));}},
		{name: "StdDev of", shortname: "StdDev", func: function(a) {return ss.standard_deviation(a.map(function(val) { return parseFloat(val);}));}},		 
		{name: "Sum of", shortname: "Sum", func: function(a) {return a.reduce(function(v1, v2) { return parseFloat(v1) + parseFloat(v2); });}},
		{name: "Count Unique", shortname:"CountU", func: function(a) { var c = {}; for(var i=0;i<a.length;i++) c[a[i]] = 1; return Object.keys(c).length;}}
	],
	Visualizations: [],			//Each vis's js file pushes its settings into this array
	Panels: []					//Each panel's js file pushes its settings into this array
};

var Globals = {
	Data: null,
	CurAttributes: [],
	SavedHeaderDiv: "",				//Used to save the HTML from the Header at initial page load so that it can be restored when loading a new data set
	Catalog: [],						//Used to store information about each Attribute (e.g. whether it's numerical or categorical)
	IgnoreHashChange: false,
	URLParams: null,
	TableDefaultOptions: {
		TableColorScale: "0",
		TableNumberFormat: "Auto",
		TableNumberPlaces: "0",
		TableNumberShowAs: "(normal)",
		TableShowHeaders: true,
		TableShowLegend: true,
		TableShowText: true,
		TableShowTotals: true
	}
};
