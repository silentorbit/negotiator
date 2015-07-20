
//Keep a few parameters to allow login to google accounts
var ua = navigator.userAgent;
var userAgent = ua.match(/^([^ ]*)/g) + " (X) " +
	(ua.match(/(AppleWebKit[^ ]*)/g) || "") + " (KHTML, like Gecko) " +
	(ua.match(/(Chrome[^ ]*)/g) || "");
userAgent = userAgent.replace("  ", " ");

//Requests without any matching filter
var TrackedRequests = {};

//Track filter for every chrome request
//Written in onBeforeSendHeaders and used/cleared in onHeadersReceived
var requestFilter = {};

//Track URL being blocked
//Written before redirecting and used/cleared in blocked.html
var blockReport = {};

//Cache of the current url for every tab
//Since retrieving the current URL of a tab is done asynchronously we store it here for faster access
var tabUrl = {};

//Cache requests and applied filters since the last page load
var tabRequests = {};
var tabFilters = {};

//Choices for random User-Agent
var uaPlatform = [ "Windows", "X11", "Macintosh" ];
//, "iPad", "iPhone" 
var uaArch = [ "Linux x86_64", "Linux i686", "Linux i586", "FreeBSD i386", "Intel Mac OS X 10.5", "Intel Mac OS X 10_5_8", "Intel Mac OS X 10_6_3", "PPC Mac OS X 10.5", "Windows NT 5.1", "Windows NT 5.2", "Windows NT 6.0", "Windows NT 6.1" ];
//, "CPU iPhone OS 3_2 like Mac OS X", "CPU OS 3_2 like Mac OS X" 
var uaLang = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "as", "av", "ae", "ay", "az", "bm", "ba", "eu", "be", "bn", "bh", "bi", "bjn", "bs", "br", "bg", "my", "ca", "ch", "ce", "ny", "zh", "cv", "kw", "co", "cr", "hr", "cs", "da", "day", "dv", "nl", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "de", "el", "gn", "gu", "ht", "ha", "he", "hz", "hi", "ho", "hu", "ia", "id", "ie", "ga", "ig", "ik", "io", "is", "it", "iu", "ja", "jv", "kl", "kn", "kr", "ks", "kk", "km", "ki", "rw", "ky", "kv", "kg", "ko", "ku", "kj", "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "gv", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mh", "mn", "na", "nv", "nb", "nd", "ne", "ng", "nn", "no", "ii", "nr", "oc", "oj", "cu", "om", "or", "os", "pa", "pi", "fa", "pl", "ps", "pt", "qu", "rm", "rn", "ro", "ru", "sa", "sc", "sd", "se", "sm", "sg", "sr", "gd", "sn", "si", "sk", "sl", "so", "st", "es", "su", "sw", "ss", "sv", "ta", "te", "tg", "th", "ti", "bo", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "cy", "wo", "fy", "xh", "yi", "yo", "za", "zu"];
//, "AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B314"
var uaEngine = [ "AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0", "AppleWebKit/533.16 (KHTML, like Gecko) Version/4.1", "AppleWebKit/533.4 (KHTML, like Gecko) Version/4.1", "AppleWebKit/531.22.7 (KHTML, like Gecko) Version/4.0.5 ", "AppleWebKit/528.16 (KHTML, like Gecko) Version/4.0 ", "Gecko/20100401", "Gecko/20121223", "Gecko/2008092313", "Gecko/20100614", "Gecko/20100625", "Gecko/20100403", "Gecko/20100401", "Gecko/20100404", "Gecko/20100401", "Gecko/20100101", "Gecko/20100115", "Gecko/20091215", "Gecko/20090612", "Gecko/20090624", "AppleWebKit/534.2 (KHTML, like Gecko)", "AppleWebKit/534.1 (KHTML, like Gecko)", "AppleWebKit/533.2 (KHTML, like Gecko)", "AppleWebKit/533.3 (KHTML, like Gecko)" ];
var uaBrowser = [ "Safari/533.16", "Safari/533.4", "Safari/533.3", "Safari/534.1", "Safari/534.2", "Safari/528.16", "Firefox/4.0 (.NET CLR 3.5.30729)", "Firefox/3.5", "Firefox/3.6", "Firefox/3.5", "Firefox/3.5.6", "Chrome/6.0.428.0", "Chrome/6.0.422.0", "Chrome/6.0", "Chrome/5.0.357.0" ];
var uaOS = [ "Fedora/3.5.9-2.fc12 Firefox/3.5.9", "Ubuntu/8.04 (hardy)", "Ubuntu/9.10 (karmic)", "Ubuntu/12.04", "Gentoo", "Ubuntu/10.04 (lucid)", "Fedora/3.6.3-4.fc13", "SUSE/3.6.3-1.1", "", "", "" ];

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["<all_urls>"]}, ["responseHeaders"]);

