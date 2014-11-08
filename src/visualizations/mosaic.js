/* globals d3, SpadeSettings, ReadSelectValues, Globals,window,html2canvas,DownloadImageFile,event,document, GetPanel */

SpadeSettings.Visualizations.push({
			name: "Mosaic", 
			Functions: {
				DrawFunc: MosaicDraw, 				//Called to draw mosaic
				DrawInitFunc: MosaicDrawInit		//Called before drawing starts (i.e. will only be called once even if screen is tiled w/many mosaics)
			},
			Settings: {
				TableDerived: true
			},
			Panels: {
				DataSetPanel: {},
				VisualizationPanel: {},				
				SplitPanel: {
					Splits: [
						{Name: "Row",NoSplit:true},
						{Name: "Col",NoSplit:true}
					]
				},
				AggregatorPanel: {
					Aggregators: ["Count","Sum"]
				},
				FilterPanel: {},
				AdvancedOptionsPanel: {},
				ColorPanel: {
					ColorScale: true,
					ColorBy: ["Column","Row"]
				}
			},
			AdvancedOptions: [
				{type:"Select",id:"Size",title:"Size: ",vals:["Auto","1 x 1","1 x 2","2 x 1","2 x 2"]},
				{type:"Check",id:"ShowText",title:"Show Text:",checked:true},
				{type:"Check",id:"ShowTitle",title:"Show Titles:",checked:true},
				{type:"Check",id:"Tooltip",title:"Tooltip:",checked:true},
				{type:"Text",id:"ColorMin",title:"Color Min:"},
				{type:"Text",id:"ColorMax",title:"Color Max:"},
				{type:"Button",id:"ExportImage",text:"Export Image",func:MosaicExportImage}
			]
		});

/* ------------------------------------------------------------------------------------------------------------ */

function MosaicDrawInit() {
	//Set TableSelectVals to calculate as percent of col
	var SelectVals = ReadSelectValues();
	SelectVals.VisAdvancedOptions = Globals.TableDefaultOptions;
	SelectVals.VisAdvancedOptions.TableNumberShowAs = "Percent of Column";
	SpadeSettings.Visualizations[SelectVals.VisualizationType].TableSelectVals = SelectVals;
	GetPanel("ColorPanel").Functions.DataInit();
	return true;
}

function MosaicDraw(Data,SelectVals,MainDiv) {

	var ColWidths = [],i,MosaicColData,HeaderHeight,HorizSizeDivisor,VertSizeDivisor,Qizer;
	var ColorPanelFunctions = GetPanel("ColorPanel").Functions;
	//Set the divisor used to calculate tile sizes
	if (SelectVals.VisAdvancedOptions.MosaicSize == "Auto") {
		HorizSizeDivisor = SelectVals.HorizTileAttribute == "(no split)" ? 1 : 2;	
		VertSizeDivisor = SelectVals.VertTileAttribute == "(no split)" ? 1 : 2;
	}
	else {
		HorizSizeDivisor = +SelectVals.VisAdvancedOptions.MosaicSize[0];
		VertSizeDivisor = +SelectVals.VisAdvancedOptions.MosaicSize[4];
	}
	
	//Get all column totals, which are used to calculate mosaic column widths
	MainDiv.selectAll(".MainTable tr:last-child td.TotalTD:not(:last-child):not(:first-child)")
		.each(function(d,i) {
			if (d.fullval === "") d.fullval = 0;
			ColWidths.push(+d.fullval);
		});
	var GrandTotal = ColWidths.reduce(function(a,b) {return a+b;});		//Grand Total used to calculate the percentage width for each col
	var MosaicArray = [];
	for (i=0;i<ColWidths.length;i++) {
		if (ColWidths[i] === 0) continue;								//Don't display cols that have no data
		MosaicColData = {Width:ColWidths[i] / GrandTotal};
		//Get the data from all the cells in this column
		MosaicColData.CellData = MainDiv.selectAll(".MainTable td:nth-child("+(i+2)+"):not(.TotalTD)").data();
		MosaicColData.ColNum = MosaicArray.length;
		MosaicArray.push(MosaicColData);
	}
	MainDiv.selectAll("*").remove();									//Remove the table we built upon from DOM
	MainDiv.style("width",document.getElementById("MainDiv").scrollWidth/HorizSizeDivisor-40+"px");
	var TotalHeight = window.innerHeight-d3.select("#HeaderDiv").node().offsetHeight-60;
	MainDiv.style("height",TotalHeight/VertSizeDivisor+"px");
	MainDiv.style("padding","2px");
	
	if (SelectVals.VisAdvancedOptions.MosaicShowTitle) {
		HeaderHeight = 4+MainDiv.append("div").selectAll("div")			//Header row
			.data(MosaicArray)
			.enter()
			.append("div")
			.attr("class","MosaicColTitleDiv")
			.style("width",function(d,i) {return d.Width*100+"%";})
			.html(function(d) {return d.CellData[0].col === "" ? "(blank)" : d.CellData[0].col;})
			.node().offsetHeight;
	}
	else HeaderHeight = 0;
	
	var MosaicCols = MainDiv.append("div");
	MosaicCols.style("height",TotalHeight/VertSizeDivisor - HeaderHeight+"px");
	var MarginPercent = 4/(TotalHeight/VertSizeDivisor - HeaderHeight)*100;
	
	MosaicCols = MosaicCols.selectAll("div")							//Add columns
		.data(MosaicArray)
		.enter()
		.append("div")
		.attr("class","MosaicColDiv")
		.classed("MosaicExplodedCol",true)
		.style("width",function(d,i) {
			var CurWidth = d.Width*100- 0.5;
			CurWidth = CurWidth < 0 ? 0 : CurWidth;
			return CurWidth + "%";
		});
	

	//var AllValues = [];
	var MosaicCells = MosaicCols.selectAll("div")						//Add cells
		.data(function(row) {return row.CellData;})
		.enter()
		.append("div")
		.style("height",function(d,i) {
			var h = d.showasval*100- MarginPercent;
			h = h < 0 ? 0 : h;
			return h+"%";
		})
		.attr("class","MosaicCellDiv MosaicExplodedCell")
		.attr("data-title","<div>This is the tooltip</div>")
		.html(function(d) {
			if (d.row !== undefined && SelectVals.ColorPanelColorBy == "Row") ColorPanelFunctions.AddData(d.row);
			if (SelectVals.VisAdvancedOptions.MosaicShowText) return "<div>"+d.row+" ("+MosaicFormatPercent(d.showasval)+")</div>"; 
			else return "";
		});
	if (SelectVals.VisAdvancedOptions.MosaicTooltip) {
		MosaicCells.on("mouseover", MosaicTipShow)
		.on("mousemove", MosaicTipMove)
		.on("mouseout", MosaicTipHide);
	
	}
	



	//Color background and text
	//TODO - Color Min and Color Max options are no longer honored
	//var ColorMin = SelectVals.VisAdvancedOptions.MosaicColorMin;
	//var ColorMax = SelectVals.VisAdvancedOptions.MosaicColorMax;

	//If coloring by column, then we need to create the Qizer for column data
	if (SelectVals.ColorPanelColorBy != "Row") {
		d3.range(0,SpadeSettings.NumberOfShades).forEach(function(d){ ColorPanelFunctions.AddData(d);});
	}

	MosaicCells
	.style("background-color",function(d,i) {
		if (SelectVals.ColorPanelColorBy == "Row") {
			return ColorPanelFunctions.GetBackgroundColor(d.row);
		}
		else {
			var ColNum = d3.select(this.parentNode).datum().ColNum;
			return ColorPanelFunctions.GetBackgroundColor(ColNum%SpadeSettings.NumberOfShades);
		}
	})
	.style("color",function(d,i) {
		if (SelectVals.ColorPanelColorBy == "Row") {
			return ColorPanelFunctions.GetTextColor(d.row);
		}
		else {
			var ColNum = d3.select(this.parentNode).datum().ColNum;
			return ColorPanelFunctions.GetTextColor(ColNum%SpadeSettings.NumberOfShades);
		}

	});
	
	MosaicCells.filter(function(d) {return d.showasval ==="" || this.offsetHeight === 0;}).remove();			//Remove any blank cells
	MosaicCols.filter(function(d) {return d.Width*100- 0.5 < 0;}).remove();			//Remove any blank cols
}

