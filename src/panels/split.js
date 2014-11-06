/* globals d3,PivotSettings,document,Redraw,Globals, ReadSelectValues */
PivotSettings.Panels.push({
		name:"SplitPanel", 
		PanelDiv:"SplitsDiv",
		Title: "Splits",
		Functions: {
			ResetPanel:SplitPanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: SplitPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: SplitPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: SplitPanelValuesToHash,				//Return a hash value encoding current values of UI items
			CalculateData: SplitPanelCalculateData
		}
	});
	

function SplitPanelCalculateData(DataVar) {
	DataVar.PivotObj = SplitPanelCalculatePivotData(DataVar.CurData);
	DataVar.PivotArray = SplitPanelPivotObjectToArray(DataVar.PivotObj);

}
	
function SplitPanelValuesToHash() {
	var CurHash = "";
	d3.selectAll("#SplitsDiv .SplitGroup").each(function(d,i) {
		CurHash += this.id[5] + d3.select(this).select("select").node().value + ";";
	});
	return CurHash.slice(0,-1);
}

function SplitPanelUpdateFromHash(Hash) {
	var Splits = Hash.split(";");
	for (var i in Splits) {
		var CurSplit = d3.select("#SplitsDiv #Split"+Splits[i].slice(0,1)+"Group select");
		if (CurSplit[0][0] !== null) {				//If this split exists in this vis
			CurSplit.node().value = Splits[i].slice(1);
			if (CurSplit.node().value === "") CurSplit.node().selectedIndex = 0;
		}
	}
}

function SplitPanelReset(Div,Visualization) {
	var SplitTable = Div.append("table").append("tbody");
	
	for (var i=1;i<=Visualization.Panels.SplitPanel.Splits.length;i++) {
		/*jshint loopfunc:true */
		var CurSplit = Visualization.Panels.SplitPanel.Splits[i-1];
		var SplitName = CurSplit.Name === undefined ? "" : CurSplit.Name + ": ";
		var SplitType = CurSplit.Type;
		var NoSplitArray = CurSplit.NoSplit === undefined ? ["(no split)"] : (CurSplit.NoSplit ? ["(no split)"] : []);
		
		var CurSplitRow = document.createElement("tr");
		CurSplitRow.id = "Split'+i+'TR";
		CurSplitRow.innerHTML = '<td><span id="Split'+i+'Name" class="SplitName">'+SplitName+'</span></td><td><div id="Split'+i+'Group" class="SplitGroup"><span class="custom-dropdown custom-dropdown--small custom-dropdown--white"><select class="SplitAttributeSelect custom-dropdown__select custom-dropdown__select--white"></select></span></div></td>';
		SplitTable.append(function() {return CurSplitRow;});
		SplitTable.select("tr:last-child .SplitAttributeSelect")
			.on("change",Redraw)
			.selectAll("option")
				.data(NoSplitArray.concat(Object.keys(Globals.Catalog)
					.filter(function(d,i) { 
						if ( PivotSettings.HiddenAttributes.FilterAttributeSelect.indexOf(d) != -1) return false;
						if (SplitType !== undefined) return Globals.Catalog[d][SplitType];
						else return true;
					}).sort()))
			.enter().append("option")
			.attr("value",function(d,i) {return d;})
			.text(function(d) {return d;});
		//Add: If previously selected Split is still a valid attribute, select it!
	}

}
	
function SplitPanelReadSelectValues() {
	var RetVal = {};
	d3.selectAll("#SplitsDiv .SplitGroup").each(function(d,i) {
		var SplitNum = this.id[5];
		var SplitAttr = d3.select(this).select("select").node().value;
		RetVal["Split"+SplitNum+"Attribute"] = SplitAttr;
	});
	return RetVal;
}



	

/*				CALCULATION FUNCTIONS			*/

