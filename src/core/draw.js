/* globals d3,ReadSelectValues,CalculatePivotData,PivotSettings,ReadHashFromSelectValues,document,PivotObjectToArray,Globals,FilterData,
   CreateDomElement,window,CatalogAddFilteredData, location */

function ResetMainDivHeight() {
	return d3.select("#MainDiv").style("height",window.innerHeight - document.getElementById("MainDiv").offsetTop-4+"px");
}

function Redraw() {
	//Clear Main Div
	//Create Pivot Object
	//Pass to Visualization's Draw Function
	var SelectVals = ReadSelectValues();
	var FilteredData = FilterData(Globals.Data,SelectVals.Filters);
	
	var MainDiv = ResetMainDivHeight();
	MainDiv.selectAll("*").remove();
	
	if (PivotSettings.Visualizations[SelectVals.VisualizationType].Functions.DrawInitFunc !== undefined) {
		if (!PivotSettings.Visualizations[SelectVals.VisualizationType].Functions.DrawInitFunc(SelectVals)) return;
	}
	
	//Create 2d array to generate table for tiles
	var TileArray = [];
	var HorizUniqueVals,VertUniqueVals;
	var HorizTileAttribute = SelectVals.HorizTileAttribute;
	var VertTileAttribute = SelectVals.VertTileAttribute;
	if (VertTileAttribute == "(no split)") VertUniqueVals = ["(no split)"];
	else {
		VertUniqueVals = d3.set(FilteredData.map(function(d) {return d[VertTileAttribute];})).values().sort(d3.ascending);
		//VertUniqueVals = Globals.Catalog[VertTileAttribute].UniqueList.sort(d3.ascending); //Bug: Creates tiles for Filtered-out attributes
	}
	if (HorizTileAttribute == "(no split)") HorizUniqueVals = ["(no split)"];
	else {
		HorizUniqueVals = d3.set(FilteredData.map(function(d) {return d[HorizTileAttribute];})).values().sort(d3.ascending);
		//HorizUniqueVals = Globals.Catalog[HorizTileAttribute].UniqueList.sort(d3.ascending); //Bug: Creates tiles for Filtered-out attributes
	}	
	for (var i in VertUniqueVals) {
		var CurTileRow = {name:VertUniqueVals[i],tiles:[]};
		for (var j in HorizUniqueVals) {
			 CurTileRow.tiles.push({row:VertUniqueVals[i],col:HorizUniqueVals[j]});
		}
		TileArray.push(CurTileRow);
	}
	
	Globals.IgnoreHashChange = true;
	var NewHash = ReadHashFromSelectValues();
	if (NewHash != document.location.hash)  {
		if (Globals.SuppressHistoryEntry) {
			location.replace("#" + ReadHashFromSelectValues());
			Globals.SuppressHistoryEntry = false;
		}
		else {
			document.location.hash = ReadHashFromSelectValues();
		}

	}
	
	var TileTableRows = MainDiv.append("table").attr("id","TileTable").append("tbody")
		.selectAll("tr")
		.data(TileArray)
		.enter()
		.append("tr");
	var TileTableCells = TileTableRows.selectAll("td")
		.data(function(row) { return row.tiles;})
		.enter()
		.append("td")
		.append(function(d) {
			var TileFilteredData;
			var TileRowFilter = {Attribute: SelectVals.VertTileAttribute};
			var TileColFilter = {Attribute: SelectVals.HorizTileAttribute};
			if (SelectVals.VertTileAttribute == "(no split)") TileRowFilter.CompareFunc = function(a) {return true;};
			else {
				TileRowFilter.CompareValue = d.row;
				TileRowFilter.CompareFunc = function(a) { return a == d.row;};
			}
			if (SelectVals.HorizTileAttribute == "(no split)") TileColFilter.CompareFunc = function(a) {return true;};
			else {
				TileColFilter.CompareValue = d.col;
				TileColFilter.CompareFunc = function(a) { return a == d.col;};
			}
			TileFilteredData = FilterData(FilteredData,[TileRowFilter,TileColFilter]);
			CatalogAddFilteredData(TileFilteredData);
			var HorizTitleText = SelectVals.HorizTileAttribute == "(no split)" ? "" :SelectVals.HorizTileAttribute+" = "+d.col;
			var VertTitleText = SelectVals.VertTileAttribute == "(no split)" ? "" : SelectVals.VertTileAttribute+" = "+d.row;
			if (HorizTitleText !== "" && VertTitleText !== "" ) HorizTitleText += "&nbsp;&nbsp;&nbsp;";
			var TileDiv = d3.select(CreateDomElement("<div class='TileDiv'><div class='TileTitleDiv'>"+HorizTitleText+VertTitleText+"</div></div>"));
			var HiddenNode = d3.select("body").append(function() {return CreateDomElement('<div class="FakeHiddenNode" ></div>');})
				.append(function(){return TileDiv.node();});
			if (TileFilteredData.length >0) {
				var PivotObj = CalculatePivotData(TileFilteredData);
				var PivotArray = PivotObjectToArray(PivotObj);
				var TileSubDiv = TileDiv.append("div");		//Need sub div so that title isn't overwritten by vis
				if (PivotSettings.Visualizations[SelectVals.VisualizationType].Settings.TableDerived) {
					//If current visualization's tabledervied == true, call table's drawfunc before calling current vis's drawfunc
					var TableSelectVals = PivotSettings.Visualizations[SelectVals.VisualizationType].TableSelectVals;
					if (TableSelectVals === undefined) TableSelectVals = SelectVals;
					PivotSettings.Visualizations[0].Functions.DrawFunc(PivotObj,TableSelectVals,PivotArray,TileSubDiv);
				}
				PivotSettings.Visualizations[SelectVals.VisualizationType].Functions.DrawFunc(PivotObj,SelectVals,PivotArray,TileSubDiv,TileFilteredData);
			}
			return TileDiv.remove().node();
		});
		d3.selectAll(".FakeHiddenNode").remove();
	

	return;
}



