/* globals PivotSettings, d3, CreateDomElement, Redraw, Globals, CreateSelectElement, document, ProcessLoadedData, MatchObjectInArray,
	ReadHashFromSelectValues, GetPanel */

PivotSettings.Panels.push({
		name:"DataSetPanel",
		PanelDiv:"DataSetDiv",
		Title: "Data Set",
		Functions: {
			ResetPanel:DataSetPanelReset,							//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: DataSetPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: DataSetPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: DataSetPanelValuesToHash,				//Return a hash value encoding current values of UI items

		},
		Options: {
			CurDataSet: ""
		}
	});
	
function DataSetPanelReadSelectValues() {
	return {DataSet: d3.select("#DataSetSelect").node().value};
}

function DataSetPanelValuesToHash() {
	return DataSetPanelReadSelectValues().DataSet;
}

function DataSetPanelUpdateFromHash(Hash) {
	d3.select("#DataSetSelect").node().value = Hash;
	if (Hash !== MatchObjectInArray(PivotSettings.Panels,"name","DataSetPanel").Options.CurDataSet) {
		
		d3.select("#DataSetSelect").node().value = Hash;
		d3.select("#DataSetSelect").each(DataSetChangeEvent);
	}
}

function DataSetPanelReset(Div,Visualization) {
	var Panel = MatchObjectInArray(PivotSettings.Panels,"name","DataSetPanel");
	var CurDataSet = Panel.Options.CurDataSet !== "" ? Panel.Options.CurDataSet : PivotSettings.DataSets[0].name;
	
	Div.append(CreateSelectElement).select("select").attr("id","DataSetSelect").on("change",DataSetChangeEvent);
	Div.select("#DataSetSelect")
		.selectAll("option")
		.data(PivotSettings.DataSets)
		.enter().append("option")
		.attr("value",function(d,i) {return d.name;})
		.text(function(d) {return d.name;})
		.each(function(d,i) { if (Panel.Options.CurDataSet == d.name) this.selected = true;});
	if (CurDataSet !== Panel.Options.CurDataSet) Div.select("#DataSetSelect").each(DataSetChangeEvent);
}

//This function is called when the user choose a new option in the DataSet drop down box
function DataSetChangeEvent() {
	var Panel = MatchObjectInArray(PivotSettings.Panels,"name","DataSetPanel");
	Panel.Options.CurDataSet = this.value;
	document.location.hash = PivotSettings.Panels.indexOf(GetPanel("DataSetPanel"))+"="+this.value;
	
	if (Panel.Options.CurDataSet === "Upload Data Set") {
		//Time to prompt the user to load a new file
		document.getElementById("FileSelectInput").click();
	}
	else {
		var DataSet = MatchObjectInArray(PivotSettings.DataSets,"name",this.value);
		d3.csv(DataSet.path+DataSet.file+".csv", function(d) {ProcessLoadedData(d,false);});
			
	}
}