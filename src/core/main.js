/* globals sessionStorage, d3, DisplayModal, PivotSettings, Globals, ParseURLParams, document, ParseHash, ShortenSelectKey, ProcessLoadedData,
	MatchObjectInArray, SetEventHandlers, PopulateForm, GetPanel, CreateDomElement */

/* TO DO
 Allow grouping of continuous floating point data, so there are less rows/columns (use jenks natural breaks)
 Allow auto-grouping of date/time data by week, month, or year
 Back/Forward doesn't work correctly when dataset or visualization changes
 Add multi-select comparator ("one of" and "not one of")
 Add Regex comparator (In an "advanced mode" only?)
 Use better color scales (built-in D3 scales and/or colorbrewer)
 New Vis: Stacked Bar/Column chart
 New Vis: Bubble chart
 New Vis: Pie chart (ala http://bl.ocks.org/mbostock/3888852 ?)
 New Vis: Heatmap (only for continuous, i.e. non-categorical, data)
 New Vis: Parallel Sets using https://github.com/jasondavies/d3-parsets
 New Vis: Box Plots (see http://bl.ocks.org/mbostock/4061502)
 New Vis: Bubble Matrix (see http://dimplejs.org/examples_viewer.html?id=bubbles_matrix)
 New Vis: USA Map Chloropleth or DC Ward Chloropleth
 Build PivotObjs for Tiles in parallel rather than in sequence for speed optimization (at cost of memory consumed)
 Reusable Error Message Display (e.g. for when you try to select options that are incompatible with a visualization)
 Fix: (no split) needs to appear first in Row/Col split list, even if there's something that would come first w/d3.ascending (e.g. " Count" is currently sorted before "(no split)");
 	Same with (any)
 Fix: Select styling looks bad on Firefox.  Perhaps use: http://jsfiddle.net/sstur/fm5Jt/
 Fix: On Vis change, scroll MainDiv back to top  (Also on Data Set change?)
 Warn/prevent when splitting (or especially tiling) on attribute that has way too many unique values to prevent crash
 Add bookmarking of views (in data set panel?)
 Reusable legend component?
 Catalog data seems to be spending a fair amount of time in moment.js - why?  Shouldn't lazy eval cause it only to be called a couple of times?
 Add close button option to modal
 Allow default options provided w/Data Set (e.g. include a parameter for hash value and set it when user chooses that data set)
 Add a color scale panel or built-in color scale facility in advanced options
 Generate a Qizer automatically if color scale option/panel is present and pass to Draw function
 Qizer has function to return text color
 Allow overriding of "auto" min/max value for qizer (e.g. for when data is on a 1-5 scale but not all values necessarily present in a given data set)
 Color scale a built in component of Advanced Options panel?
 Optimization: Only call CatalogAddFilteredData if filters have changed (i.e. save previous filters) or if Data Set has changed
 Optimization: Implement RedrawOnResize (already set in visualization options) by saving previous window height and Redrawing if needed
 Optimization: As part of GenerateQizer, include a function in returned object to provide text color.  This currently happens in inner loop of table and can take seconds
 Optimization: See if square's crossfilter can be useful
 Table - Change Legend from check box to selectbox with options: Vertical, Horizontal, No Legend.
 Table - Mouseover a cell gives you the list of data points in that cell
 Table - Don't show completely blank rows/columns 
 Table - Hide Legend and don't apply colors if only one data cell is showing (i.e. if no splits)
 Table - Show titles on x/y axes so that it's clear what you're seeing even when exported as PNG
 Table - Option to grey-out cells that have a count < X
 Table - Min-width for cells not set correctly when only cell with a larger size is in the last row (i.e. col totals row)
 Table - Fix: Double check whether there's a bug using Percent of Row/Col with tiling
 Table - Fix: When there are blank header column headers, totals get displayed in the wrong order b/c for (var i in ColTotalArray) doesn't necessarily pull "" first
 Table - Allow sorting cols
 Mosaic - Legend?
 Mosaic - Cell spacing is weird; some borders appear dark and others do not (solvable by using 1px high div instead of border?)
 Mosaic - Option for percent axes along bottom and left (using svg & d3 axes?)
 Mosaic - Do we really save anything building on top of table?  Or should we just use PivotArray?
 Mosaic - Draw in white text when putting on dark background (i.e. dark cell color)
 Mosaic - Tooltip formatting weird when screen is scrolled left/down
 Mosaic - Will visibilitychange event or something like it allow hiding of tooltip when mouse leaves browser window?
 Correl - Draw circle outline around data when it is too close to the background color (or move back away from ColorBrewer colors)
 Correl - Clicking on i,j box in zoomed mode when tiled zooms in on the i,j box in the last drawn tile, regardless of which tile was clicked on
 Correl - Avoid redrawing uneeded boxes when zooming in (use an internal option set in Correl's Visualization variable to denote?)
 Correl - Axis tick labels!
 Correl - Axis labels when zoomed
*/

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
	GetPanel("DataSetPanel").Functions.UpdatePanelFromHash(HashObj[HashNum] === undefined? DefaultFileName : HashObj[HashNum]);
}

