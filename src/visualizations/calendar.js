/* globals PivotSettings,d3,DisplayModal,moment,GenerateQizer,html2canvas,ReadSelectValues,DownloadImageFile,CreateDomElement */

//Inspired by http://bl.ocks.org/mbostock/4063318 who was in turn inspired by http://stat-computing.org/dataexpo/2009/posters/wicklin-allison.pdf

PivotSettings.Visualizations.push({
			name: "Calendar",
			Functions: {
				DrawFunc:CalendarDraw,
				DrawInitFunc:CalendarDrawInit,
			},
			Settings: {
				RedrawOnVerticalResize: false,
				RedrawOnHorizontalResize: false
			},
			Panels: {
				SplitPanel: {
					PanelName: "Date Attribute",
					Splits: [
						{Type:"Date",NoSplit:false}
					]
				},
				DataSetPanel: {},
				VisualizationPanel: {},				
				AggregatorPanel: {},
				FilterPanel: {},
				AdvancedOptionsPanel: {},
				ColorPanel: {ColorScale: true}
			},
			AdvancedOptions: [
				{type:"Button",id:"ExportImage",text:"Export Image",func:CalendarExportImage}
			]
		});

/* ------------------------------------------------------------------------------------------------------------ */


function CalendarDrawInit(SelectVals) {
	if (SelectVals.Split1Attribute === "") {
		DisplayModal({Header:"No Date Values",Type:"Alert",Content:"There are no columns in your data set that appear to contain dates"});
		return false;
	}
	return true;
}

function CalendarDraw(Data,SelectVals,MainDiv) {
	var DateAttribute = SelectVals.Split1Attribute;
	if (DateAttribute  === "" ) return;		//There are no date values in this data set
	
	var DateList = Data.CurData.map(function(d) {
		var CurDate = new Date(d[DateAttribute]);
		CurDate.setTime(CurDate.getTime() + CurDate.getTimezoneOffset()*60000);
		return +CurDate.getFullYear();
	});
	var YearList = d3.range(Math.min.apply(null,DateList), Math.max.apply(null,DateList)+1);
	
	var TBody = MainDiv.selectAll("table")
	.data(YearList).enter()
	.append("table").attr("class","CalendarTable").append("TBody");
	
	var TableRows = TBody.selectAll("tr").data(function(Year) {

		var Offset = 0 - moment("Jan 1 "+Year).day();
		return d3.range(1,8).map(function(d,i) {
			return d3.range(Offset + i,Offset + 54*7 + i,7);
		});
	})
	.enter().append("tr");
	
	var AllValues = [];
	var TableCells = TableRows.selectAll("td")
		.data(function(row,i) { 
			var CurYear = d3.select(this.parentNode.parentNode).datum();
			var Jan1 = CurYear+"-01-01";

			return row.map(function(el) {
				var CurDate = new Date(Jan1); CurDate.setTime(CurDate.getTime() + CurDate.getTimezoneOffset()*60000);
				CurDate.setDate(CurDate.getDate() + el);
				var FormattedDate = CurDate.yyyymmdd();
				var PivotList = Data.PivotObj[FormattedDate];
				var AggregatedVal = PivotList === undefined ? undefined : PivotSettings.Aggregators[SelectVals.AggregatorType].func(PivotList);
				if (AggregatedVal !== undefined) AllValues.push(AggregatedVal);
				return {Date:FormattedDate,Invisible:CurDate.getFullYear() != CurYear ? true : false,Val:AggregatedVal};
			});
		})
		.enter()
		.append("td")
		.attr("class",function(d,i) {
			var CurDate = new Date(d.Date); CurDate.setTime(CurDate.getTime() + CurDate.getTimezoneOffset()*60000);
			var TimeZoneAdjust = CurDate.getTimezoneOffset()*60000;
			var NextWeek = new Date(d.Date); NextWeek.setDate(NextWeek.getDate() +7); NextWeek.setTime(NextWeek.getTime() + TimeZoneAdjust);
			var LastWeek = new Date(d.Date); LastWeek.setDate(LastWeek.getDate() -7); LastWeek.setTime(LastWeek.getTime() + TimeZoneAdjust);
			var Tomorrow = new Date(d.Date); Tomorrow.setDate(Tomorrow.getDate() +1); Tomorrow.setTime(Tomorrow.getTime() + TimeZoneAdjust);
			var Yesterday = new Date(d.Date); Yesterday.setDate(Yesterday.getDate() -1); Yesterday.setTime(Yesterday.getTime() + TimeZoneAdjust);
			var CurMonth = CurDate.getMonth();
			var CurDay = CurDate.getDay();
			var CurClass = "CalendarDay";
			if (CurMonth != NextWeek.getMonth()) CurClass += " CalendarMonthRight";
			if (CurMonth != LastWeek.getMonth()) CurClass += " CalendarMonthLeft";
			if (CurDay === 0 || CurMonth != Yesterday.getMonth()) CurClass += " CalendarMonthTop";
			if (CurDay === 6 || CurMonth != Tomorrow.getMonth()) CurClass += " CalendarMonthBottom";
			if (d.Invisible) CurClass += " CalendarInvisible";
			return CurClass;
		})
		.attr("title",function(d,i) { //tooltip
			if (!d3.select(this).classed("CalendarInvisible")) {
				return d.Date +(d.Val === undefined ? "" : ": "+d.Val);
			}
			else return "";
		});
			
	
	
	//MainDiv.selectAll(".CalendarTable td").each(function(d,i) {if (d.Val !== undefined) AllValues.push(d.Val);}); 
	var Qizer = GenerateQizer(AllValues);	

	TableCells.attr("class",function(d) {
		if (d.Val === undefined) return this.className;
		return this.className+" "+PivotSettings.ColorScales[SelectVals.ColorPanelColorScale].prefix+Qizer(d.Val);
	});

	//Add Year text
	var HeaderTDs = TBody.selectAll("tr:first-child").insert("td","td:first-child")
		.attr("rowspan",7)
		.attr("Class","CalendarYearTD")
		.append("div")
		.attr("class","CalendarYearDiv")
		.text(function(d,i) {return d3.select(this.parentNode.parentNode.parentNode).datum();});
	
	//Add Month Text
	TBody.insert(function(d,i) {
		var j=0; var MonthLengths = []; var InvisibleCount = 1; 
		var MonthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
		var TempTable = CreateDomElement("<table><tbody><tr class='CalendarMonthTitleTR'></tr></tbody></table>");
		d3.select(this).select("tr").selectAll("td:not(:first-child)").each(function(d,i) { 
			if (d3.select(this).classed("CalendarInvisible") && MonthLengths.length ===0) {
				InvisibleCount++;
				return; 
			}	
			j++; 
			if (!d3.select(this).classed("CalendarMonthRight")) return; 
			MonthLengths.push(j);
			j=0;
		});
		for (j=0;j<InvisibleCount;j++) d3.select(TempTable).select("tr").append("td");
		for (j=0;j<12;j++) d3.select(TempTable).select("tr").append("td").attr("colspan",MonthLengths[j]).text(MonthNames[j]).attr("class","CalendarMonthText");
		return TempTable.children[0].children[0];
	},
	":first-child");	
}


function CalendarExportImage() {
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
