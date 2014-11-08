/* globals Globals, window,document,d3,html2canvas,ReadSelectValues,DownloadImageFile,SpadeSettings,colorbrewer,ss,
   CreateDomElement,Image,event,console,DisplayModal,GetPanel*/

SpadeSettings.Visualizations.push({
			name: "Correlogram",
			Functions: {
				DrawFunc:CorrelDraw,
				DrawInitFunc:CorrelDrawInit
			},
			Settings: {
				RedrawOnVerticalResize: false,
				RedrawOnHorizontalResize: true
			},
			Panels: {
				AttributePanel: {},
				DataSetPanel: {},
				VisualizationPanel: {},				
				FilterPanel: {},
				AdvancedOptionsPanel: {},
				ColorPanel: {
					ColorBy: true,
					ColorScale: true,
					Opacity: true
				}
			},
			AdvancedOptions: [
				{type:"Select",id:"Size",title:"Size: ",vals:["Auto","Full"]},
				{type:"Check",id:"ShowStatistics",title:"Show Statistics:",checked:false},
				{type:"Check",id:"ShowLine",title:"Show Line:",checked:false},
				{type:"Check",id:"DarkBackground",title:"Dark Background:",checked:false},
				{type:"Check",id:"ShowLegend",title:"Show Legend:",checked:true},
				{type:"Button",id:"ExportImage",text:"Export Image",func:CorrelExportImage}
			]
		});

var CorrelSettings = {
	//Plot Options
	BoxMaxSize: 200,
	BoxMinSize: 50,
	BoxOuterPadding: 16,						//Space between boxes
	BoxInnerPadding: 4,							//Doesn't actually function
	StatsBoxHeight: 40,							//Height of the box that reports correlation and significance
	StatsBoxTopPadding:5,
	LegendTopPadding:0,						//Amount of space from bottom of chart to start of legend
	LegendLeftPadding: 0,
	CanvasTopPadding: 20,							//Amount of padding from top of Canvas element to start of chart
	CanvasRightPadding:25,
	CanvasRightMargin: 30,						//Amount of space to reserve between Canvas width and window.innerWidth
	PointMaxSize:6,
	PointMinSize:3,
	TextMaxSize:12,
	TextMinSize:6,
	
	//Interface Options
	ZoomScale: 2,								// Zoomed-in mode is X times BoxMaxSize
	MaxFilters: 5,
	NumberOfShades: 7,
	AutoOpacityMax: 0.6,
	AutoOpacityMin: 0.01,
};
var CorrelGlobals = {
	BoxSize: null,
	RowHeight: null,
	Scales: null,
	Axes: null,
	ColorAttribute: null,
	Opacity: null,
	PointSize: null,
	TextSize: null,
	SelectVals: null,
	FilteredData: null
};


/* ------------------------------------------------------------------------------------------------------------ */


function CorrelDrawInit() {

	GetPanel("ColorPanel").Functions.DataInit();
	return true;
}

function CorrelDraw(Data,SelectVals,MainDiv) {
	var HorizSizeDivisor;
	var NumAttributes = Globals.CurAttributes.length;
	CorrelGlobals.SelectVals = SelectVals;
	CorrelGlobals.FilteredData = Data.CurData;
	
	if (NumAttributes === 0) {
		MainDiv.html("<div class='CorrelNoAttr'>Select at least one attribute</div>");
	}
	//Set the divisor used to calculate tile sizes
	if (SelectVals.VisAdvancedOptions.CorrelogramSize == "Auto") {
		HorizSizeDivisor = SelectVals.HorizTileAttribute == "(no split)" ? 1 : 2;	
	}
	else {
		HorizSizeDivisor = 1;
	}
	
	if (SelectVals.VisAdvancedOptions.CorrelogramSize == "Auto") {
		CorrelGlobals.BoxSize = (window.innerWidth-CorrelSettings.CanvasRightPadding-CorrelSettings.CanvasRightMargin)/NumAttributes/HorizSizeDivisor-8;
		CorrelGlobals.BoxSize = CorrelGlobals.BoxSize < CorrelSettings.BoxMinSize ? CorrelSettings.BoxMinSize : CorrelGlobals.BoxSize;
		CorrelGlobals.BoxSize = CorrelGlobals.BoxSize > CorrelSettings.BoxMaxSize ? CorrelSettings.BoxMaxSize : CorrelGlobals.BoxSize;
	}
	else {
		CorrelGlobals.BoxSize = CorrelSettings.BoxMaxSize;
	}
	

	var ColorPanel = GetPanel("ColorPanel");
	Data.CurData.forEach(function(d) { ColorPanel.Functions.AddData(d[SelectVals.ColorPanelColorBy],MainDiv);});

	CalculateCorrelGlobals(Data.CurData,SelectVals);
	
	var LeftPadding = ((window.innerWidth-CorrelSettings.CanvasRightMargin-CorrelSettings.CanvasRightPadding)-(NumAttributes*CorrelGlobals.BoxSize))/2;
	LeftPadding  = LeftPadding < 0 ? 0 : LeftPadding;
	
	var CanvasHeight = 	NumAttributes*(CorrelGlobals.BoxSize+CorrelSettings.StatsBoxHeight) + CorrelSettings.CanvasTopPadding;
	
	var CanvasWidth = NumAttributes*CorrelGlobals.BoxSize + CorrelSettings.CanvasRightMargin+CorrelSettings.CanvasRightPadding;
	
	var Canvas = MainDiv
		.append("canvas")
		.attr("width",CanvasWidth)
		.attr("height",CanvasHeight)
		.on("click",CorrelCanvasClickHandler)
		.node();
	var Context = Canvas.getContext("2d");

	
	CorrelDrawLabels(Context);
	CorrelDrawAxes(Context);
	CorrelPlot(Context,Data.CurData,SelectVals);
	if (SelectVals.VisAdvancedOptions.CorrelogramShowLegend) MainDiv.append(GetPanel("ColorPanel").Functions.GetLegend);
}

