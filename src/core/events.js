/* globals d3, window,Redraw,SetSelectValuesFromHash,Globals,SpadeSettings,CreateDomElement,CreateAdvancedOption,
   ReloadDataSet,ResetMainDivHeight,ReadSelectValues,VisualizationChangeHandlerNoRedraw,GetPanel,document */
function SetEventHandlers() {
	
	d3.select(window).on('resize', Redraw); 
	window.onhashchange = function() {
		if (Globals.IgnoreHashChange) {
			Globals.IgnoreHashChange = false;
		}
		else if (Globals.IgnoreHashChangeVisChanging) {
			Globals.IgnoreHashChangeVisChanging = false;
		}
		else {
			var OldVis = d3.select("#VisualizationType").node().value;
			SetSelectValuesFromHash();
			if (OldVis != d3.select("#VisualizationType").node().value) {
				d3.select("#VisualizationType").each(VisualizationChangeHandlerNoRedraw);
			}
			Redraw();
			Globals.IgnoreHashChange = false;
		}
	};
}

function ToggleHeaderRollup() {
	d3.select("#HeaderDiv").classed("HeaderOpen",function() {return !d3.select(this).classed("HeaderOpen");});
	d3.select("#HeaderDiv").classed("HeaderClosed",function() {return !d3.select(this).classed("HeaderClosed");});
	document.getElementById("HeaderDiv").scrollTop = 0;
	if (SpadeSettings.Visualizations[GetPanel("VisualizationPanel").Options.CurVisualization].Settings.RedrawOnVerticalResize !== false) {
		Redraw();
	}


}
