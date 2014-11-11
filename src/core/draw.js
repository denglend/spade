/* globals d3,ReadSelectValues,CalculatePivotData,SpadeSettings,ReadHashFromSelectValues,document,PivotObjectToArray,Globals,FilterData,
   CreateDomElement,window,CatalogAddFilteredData, location, LoadingModal */

function ResetMainDivHeight() {
	return d3.select("#MainDiv").style("height",window.innerHeight - document.getElementById("MainDiv").offsetTop-4+"px");
}

function Redraw() {
	var Modal = LoadingModal("Calculating...");
	window.setTimeout(function() {RedrawInner();Modal.close();},1);
}


function RedrawInner() {

	var SelectVals = ReadSelectValues();
	var FilteredData = FilterData(Globals.Data,SelectVals.Filters);
	
	var MainDiv = ResetMainDivHeight();
	MainDiv.selectAll("*").remove();
	
	if (SpadeSettings.Visualizations[SelectVals.VisualizationType].Functions.DrawInitFunc !== undefined) {
		if (!SpadeSettings.Visualizations[SelectVals.VisualizationType].Functions.DrawInitFunc(SelectVals)) return;
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
				var TileSubDiv = TileDiv.append("div");		//Need sub div so that title isn't overwritten by vis
				var DataVar = {FullData: Globals.Data, FilteredFullData: FilteredData, CurData: TileFilteredData};
				for (var i in SpadeSettings.Panels) {		//Add in panel-calculated data like PivotObj and PivtArray
					if (SpadeSettings.Panels[i].Functions.CalculateData !== undefined) {
						SpadeSettings.Panels[i].Functions.CalculateData(DataVar);
					}
				}

				if (SpadeSettings.Visualizations[SelectVals.VisualizationType].Settings.TableDerived) {
					//If current visualization's tabledervied == true, call table's drawfunc before calling current vis's drawfunc
					var TableSelectVals = SpadeSettings.Visualizations[SelectVals.VisualizationType].TableSelectVals;
					if (TableSelectVals === undefined) TableSelectVals = SelectVals;
					SpadeSettings.Visualizations[0].Functions.DrawFunc(DataVar,TableSelectVals,TileSubDiv);
				}
				//Call visualization's Draw Function
				SpadeSettings.Visualizations[SelectVals.VisualizationType].Functions.DrawFunc(DataVar,SelectVals,TileSubDiv);
			}
			return TileDiv.remove().node();
		});
		d3.selectAll(".FakeHiddenNode").remove();

	return;
}



