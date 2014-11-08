/* globals d3,SpadeSettings,document,Redraw,GetPanel, ReadHashFromSelectValues, Globals */

SpadeSettings.Panels.push({
		name:"RollupPanel",
		PanelDiv:"RollupPanelDiv",
		Title: "",
		Functions: {
			ResetPanel:RollupPanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: RollupPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: RollupPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: RollupPanelValuesToHash,				//Return a hash value encoding current values of UI items
		},
		Options: {
			force: true
		}
	});

function RollupPanelReadSelectValues() {
	return {Rollup: d3.select("#HeaderDiv").classed("HeaderClosed")};
}

function RollupPanelValuesToHash() {
	return d3.select("#HeaderDiv").classed("HeaderClosed");
}

function RollupPanelUpdateFromHash(Hash) {
	d3.select("#HeaderDiv").classed("HeaderClosed",Hash=="true");
	d3.select("#HeaderDiv").classed("HeaderOpen",Hash!="true");
}

function RollupPanelReset(Div,Visualization) {
	Div.selectAll("*").remove();
	Div.on("click",RollupPanelClickHandler);
	if (!d3.select("#HeaderDiv").classed("HeaderOpen") && !d3.select("#HeaderDiv").classed("HeaderClosed")) {
		d3.select("#HeaderDiv").classed("HeaderOpen",true);
	}
}


function RollupPanelClickHandler() {
	d3.select("#HeaderDiv").classed("HeaderOpen",function() {return !d3.select(this).classed("HeaderOpen");});
	d3.select("#HeaderDiv").classed("HeaderClosed",function() {return !d3.select(this).classed("HeaderClosed");});
	document.getElementById("HeaderDiv").scrollTop = 0;
	if (SpadeSettings.Visualizations[GetPanel("VisualizationPanel").Options.CurVisualization].Settings.RedrawOnVerticalResize !== false) {
		Redraw();
	}
	else {
		Globals.IgnoreHashChange = true;
		document.location.hash = ReadHashFromSelectValues();
	}

}
