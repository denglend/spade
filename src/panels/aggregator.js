/* globals d3, PivotSettings, Redraw, CreateSelectElement,Globals */
PivotSettings.Panels.push({
		name:"AggregatorPanel",
		PanelDiv:"AggregateDiv",
		Title: "Aggregator",
		Functions: {
			ResetPanel:AggregatorPanelReset,							//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: AggregatorPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: AggregatorPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: AggregatorPanelValuesToHash,				//Return a hash value encoding current values of UI items

		}
	});



function AggregatorPanelReset(Div,Visualization) {
	var TypeElement = Div.append(CreateSelectElement).select("select").attr("id","AggregatorType").on("change",Redraw);
	Div.append(CreateSelectElement).select("select").attr("id","AggregatorAttribute").on("change",Redraw)
		.selectAll("option")
		.data(Object.keys(Globals.Data[0])
		.filter(function(el) { 
			return PivotSettings.HiddenAttributes.DisplayAttribute.indexOf(el.toUpperCase()) == -1;
		}).sort())
		.enter().append("option")
		.attr("value",function(d,i) {return d;})
		.text(function(d) {return d;});
	
	TypeElement.selectAll("option")
		.data(PivotSettings.Aggregators)
		.enter().append("option")
		.attr("value",function(d,i) {return i;})
		.text(function(d) {return d.name;});
	
	if (Visualization.Panels.AggregatorPanel.Aggregators === undefined) {
		TypeElement.selectAll("option").style("display","block");			//Display all aggregator types
	}
	else {
		TypeElement.selectAll(" option")
		.filter(function(d,i) { return Visualization.Panels.AggregatorPanel.Aggregators.indexOf(d.shortname) == -1;})
		.style("display","none");													//Hide aggregator types not requested by vis settings

		var CurAggregatorName = PivotSettings.Aggregators[d3.select("#AggregatorType").node().selectedIndex].shortname;
		if (Visualization.Panels.AggregatorPanel.Aggregators.indexOf(CurAggregatorName) == -1 ) d3.select("#AggregatorType").node().selectedIndex = 1;
	}
}

function AggregatorPanelReadSelectValues() {
	var RetVal = {};
	RetVal.AggregatorAttribute =   d3.select("#AggregatorAttribute").node().value;
	RetVal.AggregatorType =  d3.select("#AggregatorType").node().value;
	return RetVal;
}

function AggregatorPanelValuesToHash() {
	var AggregatorSelectVals = AggregatorPanelReadSelectValues();
	return AggregatorSelectVals.AggregatorAttribute +";" + AggregatorSelectVals.AggregatorType;
}

function AggregatorPanelUpdateFromHash(Hash) {
	var AggregatorVals = Hash.split(";");
	d3.select("#AggregatorAttribute").node().value = AggregatorVals[0];
	d3.select("#AggregatorType").node().value = AggregatorVals[1];
}

