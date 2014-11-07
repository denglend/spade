/* globals SpadeSettings, d3, CreateDomElement, Redraw, Globals, CreateSelectElement, document, console, colorbrewer */

SpadeSettings.Panels.push({
		name:"ColorPanel",
		PanelDiv:"ColorDiv",
		Title: "Colors",
		Functions: {
			ResetPanel:ColorPanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: ColorPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: ColorPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: ColorPanelValuesToHash,				//Return a hash value encoding current values of UI items
			AddData: ColorPanelAddData,
			DataInit: ColorPanelDataInit,
			GetBackgroundColor: ColorPanelBackground,
			GetTextColor: ColorPanelText,
			GenerateQizer: GenerateQizer
		}
	});

var ColorPanelSettings = {
	Opacity: ["Auto","100%","75%","50%","25%","10%"],
	Elements: ["ColorPanelColorScale","ColorPanelColorBy","ColorPanelOpacity"/*,"ColorPanelTile"*/],
	Qizer: null,
	CurDiv: null,
	DataList: []
};

/* Vis will:
	1) Call DataInit at the start of its draw function
	2) Call AddData for each data point to add
	3) Call GetbackGroundColor as desired
	4) Call GetTextColor as desired
	5) Call GetLegend [once created] as desired
*/

function ColorPanelDataInit() {
	ColorPanelSettings.Qizer = null;
	ColorPanelSettings.CurDiv = null;
		ColorPanelSettings.DataList = [];

}

function ColorPanelAddData(DataVal,Div) {
	if (/*document.getElementById("ColorPanelTile").value == 1 && */ Div !== ColorPanelSettings.CurDiv) {
		ColorPanelSettings.CurDiv = Div;
		ColorPanelSettings.DataList = [];
		ColorPanelSettings.Qizer = null;
	}
	DataVal = isNaN(DataVal) ? DataVal : +DataVal;		//String -> number if appropriate
	ColorPanelSettings.DataList.push(DataVal);
}

function ColorPanelBackground(Value) {
	var ScaleElement = document.getElementById("ColorPanelColorScale");
	if (ColorPanelSettings.Qizer === null) {
		ColorPanelSettings.Qizer = GenerateQizer(ColorPanelSettings.DataList);
	}
	if (ScaleElement !== null) {
		var Scale = SpadeSettings.ColorScales[ScaleElement.value].js;
		var Level = ColorPanelSettings.Qizer(Value);
		return colorbrewer[Scale][SpadeSettings.NumberOfShades][Level];
	}
	else {
		console.error("ColorPanelBackground called when ColorScale select has not been created");
		return "#FFFFFF";
	}
}

function ColorPanelText(Value) {
	var BGColor = d3.rgb(ColorPanelBackground(Value));
	if (Math.sqrt(0.241*BGColor.r*BGColor.r + 0.691*BGColor.g*BGColor.g + 0.068*BGColor.b*BGColor.b ) < 130) {
		return "#FFFFFF";
	}
	else return "#000000";
}

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
			.data(SpadeSettings.ColorScales)
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
			return SpadeSettings.HiddenAttributes.FilterAttributeSelect.indexOf(el.toUpperCase()) == -1;
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

	/*Div.append("div").attr("class","InlineOptionDiv")
		.append(CreateSelectElement)
		.select("select")
		.attr("id","ColorPanelTile")
		.on("change",Redraw)
		.selectAll("option")
		.data([{val:0,name:"Don't Reset"},{val:1,name:"Reset Colors / Tile"}])
		.enter().append("option")
		.attr("value",function(d) {return d.val;})
		.text(function(d) {return d.name;}); */
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




function GenerateQizer(ValueArray) {
//Pass it an array containing all the values that will be colored
//returned a Qizing function as a convenience for visualizations that want to color with color scales
//Uses Quantize if all numerical values, otherwise thresholds

	var domain,range;
	var UniqueValues = d3.set(ValueArray).values().map(function(d) { if (isNaN(d)) return d; return +d;});
	var AllNumbers = ValueArray.filter(function(d) {return isNaN(d);}).length === 0;
	ValueArray = ValueArray.map(function(d) {return isNaN(d) ? d : +d;});


	if (AllNumbers && UniqueValues.length > SpadeSettings.NumberOfShades) {
		//For continuous data, use quantize
		ValueArray.sort(d3.ascending);
		if (ValueArray[0] == ValueArray[ValueArray.length-1]) return function(a) {return 0;};		//If all #s are the same in list, always return 0
		else return d3.scale.quantize().domain(ValueArray).range(d3.range(SpadeSettings.NumberOfShades));
	}
	else {
		//For string data, or when there are fewer than NumberOfShades unique values, just use a simple mapping
		//domain = ValueArray.filter(function(value, index, self) { return self.indexOf(value) === index;}).sort(d3.ascending);
		domain = UniqueValues.sort(d3.ascending);
		if (UniqueValues.length <= SpadeSettings.NumberOfShades) {
			range = UniqueValues.map(function(el, i) {
				return Math.round(i*SpadeSettings.NumberOfShades/UniqueValues.length);
			});
		}
		else {
			range = d3.range(UniqueValues.length);
		}
		var	QizerObj = function(input) {
			if (input ===undefined) return QizerObj;
			return isNaN(input) ?
				QizerObj.rangevals[QizerObj.domvals.indexOf(input)] % SpadeSettings.NumberOfShades :
				QizerObj.rangevals[QizerObj.domvals.indexOf(+input)];
		};
		QizerObj.domain = function(setvals) {
			if (setvals ===undefined) return QizerObj.domvals;
			QizerObj.domvals = setvals;
			return QizerObj;
		};
		QizerObj.range = function(setvals) {
			if (setvals === undefined) return QizerObj.rangevals;
			QizerObj.rangevals = setvals;
			return QizerObj;
		};
		QizerObj.dontquantize = true;
		return  QizerObj.domain(domain).range(range);
	}
}