function CalculateCorrelGlobals(FilteredData,SelectVals) {
	CorrelGlobals.PointSize = (CorrelGlobals.BoxSize - CorrelSettings.BoxMinSize) / (CorrelSettings.BoxMaxSize - CorrelSettings.BoxMinSize) * (CorrelSettings.PointMaxSize - CorrelSettings.PointMinSize) + CorrelSettings.PointMinSize;
	CorrelGlobals.TextSize = (CorrelGlobals.BoxSize - CorrelSettings.BoxMinSize) / (CorrelSettings.BoxMaxSize - CorrelSettings.BoxMinSize) * (CorrelSettings.TextMaxSize - CorrelSettings.TextMinSize) + CorrelSettings.TextMinSize;
	CorrelGlobals.RowHeight = (CorrelGlobals.BoxSize+CorrelSettings.StatsBoxHeight);					//The height of each row of the plot
	CorrelGlobals.Scales = CorrelCreateScales(Globals.CurAttributes,FilteredData);
	CorrelGlobals.Axes = CorrelCreateAxes();
	CorrelGlobals.ColorAttribute = SelectVals.ColorPanelColorBy;
	
	CorrelGlobals.Opacity = SelectVals.ColorPanelOpacity;
	if (CorrelGlobals.Opacity =="Auto") {
		CorrelGlobals.Opacity = 60.8*Math.pow(FilteredData.length,-0.95);			//Exponential Regression says this should be about right
		if (CorrelGlobals.Opacity > CorrelSettings.AutoOpacityMax) CorrelGlobals.Opacity = CorrelSettings.AutoOpacityMax;
		if (CorrelGlobals.Opacity < CorrelSettings.AutoOpacityMin) CorrelGlobals.Opacity = CorrelSettings.AutoOpacityMin;
	}
	else CorrelGlobals.Opacity = +CorrelGlobals.Opacity.replace("%","")/100;
	}


function CorrelPlotZoom(FilteredData,SelectVals,i,j) {
	//Plot only the i,j correlation, zoomed in, and in a modal
	

	var BackupGlobals = JSON.parse(JSON.stringify(CorrelGlobals));
	CorrelGlobals.BoxSize = CorrelSettings.BoxMaxSize;
	CalculateCorrelGlobals(FilteredData,SelectVals);
	
	DisplayModal({	Content:"<canvas id='CorrelZoomCanvas' width='"+CorrelSettings.ZoomScale*CorrelGlobals.BoxSize+"' height='"+CorrelSettings.ZoomScale*CorrelGlobals.RowHeight+"'></canvas><div><button class='ModalButton ModalCloseButton'>Close</button><button class='ModalButton' onclick=\"DownloadImageFile('"+SelectVals.DataSet+"_"+Globals.CurAttributes[i]+"_"+Globals.CurAttributes[j]+".png',document.getElementById('CorrelZoomCanvas'))\">Export Image</button></div>",
					Type:"General",
					afterCreate:function(m) {
						var Canvas = document.getElementById("CorrelZoomCanvas");
						var Context = Canvas.getContext("2d");
						Context.scale(CorrelSettings.ZoomScale,CorrelSettings.ZoomScale);
						Context.translate(-1 * i * CorrelGlobals.BoxSize,-1 * j * CorrelGlobals.RowHeight);
						
						CorrelPlot(Context,FilteredData,SelectVals);
						CorrelGlobals = BackupGlobals;
						
						d3.selectAll(".ModalCloseButton").on("click",function() {m.close();});
					}});
	
}

