/* globals d3,PivotSettings,GetAttributeValueList,GenerateQizer,DownloadTextFile,ReadSelectValues,html2canvas,DownloadImageFile,
   CreateDomElement, Globals */

PivotSettings.Visualizations.push({
			name: "Table", 
			Functions: {
				DrawFunc: TableDraw
			},
			Settings: {
				RedrawOnVerticalResize: false,
				RedrawOnHorizontalResize: false,
				TableDerived: false			//Is this visualization built on top of the table visualization?
			},
			AdvancedOptions: [
				{type:"Select",id:"NumberFormat",title:"Format: ",vals:["Auto","Number","Percent"]},
				{type:"Select",id:"NumberPlaces",title:"Places: ",vals:[0,1,2]},
				{type:"Select",id:"NumberShowAs",title:"Show As: ",vals:["(normal)","Percent of Row","Percent of Column","Percent of Grand Total","Diff From Row","Diff From Column","Diff From Grand Total"]},
				{type:"Check",id:"ShowText",title:"Show Text:",checked:true},
				{type:"Check",id:"ShowHeaders",title:"Show Headers:",checked:true},
				{type:"Check",id:"ShowLegend",title:"Show Legend:",checked:true},
				{type:"Check",id:"ShowTotals",title:"Show Totals:",checked:true},
				{type:"Button",id:"ExportCSV",text:"Export CSV",func:TableExportCSV},
				{type:"Button",id:"ExportImage",text:"Export Image",func:TableExportImage}
			],
			Panels: {
				DataSetPanel: {},
				VisualizationPanel: {},
				SplitPanel: {
					Splits: [
						{Name: "Row",NoSplit:true},
						{Name: "Col",NoSplit:true}
					]
				},
				AggregatorPanel: {},
				FilterPanel: {},
				AdvancedOptionsPanel: {},
				ColorPanel: {ColorScale: true}
			},
			HashNames: ["NumberFormat","NumberPlaces","NumberShowAs","ShowText","ShowHeaders","ShowLegend","ShowTotals"] //Values to save in hash
		});

/* ------------------------------------------------------------------------------------------------------------ */