//Clear cache of tracked requests if no new ones are registerred for 5 minutes
var lastTracked = new Date();
setInterval(clearTracked, 10*1000);
function clearTracked() {
	var diff = new Date() - lastTracked;
	if(diff > 5*60*1000)
		TrackedRequests = {};
}

function getRandom (list) {
	var index = Math.floor(Math.random() * list.length);
	return list[index];
}

function getRandomUserAgent () {
	return "Mozilla/5.0 (" + getRandom (uaPlatform) + "; U; " + getRandom (uaArch) + "; " + getRandom (uaLang) + ") " + getRandom (uaEngine) + " " + getRandom (uaBrowser) + " " + getRandom (uaOS);
}


function getDomain(url){
	if(url == null)
		return null;
	var start = url.indexOf("://");
	if(start < 0) return url;
	start = start + 3; //Past http://
	var end = url.length;
	
	//not further than first "/"
	var pos = url.indexOf("/", start);
	if(pos > 0 && pos < end) end = pos;
	
	//Detect ipv6 address
	if(url[start] == "[")
	{
		//ipv6
		pos = url.indexOf("]", start);
		return url.substr(start, pos - start);
	}	
	//Strip port number
	pos = url.indexOf(":", start);
	if(pos > 0 && pos < end) end = pos;

	var domain = url.substr(start, end - start);

	//Remove leading www.
	if(ignoreWWW && domain.lastIndexOf("www.", 0) == 0)
		domain = domain.substring(4);

	if(domain == "")
		return null;
	return domain;
}

//Return true if d1 and d2 with only one dot is the same
function sameTLD(d1, d2){
	console.log("Same?: " + d1 + " -> " + d2);
	d1 = "." + d1;
	d2 = "." + d2;
	var p1, p2 = 0, p3 = d1.indexOf(".", 1);
	if(p3 < 0)
		return false; //no dots in domain
	while(true)
	{
		p1 = p2;
		p2 = p3;
		p3 = d1.indexOf(".", p3 + 1);
		if(p3 < 0)
			break; //found last dot
	}
	var topDomain = d1.substr(p1);
	if(d2.length < topDomain.length)
		return false;
	if(d2.indexOf(topDomain, d2.length - topDomain.length) === -1)
		return false;
	console.log("SAME");
	return true;
}

//Used to clean the path from the referer header
function getProtocolDomain(url){
	if(url == null)
		return null;
	var length = url.length;
	var start = url.indexOf("://");
	if(start < 0) return url;
	start = start + 3;
	var pos = url.indexOf("/", start);
	if(pos > 0 && pos < length) length = pos;
	pos = url.indexOf(":", start);
	if(pos > 0 && pos < length) length = pos;
	pos = url.indexOf("@", start);
	if(pos > 0 && pos < length) length = pos;
	
	return url.substr(0, length);
}

