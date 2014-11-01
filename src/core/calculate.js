/* globals d3,PivotSettings,Globals,ReadSelectValues */


function PivotObjectToArray(PivotObj) {
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

function CalculatePivotData(FilteredData) {
	var SelectVals = ReadSelectValues();
	var Attributes = [];
	if (SelectVals.Split1Attribute !== undefined) Attributes.push(SelectVals.Split1Attribute);
	if (SelectVals.Split2Attribute !== undefined) Attributes.push(SelectVals.Split2Attribute);
	if (Attributes.length ===0) return {};
	var PivotObj = CreatePivotObject(FilteredData);
	for (var i in FilteredData) {
		var CurData = FilteredData[i];
		AddPivotObjData(PivotObj,Attributes,SelectVals.AggregatorAttribute,CurData);
	}
	return PivotObj;
}

function AddPivotObjData(PivotObj,SplitTree,DataAttribute,CurData) {
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


function FilterData(data,Filters) {
    //Returns data filtered against Filters
	var TempData = data.filter(function(d) {
		
		var RetVal = true;
		if (Filters !== undefined) {
			Filters.forEach(function(el,i,arr) {		
				if (d[el.Attribute] !== undefined && Globals.Catalog[el.Attribute].Date) {
					if (!el.CompareFunc(new Date(d[el.Attribute]))) RetVal = false;
				}
				else {
					if (!el.CompareFunc(d[el.Attribute])) RetVal = false;
				}
			});
		}
		return RetVal;
	});
	return TempData;
}

function GetRowNames() {
	//Return an array of the row attribute names to split on
	return ReadSelectValues().Rows;
}

function GetColNames() {
	//Return an array of the column attribute names to split on
	return ReadSelectValues().Cols;
}

function GetAttributeValueList(DataSet,Attribute) {
	//Returns an array of all the values of a particular attribute
	//Maybe need to fix this so that it only returns those that still exist after filtering
	//return d3.set(DataSet.map(function(d) {return d[Attribute];})).values();
	if (Globals.Catalog[Attribute] === undefined) return ["undefined"];
	return Globals.Catalog[Attribute].FilteredUniqueList;
}
	
function CreatePivotObject(FilteredData) {
	var Attributes = [];
	if (ReadSelectValues().Split2Attribute !== undefined) Attributes.push(ReadSelectValues().Split2Attribute);
	if (ReadSelectValues().Split1Attribute !== undefined) Attributes.push(ReadSelectValues().Split1Attribute); 
	return CreatePivotObjectRecurse(Attributes);
	
	function CreatePivotObjectRecurse(Attributes) {
		var Obj = {};
		Attributes = Attributes.slice();											//Make a copy of Attributes
		var CurAttribute = Attributes.pop();										//Get the Current Attribute
		var GoDeeper = Attributes.length === 0 ? false : true;						//If there are more attributes, we will have to recurse
		var CurAttributeValues = GetAttributeValueList(FilteredData,CurAttribute);	//Get a list of all possible values for an attribute
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

