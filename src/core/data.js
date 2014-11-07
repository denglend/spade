/* globals ReadSelectValues, Globals, d3, PopulateForm, document, ParseHash, ShortenSelectKey, SpadeSettings,
  		   SetEventHandlers, FilterAttributeSelectHandlerNoRedraw, VisualizationChangeHandlerNoRedraw, window,
		   Redraw, FileReader, moment, console*/

function ProcessLoadedData(Data,FirstLoad) {
	

	Globals.Data = CleanupData(Data);
	CatalogData(Data);
	PopulateForm();
	Redraw();
	
}


	
//This function is called when user choose to upload a file via the click handler of a hidden button
function LoadCustomDataSet(files) {
	var file = files[0];
	var reader = new FileReader();
	reader.onload = function(e) {
		ProcessLoadedData(d3.csv.parse(e.target.result));
	};
	reader.readAsText(file);
	
}

function CatalogAddFilteredData(Data) {
	//Add filtered data to catalog, to populate FilterUniqueLists
	if (Data.length === 0) return;
	var i,Keys = Object.keys(Data[0]);
	for (i=0;i<Keys.length;i++) {				//Set up data to defaults
		Globals.Catalog[Keys[i]].FilteredUniqueList = [];
	}
	for (i=0;i<Data.length;i++) {
		for (var j=0;j<Keys.length;j++) {
			var CurKey = Keys[j];
			var CurVal = Data[i][CurKey];
			Globals.Catalog[CurKey].FilteredUniqueList[CurVal] = true;
		}
	}
	for (i=0;i<Keys.length;i++) {		//Convert to a list of unique values
		Globals.Catalog[Keys[i]].FilteredUniqueList = Object.keys(Globals.Catalog[Keys[i]].FilteredUniqueList);
	}
}
			
function CatalogData(Data) {
	//Iterate through each attribute of each data point and catalog:
	// Unique values for that attribute
	// Whether that value is numeric or NaN
	// Whether numeric data points appear to be percents
	var Keys = Object.keys(Data[0]);
	var i,j;
	Globals.Catalog = {};
	Globals.CachedDates = {};
	for (i=0;i<Keys.length;i++) {				//Set up data to defaults
		Globals.Catalog[Keys[i]] = {};
		Globals.Catalog[Keys[i]].Numeric = true;
		Globals.Catalog[Keys[i]].Percent = true;
		Globals.Catalog[Keys[i]].Date = true;
		Globals.Catalog[Keys[i]].UniqueList = [];
		Globals.Catalog[Keys[i]].FilteredUniqueList = [];
		Globals.Catalog[Keys[i]].ParsedDates = [];
		Globals.Catalog[Keys[i]].NotNumericBecause = "";
	}
	for (i=0;i<Data.length;i++) {
		for (j=0;j<Keys.length;j++) {
			var CurKey = Keys[j];
			var CurVal = Data[i][CurKey];
			if (isNaN(CurVal)) {									//current value is not numeric
				Globals.Catalog[CurKey].NotNumericBecause = CurVal;
				Globals.Catalog[CurKey].Numeric = false;
				Globals.Catalog[CurKey].Percent = false;
				if (Globals.Catalog[CurKey].Date) {
					if (Globals.CachedDates[CurVal] !== undefined) {							//Cache dates for later b/c moment.js is slow
						Globals.Catalog[CurKey].ParsedDates[i] = Globals.CachedDates[CurVal];
					}
					else {
						var CurMoment = moment(CurVal);
						if ( !CurMoment.isValid()) {
							Globals.Catalog[CurKey].Date = false;			//current value is not a date
						}
						else if (Globals.Catalog[CurKey].Date) {			//current value is a date, so save it for later in case the entire col is dates and we want to reformat
							Globals.Catalog[CurKey].ParsedDates[i] = CurMoment.format("YYYY-MM-DD");
							Globals.CachedDates[CurVal] = Globals.Catalog[CurKey].ParsedDates[i];
						}
					}
				}
			}
			else { 													//current value is numeric
				Globals.Catalog[CurKey].Date = false;
				Data[i][CurKey] = +Data[i][CurKey];
				if (CurVal > 1 || CurVal < -1) Globals.Catalog[CurKey].Percent = false;
			}
			Globals.Catalog[CurKey].UniqueList[CurVal] = true;
		}
	}
	for (i=0;i<Keys.length;i++) {		//Convert to a list of unique values
		Globals.Catalog[Keys[i]].UniqueList = Object.keys(Globals.Catalog[Keys[i]].UniqueList);
		if (Globals.Catalog[Keys[i]].Date) {							//If this column is a date, replaces dates with those formatted as YYYY-MM-DD
			for (j in Globals.Catalog[Keys[i]].ParsedDates) {
				Data[j][Keys[i]] = 	Globals.Catalog[Keys[i]].ParsedDates[j];
			}
		}
	}
	
}

function CleanupData(Data) {
	//Mark all attributes with NaN data as not for display
	var Keys = Object.keys(Data[0]);
	Data.forEach(function(Datum,i) {
		for (var j=0; j <Keys.length; j++) {
			//if (Datum[Keys[j]] === "") Datum[Keys[j]] = "(blank)";     Doesn't work as expected
			if (isNaN(Datum[Keys[j]])) {
				//This attribute type has a NaN value
				console.log("Filtering out attribute '"+Keys[j]+"' because it has non-numeric values (e.g. '"+Datum[Keys[j]]+"')");
				SpadeSettings.HiddenAttributes.DisplayAttribute.push(Keys[j].toUpperCase());
				Keys.splice(j,1);
				j--;
			}
		}
	});
	return Data;
}
