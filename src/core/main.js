/* globals sessionStorage, d3, DisplayModal, PivotSettings, Globals, ParseURLParams, document, ParseHash, ShortenSelectKey, ProcessLoadedData,
	SetEventHandlers, GetPanel, CreateDomElement */


/* START */
Initialize();


function Initialize() {
	
	if (sessionStorage.getItem("version") === null || sessionStorage.getItem("version") != PivotSettings.Version) {
		d3.text("changelog.txt",function(error,data) {
			DisplayModal({Header:"New Version!",Type:"Pre",Content:data});
			sessionStorage.setItem("version",PivotSettings.Version);
		});
	}

	Globals.URLParams = ParseURLParams();
	if (Globals.URLParams.NoInterface !== undefined) {
		d3.select("#HeaderDiv").style("display","none");
	}
	
	var HashNum = PivotSettings.Panels.indexOf(GetPanel("DataSetPanel"));
	var HashObj = ParseHash();
	var DefaultFileName = PivotSettings.DataSets[0].name;
	SetEventHandlers();
	GetPanel("DataSetPanel").Functions.UpdatePanelFromHash(HashObj[HashNum] === undefined? DefaultFileName : HashObj[HashNum]);
}