function SplitPanelPivotObjectToArray(PivotObj) {
	//Turns a PivotObj into an Array that can be parsed via d3 to create table

	var PivotArray = [];
	for (var row in PivotObj) {
		var CurRow = PivotObj[row] ;
		PivotArray.push({row: row, val: [{col:"Row Name",val:row}]});
		for (var col in CurRow) {
			var CurCol = PivotObj[row][col];
			PivotArray[PivotArray.length-1].val.push({col:col, val:CurCol});
		}
		PivotArray[PivotArray.length-1].val.sort(ColumnSorter);
	}
	return PivotArray.sort(RowSorter);

	function RowSorter(a,b) {
		if (a.row === "") return -1;
		else if (b.row === "") return 1;
		return d3.ascending(isNaN(a.row) ? a.row : parseFloat(a.row),isNaN(b.row) ? b.row : parseFloat(b.row));
	}
	function ColumnSorter(a,b) {
		if (a.col == "Row Name") return -1;
		else if (b.col == "Row Name") return 1;
		else if (a.col === "") return -1;
		else if (b.col === "" ) return 1;
		else return d3.ascending(isNaN(a.col) ? a.col : parseFloat(a.col),isNaN(b.col) ? b.col : parseFloat(b.col));
	}
}

function SplitPanelCalculatePivotData(FilteredData) {
	var SelectVals = ReadSelectValues();
	var Attributes = [];
	if (SelectVals.Split1Attribute !== undefined) Attributes.push(SelectVals.Split1Attribute);
	if (SelectVals.Split2Attribute !== undefined) Attributes.push(SelectVals.Split2Attribute);
	if (Attributes.length ===0) return {};
	var PivotObj = SplitPanelCreatePivotObject(FilteredData);
	for (var i in FilteredData) {
		var CurData = FilteredData[i];
		SplitPanelAddPivotObjData(PivotObj,Attributes,SelectVals.AggregatorAttribute,CurData);
	}
	return PivotObj;
}

function SplitPanelAddPivotObjData(PivotObj,SplitTree,DataAttribute,CurData) {
	//var SplitTree = Rows.concat(Cols);
	for (var i in SplitTree) {								//Find location to insert data
		if (SplitTree[i] == "(no split)") {					//If not splitting on this attribute, don't try to read attribute value from data
			PivotObj = PivotObj["(no split)"];				// use fake attribute value "(no split)" instead.
		}
		else PivotObj = PivotObj[CurData[SplitTree[i]]];	//If we are splitting, get the real attribute value
	}
	if (CurData[DataAttribute] !== "") {					//Push current data into array
		PivotObj.push(CurData[DataAttribute]);
	}
}



function SplitPanelGetAttributeValueList(DataSet,Attribute) {
	//Returns an array of all the values of a particular attribute
	//Maybe need to fix this so that it only returns those that still exist after filtering
	//return d3.set(DataSet.map(function(d) {return d[Attribute];})).values();
	if (Globals.Catalog[Attribute] === undefined) return ["undefined"];
	return Globals.Catalog[Attribute].FilteredUniqueList;
}

function SplitPanelCreatePivotObject(FilteredData) {
	var Attributes = [];
	if (ReadSelectValues().Split2Attribute !== undefined) Attributes.push(ReadSelectValues().Split2Attribute);
	if (ReadSelectValues().Split1Attribute !== undefined) Attributes.push(ReadSelectValues().Split1Attribute);
	return CreatePivotObjectRecurse(Attributes);

	function CreatePivotObjectRecurse(Attributes) {
		var Obj = {};
		Attributes = Attributes.slice();											//Make a copy of Attributes
		var CurAttribute = Attributes.pop();										//Get the Current Attribute
		var GoDeeper = Attributes.length === 0 ? false : true;						//If there are more attributes, we will have to recurse
		var CurAttributeValues = SplitPanelGetAttributeValueList(FilteredData,CurAttribute);	//Get a list of all possible values for an attribute
		if (CurAttribute == "(no split)") CurAttributeValues = ["(no split)"];		//If no split, only create one key --> for a catch all
		for (var i in CurAttributeValues) {											//For each possible attribute value, either create array to store
			var CurAttributeValue = CurAttributeValues[i];							// values or go deeper to create object for next attribute
			if (GoDeeper) {															//If there are more attributes, recurse to next level
				Obj[CurAttributeValue] = CreatePivotObjectRecurse(Attributes);
			}
			else {																	//If we're at the final split, create an array to sort values
				Obj[CurAttributeValue] = [];
			}
		}
		return Obj;
	}

}

