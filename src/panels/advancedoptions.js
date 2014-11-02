/* globals PivotSettings, CreateSelectElement, Globals, Redraw,d3, MatchObjectInArray, ResetMainDivHeight  */

PivotSettings.Panels.push({
		name:"AdvancedOptionsPanel",
		PanelDiv:"AdvancedOptionsDiv",
		Title: "Advanced Options",
		Functions: {
			ResetPanel:AdvancedOptionsPanelReset,							//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: AdvancedOptionsPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: AdvancedOptionsPanelUpdateFromHash,		//Set panel UI items based on passed hash value
			PanelValuesToHash: AdvancedOptionsPanelValuesToHash,			//Return a hash value encoding current values of UI items
			
		}
	});




function AdvancedOptionsPanelReadSelectValues() {
	var RetVal = {
		HorizTileAttribute: d3.select("#HorizTileGroup select").node().value,
		VertTileAttribute: d3.select("#VertTileGroup select").node().value
	};
	RetVal.VisAdvancedOptions = {};
	d3.selectAll("#VisualizationAdvancedOptions select,#VisualizationAdvancedOptions input[type='text']").each(function(d,i) {
		RetVal.VisAdvancedOptions[d3.select(this).attr("id")] = this.value;
	});
	d3.selectAll("#VisualizationAdvancedOptions input[type='checkbox']").each(function(d,i) {
		RetVal.VisAdvancedOptions[d3.select(this).attr("id")] = d3.select(this).property("checked");
	});
	return RetVal;
}

function AdvancedOptionsPanelValuesToHash(VisualizationChanging) {
	
	var CurVis = MatchObjectInArray(PivotSettings.Visualizations,"name",MatchObjectInArray(PivotSettings.Panels,"name","VisualizationPanel").Options.CurVisualization);
	var CurHash = "";
	CurHash += d3.select("#HorizTileGroup select").node().value + ";";
	CurHash += d3.select("#VertTileGroup select").node().value  + ";";
	if (VisualizationChanging) return CurHash;			//If Vis is changing, we need to not keep the old vis's Advanced Options
	for (var i = 0; i<CurVis.AdvancedOptions.length; i++) {
		var CurAdvancedOption = CurVis.AdvancedOptions[i];
		var CurAdvancedOptionType = CurAdvancedOption.type;
		var CurAdvancedOptionSelector = "#" + CurVis.name.replace(/ /g,"") + CurAdvancedOption.id;
		if (CurAdvancedOptionType == "Select") CurHash += d3.select(CurAdvancedOptionSelector).node().value + ",";
		else if (CurAdvancedOptionType == "Check") CurHash += d3.select(CurAdvancedOptionSelector).node().checked + ",";
		
	}
	return CurHash.slice(0,-1);

}


function AdvancedOptionsPanelUpdateFromHash(Hash) {
	//Testing ... Call Reset again in case Visualization is not the same as when Reset was originally called
	//d3.selectAll("#AdvancedOptionsDiv div").remove();
	
	var CurVis = MatchObjectInArray(PivotSettings.Visualizations,"name",MatchObjectInArray(PivotSettings.Panels,"name","VisualizationPanel").Options.CurVisualization);
	//AdvancedOptionsPanelReset(d3.select("#AdvancedOptionsDiv"),CurVis);
	var Options = Hash.split(";");
	d3.select("#HorizTileGroup select").node().value = Options[0];
	d3.select("#VertTileGroup select").node().value = Options[1];
	if (Options[2] !== "") {						//If there are no vis options present (e.g. b/c vis just changed), don't try to set any
		Options = Options[2].split(",");
		for (var i = 0; i<Options.length; i++) {
			var CurAdvancedOption = CurVis.AdvancedOptions[i];
			var CurAdvancedOptionType = CurAdvancedOption.type;
			var CurAdvancedOptionSelector = "#" + CurVis.name.replace(/ /g,"") + CurAdvancedOption.id;
			if (CurAdvancedOptionType == "Select") d3.select(CurAdvancedOptionSelector).node().value = Options[i];
			else if (CurAdvancedOptionType == "Check") d3.select(CurAdvancedOptionSelector).node().checked = (Options[i] == "true");

		}
		
	}
}




