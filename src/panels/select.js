/* globals SpadeSettings, d3, CreateDomElement, Redraw, Globals */

SpadeSettings.Panels.push({
		name:"SelectPanel",
		PanelDiv:"SelectDiv",
		Title: "Select",
		Functions: {
			ResetPanel:SelectPanelReset,							//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: SelectPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: SelectPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: SelectPanelValuesToHash,				//Return a hash value encoding current values of UI items

		}
	});
	
	
function SelectPanelReadSelectValues(RetVal) {
	d3.selectAll("#SelectContainerDiv div").each(function(d,i) {
		var SplitNum = this.id[5];
		var SplitAttr = d3.select(this).select("select").node().value;
		RetVal["SelectPanel"+SplitNum] = SplitAttr;
	});
	return RetVal;
}

function SelectPanelValuesToHash() {
	var CurHash = "";
	d3.selectAll("#SelectContainerDiv div").each(function(d,i) {
		var SplitNum = this.id[5];
		var SplitAttr = d3.select(this).select("select").node().value;
		CurHash += SplitNum + SplitAttr + ";";
	});
	return CurHash.slice(0,-1);
}
function SelectPanelUpdateFromHash(Hash) {
	var SelectPanels = Hash.split(";");
	for (var i in SelectPanels) {
		d3.select("#SelectPanel"+Hash.slice(0,1)+"Div").node().value = Hash.slice(1);
	}
}



function SelectPanelReset(Div,Visualization) {
	//Add: Clear existing content of panel
	//Add: Change header name if given
	
	var SelectContainerDiv = Div.append("div").attr("SelectContainerDiv");


	for (var i=0;i<Visualization.Panels.SelectPanel.Selects.length;i++) {
		/*jshint loopfunc:true */
		var CurSelect = Visualization.Panels.SelectPanel.Selects[i];
		var CurType = CurSelect.Type;
		var CurName = CurSelect.Name; 
		
		SelectContainerDiv.append(function() { return CreateDomElement("<div id='SelectPanel"+i+"Div'><span id='SelectPanel"+i+"Span'></span><span class='custom-dropdown custom-dropdown--small custom-dropdown--white'><select class='SplitAttributeSelect custom-dropdown__select custom-dropdown__select--white'></select></span></div>");});
		if (CurName !== undefined) SelectContainerDiv.select("#SelectPanel"+i+"Span").text(CurName+": ");
		
		
		SelectContainerDiv.selectAll("div select")
			.on("change",Redraw)
			.selectAll("option")
			.data(Object.keys(Globals.Catalog)
				.filter(function(d,i) { 
					if ( SpadeSettings.HiddenAttributes.FilterAttributeSelect.indexOf(d) != -1) return false;
					if (CurType !== undefined) return Globals.Catalog[d][CurType];
					else return true;
				}).sort())
			.enter().append("option")
			.attr("value",function(d,i) {return d;})
			.text(function(d) {return d;});
		
		//Add: Optionally, add a "none" option

	}
}
