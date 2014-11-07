/* globals d3, window,Redraw,SetSelectValuesFromHash,Globals,PivotSettings,CreateDomElement,CreateAdvancedOption,
   ReloadDataSet,ResetMainDivHeight,ReadSelectValues,VisualizationChangeHandlerNoRedraw */
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

