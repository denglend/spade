/* globals d3, Globals, PivotSettings,ParseHash,Redraw, console, AddNewFilterRowHandler, FilterAttributeSelectHandlerNoRedraw, 
	MatchObjectInArray */

function PopulateForm(container) {
	//Populate the Aggregator Types into the Aggregator Option
	var HeaderDiv = d3.select("#HeaderDiv");
	var CurHeaderDiv;
	var HashObj = ParseHash();
	HeaderDiv.selectAll("*").remove();
	
	for (var Panel in PivotSettings.Panels) {
		
		var CurVis = PivotSettings.Visualizations[MatchObjectInArray(PivotSettings.Panels,"name","VisualizationPanel").Options.CurVisualization];
		if (CurVis.Panels[PivotSettings.Panels[Panel].name] !== undefined) {
			PivotSettings.Panels[Panel].Active = true;
			CurHeaderDiv = HeaderDiv.append("div").attr("id",PivotSettings.Panels[Panel].PanelDiv);		//Create Div for this panel
			var PanelTitle = CurVis.Panels[PivotSettings.Panels[Panel].name].PanelName;
			if (PanelTitle === undefined) PanelTitle = PivotSettings.Panels[Panel].Title;
			CurHeaderDiv.append("h4").attr("class","PivotHeading").text(PanelTitle);					//Add the panel's title
			PivotSettings.Panels[Panel].Functions.ResetPanel(CurHeaderDiv,CurVis);						//Call the panel's Reset function
			if (HashObj[Panel] !== undefined) PivotSettings.Panels[Panel].Functions.UpdatePanelFromHash(HashObj[Panel]);	//Update panel's contents
		}
		else {
			PivotSettings.Panels[Panel].Active = false;
		}
	}
	//Call Visualization's init function
	var InitFunc = PivotSettings.Visualizations[MatchObjectInArray(PivotSettings.Panels,"name","VisualizationPanel").Options.CurVisualization].Functions.InitFunc;
	if (InitFunc !== undefined) InitFunc();
	}

function SetSelectValuesFromHash() {
	//Set the select values on the page based on the hash

	
	var HashObj = ParseHash();
	for (var i in HashObj) {
		if (PivotSettings.Panels[i].Active) {
			PivotSettings.Panels[i].Functions.UpdatePanelFromHash(HashObj[i]);	
		}
	}
	return;
}

function ReadSelectValues() {
	//Returns an object that holds the values of all the selects on the page
	

	var RetVal = {};
	for (var Panel in PivotSettings.Panels) {
		if (PivotSettings.Panels[Panel].Active) {
			var CurRetVal = PivotSettings.Panels[Panel].Functions.ReadSelectValues();
			for (var i in CurRetVal) RetVal[i] = CurRetVal[i];
		}
	}
	return RetVal;
}


var HashLookup = ["AggregatorAttribute","AggregatorType","VisualizationType","CompareFuncName","CompareValue","Attribute","DataSet","Split1Attribute","Split2Attribute","VertTileAttribute","HorizTileAttribute","Attributes"];

function ShortenSelectKey(key,arr) {
	if (arr === undefined) arr = HashLookup;
	return String.fromCharCode(97+arr.indexOf(key));
}
function LengthenSelectKey(key,arr) {
	if (arr === undefined) arr = HashLookup;
	return arr[key.charCodeAt(0)-97];
}

function ReadHashFromSelectValues(VisualizationChanging) {
	//Return the hash value based on the values of the current input elements on the page

	if (VisualizationChanging === undefined) VisualizationChanging = false;
	
	var CurHash = "";
	for (var i=0;i<PivotSettings.Panels.length;i++) {
		if (PivotSettings.Panels[i].Active) {
			CurHash += i+"="+PivotSettings.Panels[i].Functions.PanelValuesToHash(VisualizationChanging) + "&";
		}
	}
	CurHash = CurHash.slice(0,-1);
	return CurHash;
	
}