function GenerateQizer(ValueArray) {
//Pass it an array containing all the values that will be colored
//returned a Qizing function as a convenience for visualizations that want to color with color scales
//Uses Quantize if all numerical values, otherwise thresholds
	
	var domain,range;
	var UniqueValues = d3.set(ValueArray).values().map(function(d) { if (isNaN(d)) return d; return +d;});
	var AllNumbers = ValueArray.filter(function(d) {return isNaN(d);}).length === 0;
	ValueArray = ValueArray.map(function(d) {return isNaN(d) ? d : +d;});
		
	
	if (AllNumbers && UniqueValues.length > PivotSettings.NumberOfShades) {
		//For continuous data, use quantize
		ValueArray.sort(d3.ascending);
		if (ValueArray[0] == ValueArray[ValueArray.length-1]) return function(a) {return 0;};		//If all #s are the same in list, always return 0
		else return d3.scale.quantize().domain(ValueArray).range(d3.range(PivotSettings.NumberOfShades));	
	}
	else {
		//For string data, or when there are fewer than NumberOfShades unique values, just use a simple mapping
		//domain = ValueArray.filter(function(value, index, self) { return self.indexOf(value) === index;}).sort(d3.ascending);
		domain = UniqueValues.sort(d3.ascending);
		if (UniqueValues.length <= PivotSettings.NumberOfShades) {
			range = UniqueValues.map(function(el, i) {
				return Math.round(i*PivotSettings.NumberOfShades/UniqueValues.length);	
			});
		}
		else {
			range = d3.range(UniqueValues.length);
		}
		var	QizerObj = function(input) {
			if (input ===undefined) return QizerObj;
			return isNaN(input) ?
				QizerObj.rangevals[QizerObj.domvals.indexOf(input)] :
				QizerObj.rangevals[QizerObj.domvals.indexOf(+input)];
		};
		QizerObj.domain = function(setvals) {
			if (setvals ===undefined) return QizerObj.domvals;
			QizerObj.domvals = setvals;
			return QizerObj;
		};
		QizerObj.range = function(setvals) {
			if (setvals === undefined) return QizerObj.rangevals;
			QizerObj.rangevals = setvals;
			return QizerObj;
		};
		QizerObj.dontquantize = true;
		return  QizerObj.domain(domain).range(range);	 
	}
}
