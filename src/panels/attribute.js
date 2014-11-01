/* globals PivotSettings,Globals, d3, Redraw */
PivotSettings.Panels.push({
		name:"AttributePanel",
		PanelDiv:"AttributeDiv",
		Title: "Attributes",
		Functions: {
			ResetPanel:AttributePanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: AttributePanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: AttributePanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: AttributePanelValuesToHash,				//Return a hash value encoding current values of UI items
		}
	});
	
	

function AttributePanelReadSelectValues() {
	var RetVal = {};
	var Attributes = ""; var AttrPrefix = "";
	for (var i in Globals.CurAttributes) {			//CHANGE TO A VARIABLE IN ATTRIBUTE PANEL'S OBJECT
		/*jshint loopfunc: true */
		Attributes += AttrPrefix + d3.selectAll(".AttributeSpan")[0].map(function(el) {return el.innerHTML;}).indexOf(Globals.CurAttributes[i]);
		AttrPrefix = ",";
	}
	RetVal.AttributeList =  Attributes;
	return RetVal;
}

function AttributePanelValuesToHash() {
	return AttributePanelReadSelectValues().AttributeList;
}

function AttributePanelUpdateFromHash(Hash) {
	Globals.CurAttributes = [];						//CHANGE TO A VARIABLE IN ATTRIBUTE PANEL'S OBJECT
	d3.selectAll(".AttributeSpan").classed("AttributeSelected",false).classed("AttributeNotSelected",true);
	if (Hash !== "" && d3.selectAll(".AttributeSpan")[0].length !==0) {
		for (var j in Hash.split(",")) {
			var CurAttr = Hash.split(",")[j];
			d3.select(d3.selectAll(".AttributeSpan")[0][CurAttr]).classed("AttributeSelected",true);
			d3.select(d3.selectAll(".AttributeSpan")[0][CurAttr]).classed("AttributeNotSelected",false);
			Globals.CurAttributes.push(d3.selectAll(".AttributeSpan")[0][CurAttr].textContent);
		}			
	}
		
}


function AttributePanelToggleEvent(d,i) {
	if (d3.select(this).classed("AttributeNotSelected")) {
		d3.select(this).classed("AttributeNotSelected",false);
		d3.select(this).classed("AttributeSelected",true);
		Globals.CurAttributes.push(this.textContent);
	}
	else {
		d3.select(this).classed("AttributeNotSelected",true);
		d3.select(this).classed("AttributeSelected",false);
		Globals.CurAttributes.splice(Globals.CurAttributes.indexOf(this.textContent),1);		//CHANGE TO PANEL VARIABLE
	}
	Redraw();
}

function AttributePanelReset(Div,Visualization) {
	
	Div.append("div")
		.attr("id","AttributeContainerDiv")
		.selectAll("span")
		.data(Object.keys(Globals.Data[0]).filter(function(el) {
			return PivotSettings.HiddenAttributes.DisplayAttribute.indexOf(el.toUpperCase()) == -1;
		}).sort())
		.enter()
		.append("span")
		.attr("class","AttributeSpan AttributeNotSelected")
		.text(function(d,i) {return d;})
		.on("click",AttributePanelToggleEvent);
}