function CorrelPlot(Context,FilteredData,SelectVals) {
	for (var i=0;i<Globals.CurAttributes.length;i++) {
		for (var j=0;j<Globals.CurAttributes.length;j++) {
			var BoxX = CorrelSettings.BoxOuterPadding/2 ;
			var BoxY = CorrelSettings.BoxOuterPadding/2;
			var BoxWidth = CorrelGlobals.BoxSize - CorrelSettings.BoxOuterPadding;
			var BoxHeight = BoxWidth;
			
			Context.save();
			Context.translate(i * CorrelGlobals.BoxSize,j * CorrelGlobals.RowHeight);
			if (SelectVals.VisAdvancedOptions.CorrelogramDarkBackground) {
				Context.fillStyle="rgb(45,45,45)";
				Context.fillRect(BoxX,BoxY,BoxWidth,BoxHeight);
			}
			
			if (i != j) {	//Don't display stats box on when correlating against self
				CorrelPlotStatistics(Context,FilteredData,i,j,SelectVals.VisAdvancedOptions.CorrelogramShowStatistics,SelectVals.VisAdvancedOptions.CorrelogramShowLine,SelectVals.VisAdvancedOptions.CorrelogramDarkBackground);
				Context.strokeRect(BoxX,BoxY+BoxHeight,BoxWidth,CorrelSettings.StatsBoxHeight); //Stats box

			}
			Context.strokeRect(BoxX,BoxY,BoxWidth,BoxHeight);	//Plot box
			
			CorrelPlotPoints(Context,FilteredData,i,j);
			Context.restore();
		}
	}
}