function TableDraw(Data,SelectVals,MainDiv) {
	var AggregatorFunc = PivotSettings.Aggregators[SelectVals.AggregatorType].func;
	var Table = MainDiv.append("table").classed("NoBorder",!SelectVals.VisAdvancedOptions.TableShowText).classed("MainTable",true);
	var THead = Table.append("thead");
	var TBody = Table.append("tbody");
	

	var ColNames = Data.PivotArray[0].val.map(function(a) { return a.col;});
	//Add Column Headers
	THead.append("tr")
		.selectAll("th")
		.data(ColNames.concat(["Row "+PivotSettings.Aggregators[SelectVals.AggregatorType].shortname]))
		.enter()
		.append("th")
		.text(function(d) { 
			if (d == "Row Name" || !SelectVals.VisAdvancedOptions.TableShowHeaders) return "";
			if (d === "") return "(blank)";
			if (d == "(no split)") return "(all)";
			else return d;
		});
	
	//Add TRs to tbody
	var TableRows = TBody.selectAll("tr")
		.data(Data.PivotArray)
		.enter()
		.append("tr")
		.style("height","6px");
	
	
	var ColTotalArray = [];										//Keep track of data points to calculate col total
	
	//Set data, create cells, and display values in cells
	var TableCells = TableRows.selectAll("td")
		.data(function(row) {
			var RowTotalArray = [];									//Keep track of all data points for this row so can calculate row total
			var RowArray = ColNames.map(function(column,index) {
				if (column != "Row Name") {
					if (ColTotalArray[column] === undefined) ColTotalArray[column] = []; //
					
					if (row.val[index].val.length === 0) {		//If no data points at this intersection, return blank cell
						return {col:column, val: "",fullval:"",showasval:""};
					}
					else {										//Otherwise display aggregated value
						ColTotalArray[column] = ColTotalArray[column].concat(row.val[index].val);
						RowTotalArray = RowTotalArray.concat(row.val[index].val);
						var AggregatedVal = AggregatorFunc(row.val[index].val);
						return {
							col:column, 
							row:row.row,
							fullval:AggregatedVal,																		
							showasval:AggregatedVal,					//Val to generate Color unless changed by Show As...
							val: SelectVals.VisAdvancedOptions.TableShowText ? TableFormatNumber(AggregatedVal,SelectVals.AggregatorAttribute) : ""	//Val to display
						};
					}
				}
				else {											//If it's the first column, show the name of this row
					var ColName = row.val[index].val === "" ? "(blank)" : row.val[index].val;		//replace "" with (blank)
					if (ColName == "(no split)") ColName = "(all)";									//replace "(no split)" with (all)
					return {col:column, val: SelectVals.VisAdvancedOptions.TableShowHeaders ?  ColName: ""};
				}
			});
			//Add Row Total cell
				if (RowTotalArray.length >0) {
					var AggregatedVal = AggregatorFunc(RowTotalArray);
					RowArray.push({
						val:SelectVals.VisAdvancedOptions.TableShowText ? TableFormatNumber(AggregatedVal,SelectVals.AggregatorAttribute) : "",
						fullval:AggregatedVal,
						row: row.row,
						col: "Row Total"
					});
				}
				else {
					RowArray.push({col:"Row Total", val: "",fullval:""});
				}
			return RowArray;
		})
		
		.enter()
		.append("td")
		.classed("TotalTD",function(d) { return d.col == "Row Total";})
		.html(function(d) {return d.val;});

	
	//Find maximum col width, and set all cols to be that same width
	var MaxWidth = 4;
	MainDiv.selectAll("tbody td:not(:first-child),thead th:not(:last-child):not(:first-child)").each(function(d,i) { 
		var CurWidth = d3.select(this).style("width");
		CurWidth = +CurWidth.substring(0,CurWidth.length-2);
		if (CurWidth > MaxWidth && d3.select(this).data()[0].col != "Row Total") MaxWidth = CurWidth;
	});
	MainDiv.selectAll("td:not(:first-child)")
		.style("min-width",MaxWidth+"px");
	
		
	//Add Row for Col Total 
	var	GrandTotalArray = [];
	var ColArray = [{val:"Col "+PivotSettings.Aggregators[SelectVals.AggregatorType].shortname,type:"header"}];
	for (var i in ColTotalArray) {

		var ColDataArray = ColTotalArray[i];
		GrandTotalArray = GrandTotalArray.concat(ColDataArray);
		if (ColDataArray.length === 0 ) ColArray.push({val:"",fullval:""});
		else {

			var AggregatedVal = AggregatorFunc(ColDataArray);
			ColArray = ColArray.concat([ {val:TableFormatNumber(AggregatedVal,SelectVals.AggregatorAttribute),fullval:AggregatedVal}]);
		}

	}
	if (GrandTotalArray.length > 0) {
		var GrandAggregatedVal =  AggregatorFunc(GrandTotalArray);	
		ColArray.push({val:TableFormatNumber(GrandAggregatedVal,SelectVals.AggregatorAttribute),fullval:GrandAggregatedVal});
	}
	else ColArray.push({val:"",fullval:""});
	MainDiv.select(".MainTable tbody").append("tr")
		.selectAll("td")
		.data(ColArray)
		.enter()
		.append("td")
		.classed("TotalTD",true)
		.html(function(d) { 
			if (d.type == "header") return SelectVals.VisAdvancedOptions.TableShowHeaders ? d.val : "";
			else return SelectVals.VisAdvancedOptions.TableShowText ? d.val : "";
	});


	
	
	//If Show Totals Option is off, hide the totals (they're still added so that they can be used for "Show As Percent of Row", etc)
	if (!SelectVals.VisAdvancedOptions.TableShowTotals) {
		MainDiv.selectAll(".MainTable td:last-child").classed("hidden",true);
		MainDiv.selectAll(".MainTable th:last-child").classed("hidden",true);
		MainDiv.selectAll(".MainTable tbody tr:last-child").classed("hidden",true);
	}
	
	//Recalculate table values based on Show As (e.g. Show as percent of row total)
	TableApplyShowAs();
	
	//Generate and apply Qizer for cell coloring
	var AllValues = [];
	MainDiv.selectAll("tbody tr:not(:last-child) td:not(:last-child):not(:first-child)").each(function(d) {
		if (d.showasval !== "") AllValues.push(d.showasval);
	});
	var Qizer = GenerateQizer(AllValues);
	MainDiv.selectAll("tbody tr:not(:last-child) td:not(:last-child):not(:first-child)").each(function(d,i) {
		if (d.showasval !=="") {
			this.className += " "+PivotSettings.ColorScales[SelectVals.ColorPanelColorScale].prefix+Qizer(d.showasval);
			var BGColor = d3.select(this).style("background-color").match(/[0-9]{1,3}/g);
			if (Math.sqrt(0.241*BGColor[0]*BGColor[0] + 0.691*BGColor[1]*BGColor[1] + 0.068*BGColor[2]*BGColor[2] ) < 130) {
				d3.select(this).style("color","white");
			}
		}
	});
	
	//Draw Legend if option is set
	if (SelectVals.VisAdvancedOptions.TableShowLegend) TableDrawLegend(Qizer,MainDiv,SelectVals);
	
	return;
	
	
	function TableApplyShowAs() {
		//Recalculate values in the table based on the Show As option
		//Also modified SelectVals.VisAdvancedOptions.TableNumberFormat to Percent if a Percent "Show As" format is selected (e.g. " Show As Percent of Row")
		var ShowAsType = SelectVals.VisAdvancedOptions.TableNumberShowAs;
		var TotalVal,ShowAsVal;
		var BackupTableNumberFormat = SelectVals.VisAdvancedOptions.TableNumberFormat;		//Need to back up so edits to this val don't affect other tiles
		if (ShowAsType == "(normal)" || !SelectVals.VisAdvancedOptions.TableShowText) return;
		if (ShowAsType == "Percent of Row" || ShowAsType == "Diff From Row") {
			MainDiv.selectAll("tbody tr").each(function(d,i) {
				TotalVal = d3.select(this).selectAll("td:last-child").data()[0].fullval;
				d3.select(this).selectAll("td:not(:last-child):not(:first-child)").each(function(d,i) {
					var CurVal = d.fullval;
					if (CurVal !== "" && TotalVal !== "") {
						if (ShowAsType == "Percent of Row") {
							SelectVals.VisAdvancedOptions.TableNumberFormat = "Percent";
							ShowAsVal = CurVal/TotalVal;
						}
						else {
							ShowAsVal = CurVal-TotalVal;
						}
						this.innerText = TableFormatNumber(ShowAsVal,SelectVals.AggregatorAttribute);
						d.showasval = ShowAsVal;
						d3.select(this).datum(d);
						//Do we also need to set d.val and d.fullval to new values?
					}
				});
			});
		}
		if (ShowAsType == "Percent of Column" || ShowAsType == "Diff From Column" || ShowAsType == "Percent of Grand Total" || ShowAsType == "Diff From Grand Total") {
			var NumColumns = ColNames.length;
			if (ShowAsType == "Percent of Grand Total" || ShowAsType == "Diff From Grand Total") NumColumns--;	//Don't adjust col total column if comparing to Grand Total
			for (var i = 1; i <=NumColumns;i++) {
				/*jshint loopfunc: true */
				if (ShowAsType == "Percent of Column" || ShowAsType == "Diff From Column") {
					TotalVal = MainDiv.selectAll("tbody tr:last-child td:nth-child("+(i+1)+")").datum().fullval;
				}
				else if (ShowAsType == "Percent of Grand Total" || ShowAsType == "Diff From Grand Total") {
					TotalVal = MainDiv.selectAll("tbody tr:last-child td:last-child").datum().fullval;
				}
				MainDiv.selectAll("tbody tr:not(:last-child) td:nth-child("+(i+1)+")").each(function(d,i) {
					var CurVal = d.fullval;
					if (CurVal !== "" && TotalVal !== "") {
						if (ShowAsType == "Percent of Column" || ShowAsType == "Percent of Grand Total") {
							SelectVals.VisAdvancedOptions.TableNumberFormat = "Percent";
							ShowAsVal = CurVal/TotalVal;
						}
						else {
							ShowAsVal = CurVal - TotalVal;
						}
						this.innerText = TableFormatNumber(ShowAsVal,SelectVals.AggregatorAttribute);
						d.showasval = ShowAsVal;
						d3.select(this).datum(d);
					}	
				});
			}
		}

		SelectVals.VisAdvancedOptions.TableNumberFormat = BackupTableNumberFormat;
		
	}
	
	function TableDrawLegend(Qizer,MainDiv,SelectVals) {
		var domain;
		if (Qizer.domain().length != Qizer.range().length) {
			domain = d3.range(Qizer.domain()[0],Qizer.domain()[1],(Qizer.domain()[1]-Qizer.domain()[0])/Qizer.range().length);
		}
		else domain = Qizer.domain();
		var TableRows = MainDiv.append("table")
			.classed("TableLegendTable",true)
			.selectAll("tr")
			.data(Qizer.range())
			.enter()
			.append("tr");
		
		TableRows.selectAll("td")
			.data(function(row) {
				return [
					{classname: PivotSettings.ColorScales[SelectVals.ColorPanelColorScale].prefix+row},
					{text:TableFormatNumber(domain[Qizer.range().indexOf(row)],SelectVals.AggregatorAttribute)}];
			})
			.enter()
			.append("td")
			.html(function(d) {
				if (d.text !== undefined) return d.text;
				return "";
			})
			.attr("class",function(d) {
				if (d.classname !== undefined) return d.classname;
				return "";
			});
		
	}
	function TableFormatNumber(val,Attribute) {
		if (Attribute === "" || Attribute === undefined) return val;
		var Places = SelectVals.VisAdvancedOptions.TableNumberPlaces;
		var Format = SelectVals.VisAdvancedOptions.TableNumberFormat;
		var AggregatorName = PivotSettings.Aggregators[SelectVals.AggregatorType].shortname;
		if (val === "") return "";
		if ((Format == "Auto" && Globals.Catalog[Attribute].Percent && AggregatorName != "Count") || Format == "Percent") val *= 100;
		val =  Math.round(val*Math.pow(10,Places))/Math.pow(10,Places);
		if ((Format == "Auto" && Globals.Catalog[Attribute].Percent && AggregatorName != "Count") || Format == "Percent") val += "%";
		return val;
	}
}



function TableExportCSV() {
	var ExportString = "";
	var SelectVals = ReadSelectValues();
	d3.selectAll(".TileDiv").each(function(d) {
		ExportString += d3.select(this).selectAll(".TileTitleDiv").html().replace(/&nbsp;/g," ")+"\n";
		d3.select(this).selectAll(".MainTable tr").each(function(d) { 
			var cells = d3.select(this).selectAll("td,th")[0];
			ExportString += cells.reduce(function(prev,cur) { 
				return (prev.innerText === undefined ? prev : prev.innerText) + "," + cur.innerText;

			});

			ExportString += "\n";
		});
		ExportString += "\n\n\n";
	});
	DownloadTextFile(SelectVals.DataSet+".csv",ExportString);
	
}

function TableExportImage() {
	var SavedHeight = d3.select("#MainDiv").style("height");
	d3.select("#MainDiv").style("height","");
	html2canvas(d3.select("#TileTable").node(),{
		onrendered: function(canvas) {
			d3.select("#MainDiv").style("height",SavedHeight);
			var SelectVals = ReadSelectValues();
			DownloadImageFile(SelectVals.DataSet+".png",canvas);
		}
	});
	
}