function AdvancedOptionsPanelReset(Div,Visualization) {
	Div.selectAll("*").remove();
	var HeadingDiv = Div.append("div").attr("id","AdvancedOptionsHeadingDiv");
	HeadingDiv.append("div").attr("class","Collapseable ArrowRight");
	HeadingDiv.append("div").style("float","left").append("h4").attr("id","AdvancedOptionsHeading").attr("class","PivotHeading").text("Advanced Options").on("click",AdvancedOptionsPanelToggleHandler);
	var AdvancedOptionsDiv1 = Div.append("div").attr("id","AdvancedOptions").attr("class","hidden AdvancedOpt");
	AdvancedOptionsDiv1.append("span").attr("class","PivotSubHeading").text("Visualization Options");
	AdvancedOptionsDiv1.append("div").attr("id","VisualizationAdvancedOptions");
	var AdvancedOptionsDiv2 = Div.append("div").attr("id","AdvancedOptionsPart2").attr("class","hidden AdvancedOpt");
	AdvancedOptionsDiv2.append("span").attr("class","PivotSubHeading").text("Other Options");
	var AdvOptTable = AdvancedOptionsDiv2.append("table");
	var TileTableVals = [["&#8596;","Horiz"],["&#8597;","Vert"]];
	for (var i=0; i < TileTableVals.length; i++) {
		var AdvOptTableTR = AdvOptTable.append("tr").attr("class","hidden AdvancedOpt");
		AdvOptTableTR.append("td").append("span").attr("class","SplitName").html("Tile ("+TileTableVals[i][0]+"): ");
		AdvOptTableTR.append("td").append("div").attr("id",TileTableVals[i][1]+"TileGroup").attr("class","SplitGroup").append(CreateSelectElement);
		AdvOptTableTR.select("select").classed("SplitAttributeSelect",true).on("change",Redraw);
	}
	Div.selectAll(".SplitAttributeSelect")
		.selectAll("option")
		.data(["(no split)"].concat(Object.keys(Globals.Data[0]))
		.filter(function(el) { 
			return PivotSettings.HiddenAttributes.FilterAttributeSelect.indexOf(el.toUpperCase()) == -1;
		}).sort())
		.enter().append("option")
		.attr("value",function(d,i) {return d;})
		.text(function(d) {return d;});

	var VisName = Visualization.name.replace(/ /g,"");	//No spaces b/c will be used for DOM id
	//Create Advanced Options for current Visualization
	for (var j in Visualization.AdvancedOptions) {
		AdvancedOptionsPanelCreateOption(d3.select("#VisualizationAdvancedOptions"),Visualization.AdvancedOptions[j],VisName);
	}
}

function AdvancedOptionsPanelToggleHandler(d,i) {
	var WasHidden = d3.select("#AdvancedOptions").classed("hidden");
	if (WasHidden) {
		d3.selectAll(".AdvancedOpt").classed("hidden",false);
		d3.select(".ArrowRight").classed("ArrowDown",true);
		d3.select(".ArrowRight").classed("ArrowRight",false);
	}
	else {
		d3.selectAll(".AdvancedOpt").classed("hidden",true);
		d3.select(".ArrowDown").classed("ArrowRight",true);
		d3.select(".ArrowDown").classed("ArrowDown",false);
	}
	if (MatchObjectInArray(PivotSettings.Visualizations,"name",MatchObjectInArray(PivotSettings.Panels,"name","VisualizationPanel").Options.CurVisualization).Settings.RedrawOnVerticalResize !== false) {
		Redraw();
	}
	else {
		ResetMainDivHeight();
	}
}


function AdvancedOptionsPanelCreateOption(Container,OptionObj,Prefix) {
	//Creates an advanced option in d3 Container object given OptionObj like: 
	// {type:"Select",id:"NumberFormat",vals:["Number","Percentage"]},
	
	if (Prefix === undefined) Prefix = "";
	Container = Container.append("div");
	if (OptionObj.title !== undefined) {
		Container.append("span").text(OptionObj.title);
	}
	
	if (OptionObj.type == "Select") {

		var Span = Container.append("span")
			.classed("custom-dropdown",true)
			.classed("custom-dropdown--small",true)
			.classed("custom-dropdown--white",true);
		var Select = Span.append("select")
			.classed("custom-dropdown__select",true)
			.classed("custom-dropdown__select--white",true)
			.attr("id",Prefix+OptionObj.id)
			.on("change",Redraw);
		Select.selectAll("option")
			.data(OptionObj.vals)
			.enter()
			.append("option")
			.attr("value",function(d,i) {return d;})
			.text(function(d) {return d;});
	}
	if (OptionObj.type == "Check") {
		Container.append("input")
			.attr("type","checkbox")
			.attr("id",Prefix+OptionObj.id)
			.property("checked",OptionObj.checked)
			.on("change",Redraw);	
	}
	if (OptionObj.type == "Text") {
		Container.append("input")
			.attr("type","text")
			.attr("size",6)
			.attr("id",Prefix+OptionObj.id)
			.on("change",Redraw);
	}
	if (OptionObj.type == "Button") {
		Container.append("button")
			.attr("id",Prefix+OptionObj.id)
			.text(OptionObj.text)
			.on("click",OptionObj.func);
	}
}
