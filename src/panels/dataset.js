/* globals SpadeSettings, d3, CreateDomElement, Redraw, Globals, CreateSelectElement, document, ProcessLoadedData, MatchObjectInArray,
	ReadHashFromSelectValues, GetPanel, ParseHash, LoadingModal, window */

SpadeSettings.Panels.push({
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
	if (Hash !== MatchObjectInArray(SpadeSettings.Panels,"name","DataSetPanel").Options.CurDataSet) {
		d3.select("#DataSetSelect").each(DataSetChangeEvent);
	}
}

function DataSetPanelReset(Div,Visualization) {
	var Panel = MatchObjectInArray(SpadeSettings.Panels,"name","DataSetPanel");
	var CurDataSet = Panel.Options.CurDataSet !== "" ? Panel.Options.CurDataSet : SpadeSettings.DataSets[0].name;
	
	Div.append(CreateSelectElement).select("select").attr("id","DataSetSelect").on("change",DataSetChangeEvent);
	Div.select("#DataSetSelect")
		.selectAll("option")
		.data(SpadeSettings.DataSets)
		.enter().append("option")
		.attr("value",function(d,i) {return d.name;})
		.text(function(d) {return d.name;})
		.each(function(d,i) { if (Panel.Options.CurDataSet == d.name) this.selected = true;});
}

//This function is called when the user choose a new option in the DataSet drop down box
function DataSetChangeEvent() {
	var Panel = GetPanel("DataSetPanel");
	
	if (Panel.Options.CurDataSet !== "" ) {	// Don't mess with the hash if this is during startup
		Globals.IgnoreHashChange = true;
		var CurHashVal = MatchObjectInArray(SpadeSettings.DataSets,"name",this.value).defaulthash;
		if (CurHashVal === undefined) {
			CurHashVal = SpadeSettings.Panels.indexOf(GetPanel("DataSetPanel"))+"="+this.value;
		}
		else {
			//These next couple of lines are a big hack and need to be rewritten
			SpadeSettings.Panels.forEach(function(d) {d.Active = false;});	//Should this move out of the if block?  Necessary at all?
			document.location.hash = CurHashVal;
			var VisIndex = SpadeSettings.Panels.indexOf(GetPanel("VisualizationPanel"));
			GetPanel("VisualizationPanel").Options.CurVisualization = ParseHash()[VisIndex] === undefined ? 0 : ParseHash()[VisIndex];

		}
	}
	else if (MatchObjectInArray(SpadeSettings.DataSets,"name",this.value).defaulthash !== undefined) {
		document.location.hash = MatchObjectInArray(SpadeSettings.DataSets,"name",this.value).defaulthash;
		Globals.IgnoreHashChange = true;
	}
	Panel.Options.CurDataSet = this.value;
	if (Panel.Options.CurDataSet === "Upload Data Set") {
		//Time to prompt the user to load a new file
		document.getElementById("FileSelectInput").click();
	}
	else {
		var DataSet = MatchObjectInArray(SpadeSettings.DataSets,"name",this.value);
		var DownloadingModal = LoadingModal("Downloading...");
		d3.csv(DataSet.path+DataSet.file+".csv", function(d) {
			DownloadingModal.close();
			var ProcessingModel = LoadingModal("Processing...");
			window.setTimeout(function() {ProcessLoadedData(d,CurHashVal);ProcessingModel.close();},10);

		});
			
	}
}
