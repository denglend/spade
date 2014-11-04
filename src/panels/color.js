/* globals PivotSettings, d3, CreateDomElement, Redraw, Globals, CreateSelectElement, document */

PivotSettings.Panels.push({
		name:"ColorPanel",
		PanelDiv:"ColorDiv",
		Title: "Colors",
		Functions: {
			ResetPanel:ColorPanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: ColorPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: ColorPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: ColorPanelValuesToHash,				//Return a hash value encoding current values of UI items

		}
	});

var ColorPanelSettings = {
	Opacity: ["Auto","100%","75%","50%","25%","10%"],
	Elements: ["ColorPanelColorScale","ColorPanelColorBy","ColorPanelOpacity"]
};

function ColorPanelReset(Div,Visualization) {
/* Potential options/elements for this div:
	ColorScale = selectbox with all the color scales loaded
	ColorBy = selectbox to select attribute to color
	Opacity = selectbox with opacity options
*/
	Div = Div.append("div").style("max-width","400px");
	var NewDiv;
	if (Visualization.Panels.ColorPanel.ColorScale !== undefined) {
		NewDiv = Div.append("div").attr("class","InlineOptionDiv");
		NewDiv.append("span").text("Color Scale:");
		NewDiv.append(CreateSelectElement)
			.select("select")
			.attr("id","ColorPanelColorScale")
			.on("change",Redraw)
			.selectAll("option")
			.data(PivotSettings.ColorScales)
			.enter().append("option")
			.attr("value",function(d,i) {return i;})
			.text(function(d) {return d.name;});

	}
	if (Visualization.Panels.ColorPanel.ColorBy !== undefined) {
		NewDiv = Div.append("div").attr("class","InlineOptionDiv");
		NewDiv.append("span").text("Color By:");
		NewDiv.append(CreateSelectElement)
		.select("select")
		.attr("id","ColorPanelColorBy")
		.on("change",Redraw)
		.selectAll("option")
		.data(Visualization.Panels.ColorPanel.ColorBy !== true ? Visualization.Panels.ColorPanel.ColorBy : Object.keys(Globals.Data[0] )
		.filter(function(el) {
			return PivotSettings.HiddenAttributes.FilterAttributeSelect.indexOf(el.toUpperCase()) == -1;
		}).sort())
		.enter().append("option")
		.attr("value",function(d,i) {return d;})
		.text(function(d) {return d;});
	}
	if (Visualization.Panels.ColorPanel.Opacity !== undefined) {
		var OpacityList = Visualization.Panels.ColorPanel.Opacity === true ? ColorPanelSettings.Opacity : Visualization.Panels.ColorPanel.Opacity;
		NewDiv = Div.append("div").attr("class","InlineOptionDiv");
		NewDiv.append("span").text("Opacity: ");
		NewDiv.append(CreateSelectElement)
		.select("select")
		.attr("id","ColorPanelOpacity")
		.on("change",Redraw)
		.selectAll("option")
		.data(OpacityList)
		.enter().append("option")
		.attr("value",function(d) { return d;})
		.text(function(d) { return d;});
	}

}



function ColorPanelReadSelectValues() {
	var RetVal = {};
	for (var i =0 ; i<ColorPanelSettings.Elements.length; i++) {
		var CurEl = document.getElementById(ColorPanelSettings.Elements[i]);
		if (CurEl !== null) RetVal[ColorPanelSettings.Elements[i]] = CurEl.value;
	}
	return RetVal;
}

function ColorPanelValuesToHash() {
	var CurHash = "";
	for (var i =0 ; i<ColorPanelSettings.Elements.length; i++) {
		var CurEl = document.getElementById(ColorPanelSettings.Elements[i]);
		if (CurEl !== null) CurHash += i + CurEl.value + ";";
	}
	return CurHash.slice(0,-1);
}

function ColorPanelUpdateFromHash(Hash) {
	var HashVals = Hash.split(";");
	for (var i in HashVals) {
		var CurNode = d3.select("#"+ColorPanelSettings.Elements[HashVals[i].slice(0,1)]).node();
		if (CurNode !== null) CurNode.value = HashVals[i].slice(1);
	}
}


