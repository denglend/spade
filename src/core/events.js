/* globals d3, window,Redraw,SetSelectValuesFromHash,Globals,SpadeSettings,CreateDomElement,CreateAdvancedOption,
   ReloadDataSet,ResetMainDivHeight,ReadSelectValues,VisualizationChangeHandlerNoRedraw */
function SetEventHandlers() {
	
	d3.select(window).on('resize', Redraw); 
	window.onhashchange = function() {
		if (Globals.IgnoreHashChange) {
			Globals.IgnoreHashChange = false;
		}
		else {
			var OldVis = d3.select("#VisualizationType").node().value;
			SetSelectValuesFromHash();			//This will call VisChangeHandler if needed
			if (OldVis == d3.select("#VisualizationType").node().value) Redraw();
			Globals.IgnoreHashChange = false;
		}
	};
}
