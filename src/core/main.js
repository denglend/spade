/* globals sessionStorage, d3, DisplayModal, SpadeSettings, Globals, ParseURLParams, document, ParseHash, ShortenSelectKey, ProcessLoadedData,
	SetEventHandlers, GetPanel, CreateDomElement */


/* START */
Initialize();


function Initialize() {
	
	if (sessionStorage.getItem("version") === null || sessionStorage.getItem("version") != SpadeSettings.Version) {
		d3.text("changelog.txt",function(error,data) {
			DisplayModal({Header:"New Version!",Type:"Pre",Content:data});
			sessionStorage.setItem("version",SpadeSettings.Version);
		});
	}

	Globals.URLParams = ParseURLParams();
	if (Globals.URLParams.NoInterface !== undefined) {
		d3.select("#HeaderDiv").style("display","none");
	}
	
	var HashNum = SpadeSettings.Panels.indexOf(GetPanel("DataSetPanel"));
	var HashObj = ParseHash();
	var DefaultFileName = SpadeSettings.DataSets[0].name;
	SetEventHandlers();
	GetPanel("DataSetPanel").Functions.UpdatePanelFromHash(HashObj[HashNum] === undefined? DefaultFileName : HashObj[HashNum]);
}

