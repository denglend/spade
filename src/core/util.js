/* globals document, window, Image,d3, unescape, ArrayBuffer, Uint8Array, Blob, webkitURL,URL,atob,DataView,picoModal, PivotSettings */

function DisplayModal(modal) {
	//modal.Header = header text
	//modal.Content = main content
	//modal.Type = defines content class ("Alert" or "Pre")
	//modal.afterCreate = afterCreate function
	var Header = modal.Header === undefined ? "" : modal.Header;
	var Type = modal.Type === undefined ? "Alert" : modal.Type;
	var Content = modal.Content;
	var TypeClasses = {Alert: "ModalAlertDiv",Pre: "ModalPreDiv",General:"ModalGeneralDiv"};
	var Class = Object.keys(TypeClasses).indexOf(Type) != -1 ? TypeClasses[Type] : "Alert";
	var Modal = picoModal("<div class='ModalHeaderDiv'>"+Header+"</div><div class='"+Class+"'>"+Content+"</div>");
	
	if (modal.afterCreate !== undefined) Modal.afterCreate(modal.afterCreate);
	Modal.afterClose(function(m) {m.destroy();});
	Modal.show();	
}

function ParseHash() {
	//Returns an object with attr:value set to all the items in the location.hash
	var ParsedObj = {};
	if (document.location.hash === "") return ParsedObj;
	document.location.hash.substr(1).split("&").forEach(function(el, i) {
		var Attr = el.split("=")[0];
		var Val = el.split("=")[1];
		ParsedObj[Attr] = decodeURIComponent(Val);
	});
	return ParsedObj;
}

function ParseURLParams() {
	//Returns an object with attr:value set to all the items in the location.search
	var ParsedObj = {};
	window.location.search.slice(1).split("&").forEach(function(el, i) {
		var Attr = el.split("=")[0];
		var Val = el.split("=")[1];
		ParsedObj[Attr] = decodeURIComponent(Val);
	});
	return ParsedObj;
}

function ObjectToHash(ParsedObj) {
	var HashString = "#";
	var Prefix = "";
	for (var key in ParsedObj) {
		HashString += Prefix;
		HashString += key;
		HashString += "=";
		HashString += encodeURIComponent(ParsedObj[key]);
		Prefix = "&";
	}
	return HashString;
}

function SVGToPNG(SVGHTML,width,height,callback) {
	//Converts SVG HTML into a PNG file
	
	var Canv = document.createElement('canvas');
	Canv.width = width;
	Canv.height = height;
	document.getElementsByTagName('body') [0].appendChild(Canv);
	var Context = Canv.getContext('2d');
	

	//var URL = 'data:image/svg+xml;base64,'+window.btoa(SVGHTML);
	var URL = 'data:image/svg+xml,'+SVGHTML;
	var Img = new Image();
	Img.width = width;
	Img.height = height;
	Img.onload = function() {
		Context.drawImage(Img,0,0); 
		window.open(Canv.toDataURL('image/png'));
	};
	Img.src = URL;
	
	//Render to canvas
	
}

function DownloadImageFile(FileName, Canvas) {
	var DataURL = Canvas.toDataURL();
	//DataURL = DataURL.replace(/^data:[a-z]*;/, 'data:application/octet-stream;');
	
	var blob = dataURItoBlob(DataURL);
	DownloadBlob(FileName,blob);
}

function DownloadTextFile(FileName,FileData) {
	var DataURL = 'data:application/csv;charset=utf-8,' + encodeURIComponent(FileData);
	var parts = DataURL.match(/data:([^;]*)(.*,)(.*)/);
	var binStr = unescape(parts[3]);

	//convert to binary in ArrayBuffer
	var buf = new ArrayBuffer(binStr.length);
	var view = new Uint8Array(buf);
	for(var i = 0; i < view.length; i++)
	  view[i] = binStr.charCodeAt(i);
	
	var blob = new Blob([view], {'type': parts[1]});
	
	DownloadBlob(FileName,blob);
}
function DownloadBlob(FileName,blob) {
	var DataURL = URL.createObjectURL(blob);

	var link = d3.select("body").append("a")
		.style("display","none")
		.attr("download",FileName)
		.attr("href",DataURL)
		.attr("target","_blank");

	link.node().click();
	link.node().parentNode.removeChild(link.node());
	
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var dw = new DataView(ab);
    for(var i = 0; i < byteString.length; i++) {
        dw.setUint8(i, byteString.charCodeAt(i));
    }

    // write the ArrayBuffer to a blob, and you're done
    return new Blob([ab], {type: mimeString});
}

function CreateSelectElement() {
	return CreateDomElement('<span class="custom-dropdown custom-dropdown--small custom-dropdown--white"><select class="custom-dropdown__select custom-dropdown__select--white"></select></span>');
}

function CreateDomElement(str) {
	var d = document.createElement('div');
	d.innerHTML = str;
	return d.firstChild;
}

function CalculateAxisTicks(RangeSize,TickCount) {
	

	var unroundedTickSize = RangeSize/(TickCount-1);
	var x = Math.ceil(Math.log10(unroundedTickSize)-1);
	var pow10x = Math.pow(10, x);
	var roundedTickRange = Math.ceil(unroundedTickSize / pow10x) * pow10x;
	return roundedTickRange;
}

function GetPanel(PanelName) {
	return MatchObjectInArray(PivotSettings.Panels,"name",PanelName);
}

function MatchObjectInArray(Array,Attribute,Value) {
	for (var i in Array) {
		if (Array[i][Attribute] == Value) return Array[i];
	}
	return {};
}

 Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
  };