function MosaicTipShow(d,i) {
	var ToolTipDiv = d3.select("#ToolTipDiv");
	ToolTipDiv.style("visibility", "visible").style("opacity","").selectAll("*").remove();
	var ParentData = this.parentNode.__data__;
	var ColName = this.__data__.col;
	var RowName = this.__data__.row;
	
	ToolTipDiv.selectAll("div")		//Tooltip contents
		.data(ParentData.CellData.filter(function(d) {return d.showasval !=="";}))
		.enter()
		.append("div")
		.text(function(d,i) {return d.row+": "+MosaicFormatPercent(d.showasval);})
		.classed("TipContents",true)
		.style("font-weight",function(d,i) {return d.row == RowName ? "bold" : "normal";});
	
	ToolTipDiv.insert("div","div")	//Tooltip header
		.html("<u class='TipContents'>"+ColName+"</u> <i class='TipContents'>("+MosaicFormatPercent(ParentData.Width)+")</i>")
		.style("text-align","center")
		.classed("TipContents",true)
		.style("margin-bottom","5px");
	d3.selectAll(".TipContents").on("mousemove",MosaicTipMove);
}
function MosaicTipMove(d,i) {
	var TipWidth = document.getElementById("ToolTipDiv").offsetWidth;
	var TipHeight = document.getElementById("ToolTipDiv").offsetHeight;
	var TipX = event.pageX+10+TipWidth < window.innerWidth-2+window.scrollX ? event.pageX+10 : window.innerWidth+window.scrollX - TipWidth-2;
	var TipY = event.pageY-10+TipHeight < window.innerHeight-2+window.scrollY ? event.pageY-10 : window.innerHeight+window.scrollY - TipHeight - 2;
	if (TipY < document.getElementById("MainDiv").offsetTop) RemoveTip();
	else if (TipX > document.getElementById("TileTable").offsetLeft+ document.getElementById("TileTable").offsetWidth) RemoveTip();
	else d3.select("#ToolTipDiv").style("top", (TipY-10)+"px").style("left",TipX+"px");
}

function MosaicTipHide(d,i) {
	if (event.toElement === null || event.toElement.classList.contains("TipContents")) {
		return;
	}
	RemoveTip();
}
function RemoveTip() {
	 d3.select("#ToolTipDiv").style("visibility", "hidden").style("opacity","0");
	d3.selectAll(".TipContents").on("mousemove",null);
	
}

function MosaicExportImage() {
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

function MosaicFormatPercent(val) {
	return Math.round(val*100)+"%";	
}
