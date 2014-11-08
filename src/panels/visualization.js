/* globals SpadeSettings, d3, CreateDomElement, Redraw, Globals, CreateSelectElement,  MatchObjectInArray, CreateAdvancedOption,
	PopulateForm, document, ReadHashFromSelectValues, ParseHash */

SpadeSettings.Panels.push({
		name:"VisualizationPanel",
		PanelDiv:"VisualizationDiv",
		Title: "Visualization",
		Functions: {
			ResetPanel:VisualizationPanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: VisualizationPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: VisualizationPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: VisualizationPanelValuesToHash,				//Return a hash value encoding current values of UI items

		},
		Options: {
			CurVisualization: ParseHash()[SpadeSettings.Panels.length] === undefined ? 0 : ParseHash()[SpadeSettings.Panels.length]
		}
	});

function VisualizationPanelReadSelectValues() {
	return {VisualizationType: d3.select("#VisualizationType").node().value};
}

function VisualizationPanelValuesToHash() {
	return VisualizationPanelReadSelectValues().VisualizationType;
}

function VisualizationPanelUpdateFromHash(Hash) {
	//Remove these next two lines when coding cleanup is ... cleaned up?
	d3.select("#VisualizationType").node().value = Hash;
	var Panel = MatchObjectInArray(SpadeSettings.Panels,"name","VisualizationPanel");
	if (Panel.Options.CurVisualization != Hash) {
		d3.select("#VisualizationType").each(VisualizationChangeHandler);
	}
	Panel.Options.CurVisualization = Hash;
}

function VisualizationPanelReset(Div,Visualization) {
	var Panel = MatchObjectInArray(SpadeSettings.Panels,"name","VisualizationPanel");
	Div.append(CreateSelectElement).select("select").attr("id","VisualizationType").on("change",VisualizationChangeHandler);
	Div.select("#VisualizationType")
		.selectAll("option")
		.data(SpadeSettings.Visualizations)
		.enter().append("option")
		.attr("value",function(d,i) {return i;})
		.text(function(d) {return d.name;})
		.each(function(d,i) { if (Panel.Options.CurVisualization == i) this.selected = true;});
}


function VisualizationChangeHandler(d,i) {
	VisualizationChangeHandlerNoRedraw.apply(this,[d,i]);
	Redraw();
}

function VisualizationChangeHandlerNoRedraw(d,i) {
	var j;
	var Visualization = this.value;
	var VisOptionSetup = SpadeSettings.Visualizations[Visualization].AdvancedOptions;
	var VisInitFunc = SpadeSettings.Visualizations[Visualization].Functions.InitFunc;
	var VisName = SpadeSettings.Visualizations[Visualization].name.replace(/ /g,"");	//No spaces b/c will be used for DOM id
	var AdvancedOptionsDiv = d3.select("#VisualizationAdvancedOptions");
	var Panel = MatchObjectInArray(SpadeSettings.Panels,"name","VisualizationPanel");

	Globals.IgnoreHashChangeVisChanging = true;
	Globals.SuppressHistoryEntry = true;
	document.location.hash = ReadHashFromSelectValues(true);
	Panel.Options.CurVisualization = Visualization;
	
	PopulateForm();

	
	
	//Uninitialize the old Visualization
	if (Globals.PrevVisUnInitFunc !== undefined) Globals.PrevVisUnInitFunc();
	Globals.PrevVisUnInitFunc = SpadeSettings.Visualizations[Visualization].Functions.UnInitFunc;
	
	//Scroll MainDiv to top
	document.getElementById("MainDiv").scrollTop = 0;
	
	//Call Visualization Init
	if (VisInitFunc !== undefined) VisInitFunc();
	
	
}
