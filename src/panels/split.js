/* globals d3,PivotSettings,document,Redraw,Globals */
PivotSettings.Panels.push({
		name:"SplitPanel", 
		PanelDiv:"SplitsDiv",
		Title: "Splits",
		Functions: {
			ResetPanel:SplitPanelReset,								//Reload Panel (b/c DataSet or Vis has changed)
			ReadSelectValues: SplitPanelReadSelectValues,			//Return values of UI items on panel
			UpdatePanelFromHash: SplitPanelUpdateFromHash,			//Set panel UI items based on passed hash value
			PanelValuesToHash: SplitPanelValuesToHash,				//Return a hash value encoding current values of UI items
		}
	});
	
	
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



	
