/* globals SpadeSettings,d3, Globals, CreateSelectElement, Redraw */

SpadeSettings.Panels.push({
		name:"FilterPanel",
		PanelDiv:"FiltersDiv",
		Title: "Filters",
		Functions: {
			ResetPanel:FilterPanelReset,							//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: FilterPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: FilterPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: FilterPanelValuesToHash,				//Return a hash value encoding current values of UI items
		},
		Options: {
			CurNumFilters: 1
		}
	});
	

function FilterPanelReset(Div,Visualization) {
	var FilterGroupsDiv = Div.append("div").attr("id","PivotFilterGroups");
	FilterPanelAppendNewGroup(FilterGroupsDiv,0);
}


function FilterPanelReadSelectValues() {
	var RetVal = {Filters:[]};
	d3.selectAll(".PivotFilterGroup").each(function(d,i) { 
		var TempFilter = {};
		TempFilter.Attribute = d3.select(this).selectAll(".FilterAttribute").node().value;
		TempFilter.CompareValue = d3.select(this).selectAll(".FilterCompareValue").node().value;
		if (Globals.Catalog[TempFilter.Attribute].Date && TempFilter.CompareValue !== "(any)") {
			TempFilter.CompareValue = new Date(TempFilter.CompareValue);	//Store dates as Date so will compare correctly
		}
		TempFilter.CompareFuncName = d3.select(this).selectAll(".FilterCompareType").node().value;
		if (TempFilter.CompareValue != "(any)") {
			TempFilter.CompareFunc = SpadeSettings.Comparators[d3.select(this).selectAll(".FilterCompareType").node().value].func(TempFilter.CompareValue);
		}
		else {
			TempFilter.CompareFunc = function(a) {return true;};
		}
		
		RetVal.Filters.push(TempFilter);								 
	});
	return RetVal;
}

function FilterPanelValuesToHash() {
	var FilterVals = FilterPanelReadSelectValues();
	var CurHash = "";
	var HashVals = ["Attribute","CompareValue","CompareFuncName"];
	for (var i =0;i<FilterVals.Filters.length;i++) {
		for (var j=0;j<HashVals.length;j++) {
			CurHash += j+FilterVals.Filters[i][HashVals[j]]+",";
		}
		CurHash = CurHash.slice(0,-1)+";";
	}
	return CurHash.slice(0,-1);
}

function FilterPanelUpdateFromHash(Hash) {
	var HashVals = [".FilterAttribute",".FilterCompareValue",".FilterCompareType"];
	var FilterGroups = Hash.split(";");
	var FilterGroupsDiv = d3.select("#PivotFilterGroups");
	FilterGroupsDiv.selectAll("*").remove();
	for (var i = 0;i<FilterGroups.length;i++) {
		var CurFilterGroup = FilterPanelAppendNewGroup(FilterGroupsDiv,i);
		var FilterVals = FilterGroups[i].split(",");
		for (var j =0 ; j < HashVals.length ;j++) {
			CurFilterGroup.select(HashVals[j]).node().value = FilterVals[j].slice(1);
			if (HashVals[j] == ".FilterAttribute") CurFilterGroup.select(".FilterAttribute").each(FilterPanelAttrChangeNoRedraw);
		}
		
	}
}



// ***************** UTIL *********************
function FilterPanelAppendNewGroup(Div,GroupNumber) {
	var FilterGroup = Div.append("div").attr("id","FilterGroup"+GroupNumber).attr("class","PivotFilterGroup");
	var FilterAttr = FilterGroup.append(CreateSelectElement).select("select").classed("FilterAttribute",true).on("change",FilterPanelAttrChange);
	var FilterType = FilterGroup.append(CreateSelectElement).select("select").classed("FilterCompareType",true).on("change",Redraw);
	var FilterValue = FilterGroup.append(CreateSelectElement).select("select").classed("FilterCompareValue",true).on("change",Redraw);
	if (GroupNumber === 0) {
		FilterGroup.append("span").attr("class","NewFilterPlus").text("+").on("click",FilterPanelNewRow);
	}
	else {
		FilterGroup.append("span").attr("class","NewFilterMinus").text("-").on("click",FilterPanelRemoveRow);
	}
	
	FilterAttr.selectAll("option")
		.data(Object.keys(Globals.Data[0])
		.filter(function(el) { 
			return SpadeSettings.HiddenAttributes.FilterAttributeSelect.indexOf(el.toUpperCase()) == -1;
		}).sort())
		.enter().append("option")
		.attr("value",function(d,i) {return d;})
		.text(function(d) {return d;});
	FilterType.selectAll("option")
		.data(SpadeSettings.Comparators)
		.enter().append("option")
		.attr("value",function(d,i) {return i;})
		.text(function(d) {return d.name;});
	FilterPanelAttrChangeNoRedraw.call(FilterAttr.node());
	return FilterGroup;
}



// ***************** EVENTS *********************

function FilterPanelAttrChange(d,i) {
	//When the filter attribute changes, load the unique values in to the Value filter
	FilterPanelAttrChangeNoRedraw.call(this,d,i);
	Redraw();
}

function FilterPanelAttrChangeNoRedraw(d,i) {
	var Attribute = this.value;
	var CompVals = d3.set(Globals.Data.map(function(d) {return d[Attribute];})).values();
	CompVals = d3.merge([["(any)"],CompVals]);
	var JoinSet = d3.select(this.parentElement.parentElement.children[2].children[0])		//This cannot be the simplest way to do this...
		.selectAll("option")
		.data(CompVals);
	JoinSet.attr("value",function(d,i) {return d;})
		.text(function(d) {return d;});
	JoinSet.enter().append("option")
		.attr("value",function(d,i) {return d;})
		.text(function(d) {return d;});
	JoinSet.exit().remove();
	JoinSet.sort(function(a,b) { 
		if (typeof a == "string") {
			if (b==="") return -1;
			if (a==="") return 1;
			return a.localeCompare(b); 
		}
		return a-b;
	});
	JoinSet.node().parentNode.selectedIndex = 0;		//Set the filter select to (any) when the attribute changes
}

function FilterPanelNewRow(d,i) {
	var CurFilterCount = d3.selectAll(".PivotFilterGroup").size();
	if ( CurFilterCount == SpadeSettings.MaxFilters) return;
	FilterPanelAppendNewGroup(d3.select("#PivotFilterGroups"));
}

function FilterPanelRemoveRow(d,i) {
	var CurFilterCount = d3.selectAll(".PivotFilterGroup").size();
	if (CurFilterCount == 1) return;
	d3.select(this.parentNode).remove();
	d3.selectAll(".PivotFilterGroup").attr("id",function(d,i) {return "FilterGroup"+i;});
	Redraw();
}