function CorrelPlotStatistics(Context,FilteredData,i,j,ShowStatistics,ShowLine,DarkBackground) {

	//Calculate Correlation
	var CorrelData = FilteredData.filter(function(d) { return !isNaN(d[Globals.CurAttributes[i]]) && !isNaN(d[Globals.CurAttributes[j]]) && d[Globals.CurAttributes[i]] !== "" && d[Globals.CurAttributes[j]] !== "";});
	var CorrelVal = ss.sample_correlation(CorrelData.map(function(d) {return d[Globals.CurAttributes[i]];}),CorrelData.map(function(d) {return d[Globals.CurAttributes[j]];}));
	var CorrelDescriptor = Math.abs(CorrelVal) > 0.7 ? "Strong" : (Math.abs(CorrelVal) > 0.35 ? "Moderate" : "Weak");
	CorrelDescriptor += " Correlation";
	var CorrelText = "";
	var Significance = Math.round(1000*CorrelCalculateSignificance(CorrelVal,CorrelData.length))/1000;
	var SignificanceDescriptor = Significance < 0.01 ? "High" : (Significance < 0.05 ? "Moderate" : "Low");
	SignificanceDescriptor += " Significance";
	var SignificanceText= "";
	CorrelVal = Math.round(100*CorrelVal)/100;
	var RegressionArray = [];
	CorrelData.forEach(function(el) { RegressionArray.push([el[Globals.CurAttributes[i]],el[Globals.CurAttributes[j]]]);});
	var Regression = ss.linear_regression().data(RegressionArray);
	var RegB = Regression.b();
	var RegM = Regression.m();
	var RegLine = Regression.line();
	var RegX0 = CorrelGlobals.Scales.x[Globals.CurAttributes[i]].domain()[0];
	var RegX1 = CorrelGlobals.Scales.x[Globals.CurAttributes[i]].domain()[1];
	var RegY0 = CorrelGlobals.Scales.y[Globals.CurAttributes[j]](RegLine(RegX0));
	var RegY1 = CorrelGlobals.Scales.y[Globals.CurAttributes[j]](RegLine(RegX1));
	RegX0 = CorrelGlobals.Scales.x[Globals.CurAttributes[i]]( RegX0);
	RegX1 = CorrelGlobals.Scales.x[Globals.CurAttributes[i]]( RegX1);
	
	var CorrelationColor;
	if (CorrelVal>=0) CorrelationColor = d3.rgb(Significance < 0.01 ? "#22BB22" : (Significance < 0.05 ? "#77EE66" : "#EEFFEE"));
	else CorrelationColor = d3.rgb(Significance < 0.01 ? "#FF2222" : (Significance < 0.05 ? "#FF6666" : "#FFEEEE"));


	if (ShowStatistics) {	//Set Correlation Text to stats info
		CorrelText  = "r="+CorrelVal+"     y="+RegM.toPrecision(2)+"x+"+RegB.toPrecision(2);
		SignificanceText = "p="+Significance;

	}
	else {								//Display correlation graphical bar
		CorrelText = CorrelDescriptor;
		SignificanceText = SignificanceDescriptor;
		var BoxX =  (CorrelVal > 0 ? CorrelSettings.BoxOuterPadding/2 : CorrelGlobals.BoxSize - CorrelSettings.BoxOuterPadding/2 - Math.abs(CorrelVal)*(CorrelGlobals.BoxSize-CorrelSettings.BoxOuterPadding));
		var BoxY = CorrelGlobals.BoxSize - CorrelSettings.BoxOuterPadding/2;
		var BoxWidth = Math.abs(CorrelVal)*(CorrelGlobals.BoxSize-CorrelSettings.BoxOuterPadding);
		var BoxHeight = CorrelSettings.StatsBoxHeight;
		Context.fillStyle = "rgb("+CorrelationColor.r+","+CorrelationColor.g+","+CorrelationColor.b+")";
		Context.fillRect(BoxX,BoxY,BoxWidth,BoxHeight);	//Plot stats bar
	}

	// Draw Correlation text
	var TextX =  CorrelGlobals.BoxSize/2;
	var TextY =  CorrelGlobals.BoxSize+CorrelSettings.StatsBoxTopPadding- CorrelSettings.BoxOuterPadding/2;
	Context.textAlign = "center";
	Context.fillStyle = "black";
	Context.textBaseline = "top";
	Context.fillText(CorrelText,TextX,TextY);

	TextY = CorrelGlobals.BoxSize+CorrelSettings.StatsBoxHeight/2- CorrelSettings.BoxOuterPadding/2;
	Context.fillText(SignificanceText,TextX,TextY);

	if (ShowLine) {
		Context.save();
		Context.rect(CorrelSettings.BoxOuterPadding/2,CorrelSettings.BoxOuterPadding/2,CorrelGlobals.BoxSize-CorrelSettings.BoxOuterPadding/2,CorrelGlobals.BoxSize-CorrelSettings.BoxOuterPadding/2);
		Context.clip();
		Context.lineWidth = 3;
		if (DarkBackground) {
			Context.strokeStyle = "white";
		}
		else {
			Context.strokeStyle = "gray";
		}
		Context.beginPath();
		Context.moveTo( RegX0, RegY0);
		Context.lineTo( RegX1, RegY1);
		Context.stroke();
		Context.restore();
	}
}

function CorrelPlotPoints(Context,FilteredData,i,j) {
	//i = x position of attribute to draw
	//y = y position
	var XAttribute = Globals.CurAttributes[i];
	var YAttribute = Globals.CurAttributes[j];
	var ColorPanel = GetPanel("ColorPanel");

	for (var k=0;k<FilteredData.length;k++) {
		var CurDatum = FilteredData[k];
		var XCoord = CorrelGlobals.Scales.x[XAttribute](CurDatum[XAttribute]) ;
		var YCoord = CorrelGlobals.Scales.y[YAttribute](CurDatum[YAttribute]) ;

		var Color = d3.rgb(ColorPanel.Functions.GetBackgroundColor(CurDatum[CorrelGlobals.ColorAttribute]));
		Context.fillStyle = "rgba("+Color.r+","+Color.g+","+Color.b+","+CorrelGlobals.Opacity+")";
		Context.beginPath();
		Context.arc(XCoord,YCoord,CorrelGlobals.PointSize/2,0,Math.PI*2,true);
		Context.fill();
	}
	
}


function CorrelDrawLabels(Context) {
	// Titles for the diagonal.
	for (var i=0;i<Globals.CurAttributes.length;i++) {
		var x = i*CorrelGlobals.BoxSize + CorrelSettings.BoxInnerPadding/2 + CorrelSettings.BoxOuterPadding/2;
		var y = i*CorrelGlobals.RowHeight + CorrelSettings.BoxInnerPadding/2 + CorrelSettings.BoxOuterPadding/2;
		Context.font = CorrelGlobals.TextSize + "px Arial";
		Context.textBaseline = "top";
		Context.fillText(Globals.CurAttributes[i],x,y);
	}
}

