
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

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"]}, ["blocking"]);
chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["<all_urls>"]}, ["responseHeaders"]);


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

	//Allow all within the same domain
	if(domain === referrer)
		return {requestHeaders: d.requestHeaders};

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

	//Allow empty referrer, we assume it is user entered requests
	if(filter == null && (referrer == undefined || referrer == ""))
		return {requestHeaders: d.requestHeaders};

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
			if(action.Referer == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "Cookie"){
			if(action.Cookie == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "User-Agent"){
			if(action.UserAgent == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			if(action.UserAgent == "simple")
				d.requestHeaders[i].value = userAgent;
			continue;
		}
		if(d.requestHeaders[i].name == "User-Agent"){
			if(action.UserAgent == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			if(action.UserAgent == "simple")
				d.requestHeaders[i].value = userAgent;
			if(action.UserAgent == "minimal")
				d.requestHeaders[i].value = "Mozilla/5.0";
			continue;
		}
		if(d.requestHeaders[i].name == "Accept"){
			if(action.Accept == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			if(action.Accept == "any")
				d.requestHeaders[i].value = "*/*";
			continue;
		}
		if(d.requestHeaders[i].name == "Accept-Encoding"){
			if(action.AcceptEncoding == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "Accept-Language"){
			if(action.AcceptLanguage == "remove"){
				d.requestHeaders.splice(i, 1);
				i--;
			}
			continue;
		}
		if(d.requestHeaders[i].name == "Accept-Charset"){
			if(action.AcceptCharset == "remove"){
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

