/* globals PivotSettings,Globals */
PivotSettings.Visualizations.push({
			name: "Data Info",
			Functions: {
				DrawFunc:DataInfoDraw
			},
			Settings: {
				RedrawOnVerticalResize: false,
				RedrawOnHorizontalResize: false
			},
			Panels: {
				DataSetPanel: {},
				VisualizationPanel: {},
				AdvancedOptionsPanel: {}
			},
			AdvancedOptions: [ 
			],
			HashNames: []
		});

function DataInfoDraw(PivotObj,SelectVals,PivotArray,MainDiv,FilteredData) {
	MainDiv.append("div").html("Number of Rows of Data: "+Globals.Data.length);
	var HeaderData = ["Column Name", "Numeric",  "Percent",  "Date", "Non-Numeric Example",  "List of Values"];
		
	var Data = Object.keys(Globals.Catalog).map(function(a) {var b = Globals.Catalog[a]; b.Name = a; return b;});
	
	var Table = MainDiv.append("table");
	var THead = Table.append("thead").append("tr");
	var TBody = Table.append("tbody");
	
	THead.selectAll("th")
		.data(HeaderData)
		.enter()
		.append("td")
		.text(function(d) {return d;})
		.style("background-color","#DDD")
		.style("font-weight","bold");
	
	var TableRows = TBody.selectAll("tr")
		.data(Data)
		.enter()
		.append("tr");
	
	TableRows.selectAll("td")
		.data(function(Attribute) {
			return [
				Attribute.Name,
				Attribute.Numeric ? "X" : "",
				Attribute.Percent ? "X" : "",
				Attribute.Date ? "X" : "",
				Attribute.NotNumericBecause,
				Attribute.UniqueList.length >15 ? Attribute.UniqueList.slice(0,16).reduce(function(a,b) {return a+", "+b;})+", ..." : Attribute.UniqueList.reduce(function(a,b) {return a+", "+b;})
			];

		
		})
		.enter()
		.append("td")
		.style("background-color","#EEE")
		.text(function(d) {return d;});

	MainDiv.append("div").append("pre").text(JSON.stringify(PivotSettings,undefined,2));
	
}