function CorrelDrawAxes(Context) {
	// X-axis.
/*
	// Y-axis.
	svg.selectAll("g.y.axis")
	.data(traits)
	.enter().append("svg:g")
	.attr("class", "y axis")
	.attr("transform", function(d, i) { return "translate(0," + i * RowHeight + ")"; })
	.attr("data-n",function(d,i) { return i;})
	.each(function(d) { d3.select(this).call(yaxis.scale(Globals.Scales.y[d]).orient("right")); })
	.on("click",RowZoomInHandler);	
*/
}

function CorrelCreateAxes() {
	var Axes = {x:null,y:null};
	
	Axes.x = d3.svg.axis()
	.ticks(5)
	.tickSize(CorrelGlobals.RowHeight * Globals.CurAttributes.length);

	Axes.y = d3.svg.axis()
	.ticks(5)
	.tickSize(CorrelGlobals.BoxSize *Globals.CurAttributes.length)	;
	return Axes;
}

function CorrelCreateScales(Attributes,FilteredData) {
	// Position scales.
	//var x = {}, y = {};
	var Scales = {x: {},y:{}};
	Attributes.forEach(function(Attribute) {
		var value = function(d) { return d[Attribute] !== "" ? d[Attribute] : null; },
			domain = [d3.min(FilteredData, value), d3.max(FilteredData, value)],
			range = [CorrelSettings.BoxOuterPadding / 2, CorrelGlobals.BoxSize - CorrelSettings.BoxOuterPadding / 2];
		Scales.x[Attribute] = d3.scale.linear().domain(domain).range(range);
		Scales.y[Attribute] = d3.scale.linear().domain(domain).range(range.slice(0).reverse());
	});
	return Scales;
}




function CorrelExportImage() {
	var SavedHeight = d3.select("#MainDiv").style("height");
	d3.select("#MainDiv").style("height","");
	html2canvas(d3.select("#TileTable").node(),{
		onrendered: function(canvas) {
			d3.select("#MainDiv").style("height",SavedHeight);
			var SelectVals = ReadSelectValues();
			DownloadImageFile(SelectVals.DataSet+".png",canvas);
		}
	});
}

function CorrelCanvasClickHandler(d,i) {
	var XVal = 	event.offsetX;
	var XCol = Math.floor(XVal / CorrelGlobals.BoxSize);
	if (XCol >= Globals.CurAttributes.length) {
		console.log("Click Canceled b/c too far right: "+XVal+" "+XCol);
		return;
	}
	XVal = XVal % CorrelGlobals.BoxSize;
	if (XVal < CorrelSettings.BoxOuterPadding/2 || XVal+CorrelSettings.BoxOuterPadding/2 > CorrelGlobals.BoxSize) {
		console.log("Click cancled b/c in X box margin: "+XVal);
		return;
	}
	var YVal = event.offsetY;
	var YCol = Math.floor((YVal-CorrelSettings.CanvasTopPadding)/CorrelGlobals.RowHeight);
	if (YCol >= Globals.CurAttributes.length) {
		console.log("Click Canceled b/c too far down: "+YVal+" "+YCol);
		return;
	}
	YVal = YVal % CorrelGlobals.RowHeight;
	if (YVal < CorrelSettings.BoxOuterPadding/2 || YVal+CorrelSettings.BoxOuterPadding/2 > CorrelGlobals.RowHeight) {
		console.log("Click cancled b/c in Y box margin: "+YVal);
		return;
	}
	console.log("Clicked on "+XCol+","+YCol);
	CorrelPlotZoom(CorrelGlobals.FilteredData,CorrelGlobals.SelectVals,XCol,YCol);
}




function CorrelCalculateSignificance(e,t){function z(e,t){var n=Math.PI;var i=n/2;e=Math.abs(e);var s=e/Math.sqrt(t);var o=Math.atan(s);if(t==1){return 1-o/i;}var u=Math.sin(o);var a=Math.cos(o);if(t%2==1){return 1-(o+u*a*y(a*a,2,t-3,-1))/i;}else{return 1-u*y(a*a,1,t-3,-1);}}function y(e,t,n,r){var i=1;var s=i;var o=t;while(o<=n){i=i*e*o/(o-r);s=s+i;o=o+2;}return s;}return z(e/Math.sqrt((1-e*e)/(t-2)),t);}
