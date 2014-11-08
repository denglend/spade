/* globals d3, Globals, SpadeSettings,ParseHash,Redraw, console, AddNewFilterRowHandler, FilterAttributeSelectHandlerNoRedraw,
	MatchObjectInArray, ToggleHeaderRollup */

function PopulateForm(container) {
	//Populate the Aggregator Types into the Aggregator Option
	var HeaderDiv = d3.select("#HeaderDiv");
	var CurHeaderDiv;
	var HashObj = ParseHash();
	HeaderDiv.selectAll("*").remove();
	
	for (var Panel in SpadeSettings.Panels) {
		
		var CurVis = SpadeSettings.Visualizations[MatchObjectInArray(SpadeSettings.Panels,"name","VisualizationPanel").Options.CurVisualization];
		var ForcePanel = SpadeSettings.Panels[Panel].Options !== undefined ? SpadeSettings.Panels[Panel].Options.force : false;
		if (CurVis.Panels[SpadeSettings.Panels[Panel].name] !== undefined || ForcePanel) {
			SpadeSettings.Panels[Panel].Active = true;
			CurHeaderDiv = HeaderDiv.append("div").attr("id",SpadeSettings.Panels[Panel].PanelDiv);		//Create Div for this panel
			var PanelTitle = CurVis.Panels[SpadeSettings.Panels[Panel].name] !== undefined ? CurVis.Panels[SpadeSettings.Panels[Panel].name].PanelName : undefined;
			if (PanelTitle === undefined) PanelTitle = SpadeSettings.Panels[Panel].Title;
			CurHeaderDiv.append("h4").attr("class","PivotHeading").text(PanelTitle);					//Add the panel's title
			SpadeSettings.Panels[Panel].Functions.ResetPanel(CurHeaderDiv,CurVis);						//Call the panel's Reset function
			if (HashObj[Panel] !== undefined) SpadeSettings.Panels[Panel].Functions.UpdatePanelFromHash(HashObj[Panel]);	//Update panel's contents
		}
		else {
			SpadeSettings.Panels[Panel].Active = false;
		}
	}
	//Call Visualization's init function
	var InitFunc = SpadeSettings.Visualizations[MatchObjectInArray(SpadeSettings.Panels,"name","VisualizationPanel").Options.CurVisualization].Functions.InitFunc;
	if (InitFunc !== undefined) InitFunc();
}

function SetSelectValuesFromHash() {
	//Set the select values on the page based on the hash

	
	var HashObj = ParseHash();
	for (var i in HashObj) {
		if (SpadeSettings.Panels[i] !== undefined && SpadeSettings.Panels[i].Active) {
			SpadeSettings.Panels[i].Functions.UpdatePanelFromHash(HashObj[i]);
		}
	}
	return;
}

function ReadSelectValues() {
	//Returns an object that holds the values of all the selects on the page
	

	var RetVal = {};
	for (var Panel in SpadeSettings.Panels) {
		if (SpadeSettings.Panels[Panel].Active) {
			var CurRetVal = SpadeSettings.Panels[Panel].Functions.ReadSelectValues();
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
	for (var i=0;i<SpadeSettings.Panels.length;i++) {
		if (SpadeSettings.Panels[i].Active) {
			CurHash += i+"="+SpadeSettings.Panels[i].Functions.PanelValuesToHash(VisualizationChanging) + "&";
		}
	}
	CurHash = CurHash.slice(0,-1);
	return CurHash;
	
}
