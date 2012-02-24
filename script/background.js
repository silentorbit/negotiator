
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

//Choices for random User-Agent
var uaPlatform = [ "Windows", "X11", "Macintosh" ];
//, "iPad", "iPhone" 
var uaArch = [ "Linux x86_64", "Linux i686", "Linux i586", "FreeBSD i386", "Intel Mac OS X 10.5", "Intel Mac OS X 10_5_8", "Intel Mac OS X 10_6_3", "PPC Mac OS X 10.5", "Windows NT 5.1", "Windows NT 5.2", "Windows NT 6.0", "Windows NT 6.1" ];
//, "CPU iPhone OS 3_2 like Mac OS X", "CPU OS 3_2 like Mac OS X" 
var uaLang = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "as", "av", "ae", "ay", "az", "bm", "ba", "eu", "be", "bn", "bh", "bi", "bjn", "bs", "br", "bg", "my", "ca", "ch", "ce", "ny", "zh", "cv", "kw", "co", "cr", "hr", "cs", "da", "day", "dv", "nl", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "de", "el", "gn", "gu", "ht", "ha", "he", "hz", "hi", "ho", "hu", "ia", "id", "ie", "ga", "ig", "ik", "io", "is", "it", "iu", "ja", "jv", "kl", "kn", "kr", "ks", "kk", "km", "ki", "rw", "ky", "kv", "kg", "ko", "ku", "kj", "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "gv", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mh", "mn", "na", "nv", "nb", "nd", "ne", "ng", "nn", "no", "ii", "nr", "oc", "oj", "cu", "om", "or", "os", "pa", "pi", "fa", "pl", "ps", "pt", "qu", "rm", "rn", "ro", "ru", "sa", "sc", "sd", "se", "sm", "sg", "sr", "gd", "sn", "si", "sk", "sl", "so", "st", "es", "su", "sw", "ss", "sv", "ta", "te", "tg", "th", "ti", "bo", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "cy", "wo", "fy", "xh", "yi", "yo", "za", "zu"];
//, "AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B314"
var uaEngine = [ "AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0", "AppleWebKit/533.16 (KHTML, like Gecko) Version/4.1", "AppleWebKit/533.4 (KHTML, like Gecko) Version/4.1", "AppleWebKit/531.22.7 (KHTML, like Gecko) Version/4.0.5 ", "AppleWebKit/528.16 (KHTML, like Gecko) Version/4.0 ", "Gecko/20100401", "Gecko/20121223", "Gecko/2008092313", "Gecko/20100614", "Gecko/20100625", "Gecko/20100403", "Gecko/20100401", "Gecko/20100404", "Gecko/20100401", "Gecko/20100101", "Gecko/20100115", "Gecko/20091215", "Gecko/20090612", "Gecko/20090624", "AppleWebKit/534.2 (KHTML, like Gecko)", "AppleWebKit/534.1 (KHTML, like Gecko)", "AppleWebKit/533.2 (KHTML, like Gecko)", "AppleWebKit/533.3 (KHTML, like Gecko)" ];
var uaBrowser = [ "Safari/533.16", "Safari/533.4", "Safari/533.3", "Safari/534.1", "Safari/534.2", "Safari/528.16", "Firefox/4.0 (.NET CLR 3.5.30729)", "Firefox/3.5", "Firefox/3.6", "Firefox/3.5", "Firefox/3.5.6", "Chrome/6.0.428.0", "Chrome/6.0.422.0", "Chrome/6.0", "Chrome/5.0.357.0" ];
var uaOS = [ "Fedora/3.5.9-2.fc12 Firefox/3.5.9", "Ubuntu/8.04 (hardy)", "Ubuntu/9.10 (karmic)", "Gentoo", "Ubuntu/9.25 (jaunty)", "Ubuntu/10.04 (lucid)", "Fedora/3.6.3-4.fc13", "SUSE/3.6.3-1.1", "", "", "" ];
		

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"]}, ["blocking"]);
chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["<all_urls>"]}, ["responseHeaders"]);

function getRandom (list) {
	var index = Math.floor(Math.random() * list.length);
	return list[index];
}

function getRandomUserAgent () {
	return "Mozilla/5.0 (" + getRandom (uaPlatform) + "; U; " + getRandom (uaArch) + "; " + getRandom (uaLang) + ") " + getRandom (uaEngine) + " " + getRandom (uaBrowser) + " " + getRandom (uaOS);
}


function getDomain(url){
	if(url === undefined)
		return "";
	var domain = url.split("://");
	if(domain.length > 1)
		domain = domain[1];
	else
		domain = domain[0];	
	domain = domain.split("/")[0];
	var pos = domain.indexOf("@");
	if(pos != -1) domain = domain.substr(pos + 1);
	pos = domain.indexOf(":");
	if(pos != -1) domain = domain.substr(0, pos);

	//Remove leading www.
	if(ignoreWWW && domain.lastIndexOf("www.", 0) == 0)
		domain = domain.substring(4);

	return domain;
}


function onBeforeRequest(d) {
	//Skip google result click tracking
	if(d.url.indexOf("google.com/url") != -1)
	{
		var re = /url=([^&]*)/g;
		var p = re.exec(d.url);
		p = decodeURIComponent(p[1]);

		console.log("Skipping Google clicktrack: " + p);

		chrome.tabs.update(d.tabId, {url: p});
		return {cancel: true};
	}
}


function onBeforeSendHeaders(d) {

	//Get domain for target and referrer
	var domain = getDomain(d.url);
	var referrer;
	//Get header
	var header = {};
	for(var i = 0; i < d.requestHeaders.length; i++){
		var h = d.requestHeaders[i];
		if(h.name == "Referer"){
			referrer = getDomain(h.value);
			break;
		}
	}

	//Find matching filter
	var filter = testFilter(referrer, domain)

	if(filter == null)
	{
		//Record attempt
		var reqKey = referrer + " " + domain;
		var req = TrackedRequests[reqKey];
		if(req == undefined)
		{
			req = {from: referrer, to: domain};
			TrackedRequests[reqKey] = req;
		}
	}

	//No matching filter
	if(filter == null) {
		//Empty referrer, we assume it is user entered requests
		if((referrer == undefined || referrer == ""))
			filter = defaultLocalAction;
		//Allow all within the same domain
		if(domain === referrer)
			filter = defaultLocalAction;
	}

	//Load default
	if(filter == null){
		filter = defaultAction;

		//Don't block main_frame links
		if(filter == "block" && d.type == "main_frame")
			filter = "clear";
	}

	//Get matching action
	var action = actions[filter];

	//Apply filters
	if(action.block == "true"){
		if(d.type == "main_frame"){
			blockReport[d.tabId] = d.url;
			chrome.browserAction.setIcon({
				tabId: d.tabId,
				path: 'images/red.png'
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
	if(action == undefined)
		return;

	if(action.Cookie == "remove"){
		for(var i = 0; i < d.responseHeaders.length; i++){
			if(d.responseHeaders[i].name == "Set-Cookie"){
				d.responseHeaders.splice(i, 1);
				i--;
				continue;
			}
		}
	}

	return {requestHeaders: d.responseHeaders};
}