function onBeforeSendHeaders(d) {

	//Get domain for target and referrer
	var domain = getDomain(d.url);
	var referrer = null;
	//Get header
	var header = {};
	for(var i = 0; i < d.requestHeaders.length; i++){
		var h = d.requestHeaders[i];
		if(h.name == "Referer"){
			referrer = getDomain(h.value);
			break;
		}
	}

	//Clear requests and applied filters
	if(d.type == "main_frame" || tabRequests[d.tabId] == null)
	{
		tabRequests[d.tabId] = {};
		tabFilters[d.tabId] = [];
		tabUrl[d.tabId] = getDomain(d.url);
	}
	
	//for empty referer to non top frame targets, use the cached tab url
	if(referrer == null && d.type != "main_frame")
	{
		//This modified referrer is only used in filter matching it does not affect the request being sent
		referrer = tabUrl[d.tabId];
	}

	//Find matching filter
	var filter = null;
	var f = getFilter(referrer, domain);
	if(f != null)
	{
		if(alwaysPassSame && f.from == "" && actions[f.filter].block && (referrer == domain || referrer == null))
		{
			//Experimental feature, dangerous
			f = null;
		}
		else
			filter = f.filter;
	}
	
	//No matching filter
	if(f == null || f.track)
	{
		//Record attempt
		var reqKey = referrer + " " + domain;
		var req = TrackedRequests[reqKey];
		if(req == null)
		{
			req = {from: referrer, to: domain};
			TrackedRequests[reqKey] = req;
			lastTracked = new Date();
		}
		//Record attempt in tab
		if(tabRequests[d.tabId][reqKey] == null)
			tabRequests[d.tabId][reqKey] = req;
	}

	if(filter == null)
	{
		//Empty referrer, we assume it is user entered requests
		if(referrer == null && d.type == "main_frame")
			filter = defaultLocalAction;
		else if(domain === referrer) //Allow all within the same domain
			filter = defaultLocalAction;
		else if(sameTLD(referrer, domain))
			filter = defaultLocalTLDAction;
		else
			filter = defaultAction; //Load default
		
		//Don't block main_frame links
		if(filter == "block" && d.type == "main_frame")
			filter = defaultLocalAction;
		//Catch download/save as... requests
		if(filter == "block" && d.type == "other" && d.frameId == -1)
			filter = defaultLocalAction;
	}
	else
		tabFilters[d.tabId].push(f);

	//Get matching action
	var action = actions[filter];

	//Apply filters
	if(action.block == "true"){
		if(d.type == "main_frame"){
			blockReport[d.tabId] = d.url;
			chrome.browserAction.setIcon({
				tabId: d.tabId,
				path: {
					'19': 'images/red38.png',
					'38': 'images/red38.png'
				}
			});
		}
		return {cancel: true};
	}
	
	for(var i = 0; i < d.requestHeaders.length; i++){
		if(d.requestHeaders[i].name == "Referer"){
			if(action.referer == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			if(action.referer == "dest")
				d.requestHeaders[i].value = d.url;
			if(action.referer == "destclean")
				d.requestHeaders[i].value = getProtocolDomain(d.url);
			if(action.referer == "clean")
				d.requestHeaders[i].value = getProtocolDomain(d.requestHeaders[i].value);
			continue;
		}
		if(d.requestHeaders[i].name == "Cookie"){
			if(action.cookie == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "User-Agent"){
			if(action.agent == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			if(action.agent == "random")
				d.requestHeaders[i].value = getRandomUserAgent();
			if(action.agent == "simple")
				d.requestHeaders[i].value = userAgent;
			if(action.agent == "minimal")
				d.requestHeaders[i].value = "Mozilla/5.0";
			continue;
		}
		if(d.requestHeaders[i].name == "Accept"){
			if(action.accept == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			if(action.accept == "any")
				d.requestHeaders[i].value = "*/*";
			continue;
		}
		if(d.requestHeaders[i].name == "Accept-Encoding"){
			if(action.acceptencoding == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "Accept-Language"){
			if(action.acceptlanguage == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "Accept-Charset"){
			if(action.acceptcharset == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
	}
		
	//Save filter for onHeadersReceived below
	requestFilter[d.requestId] = filter;
	
	//Allow with modified headers
	return {requestHeaders: d.requestHeaders};
}


function onHeadersReceived(d){
	var f = requestFilter[d.requestId];
	delete requestFilter[d.requestId];

	var action = actions[f];
	if(action == null)
		return;
	if((action.csp == "pass" || action.csp == null) && action.Cookie == "pass")
		return;
	
	for(var i = 0; i < d.responseHeaders.length; i++)
	{
		var h = d.responseHeaders[i];
		switch(h.name.toLowerCase())
		{
		case "set-cookie":
			if(action.Cookie == "remove")
			{
				d.responseHeaders.splice(i, 1);
				i--;
			}
			continue;

		case "content-security-policy":
		case "content-security-policy-report-only":
			//Remove report-only
			h.name = "Content-Security-Policy";

			switch(action.csp)
			{
			case "force":
				continue;
			case "none":
				h.value = "default-src: 'none'";
				continue;
			case "self":
				h.value = "default-src: 'self'";
				continue;
			case "custom":
				h.value = action.customcsp;
				continue;
			}
			continue;
		}
	}

	return {requestHeaders: d.responseHeaders};
}
