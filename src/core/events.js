/* globals d3, window,Redraw,SetSelectValuesFromHash,Globals,SpadeSettings,CreateDomElement,CreateAdvancedOption,
   ReloadDataSet,ResetMainDivHeight,ReadSelectValues,VisualizationChangeHandlerNoRedraw */
function SetEventHandlers() {
	
	d3.select(window).on('resize', Redraw); 
	d3.select("#DataSetInfoCloseDiv").on("click",function() {d3.select("#DataSetInfoDiv").transition().style("opacity",0).remove();});
	window.onhashchange = function() {
		if (Globals.IgnoreHashChange) {
			Globals.IgnoreHashChange = false;
		}
		else {
			var OldVis = d3.select("#VisualizationType").node().value;
			var OldDataSet = d3.select("#DataSetSelect").node().value;
			SetSelectValuesFromHash();			//This will call VisChangeHandler if needed
			if (OldVis == d3.select("#VisualizationType").node().value && OldDataSet == d3.select("#DataSetSelect").node().value ) Redraw();
			Globals.IgnoreHashChange = false;
		}
	};
}
