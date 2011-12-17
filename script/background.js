

//Requests without any matching filter
var TrackedRequests = {};

//Track filter for every chrome request
//Written in onBeforeSendHeaders and used in onHeadersReceived
var requestFilter = {};

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"]}, ["blocking"]);
chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["<all_urls>"]}, ["responseHeaders"]);

function onBeforeRequest(d) {
	var domain = getDomain(d.url);
	
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

	if(testDomainFilter(domain) == "block")
		return {cancel: true};
}


function onBeforeSendHeaders(d) {

	//Get domain for target and referrer
	var domain = getDomain(d.url);
	var referrer;
	//Get header
	var header = {};
	for(var i = 0; i < d.requestHeaders.length; i++){
		var h = d.requestHeaders[i];
		if(h.name == "Referer")
			referrer = getDomain(h.value);
		if(h.name == "User-Agent")
			h.value = "Mozilla/5.0";
		if(h.name == "Accept")
			h.value = "*/*";
//		if(h.name == "Accept-Encoding")
//			h.value = "gzip,deflate,sdch";
		if(h.name == "Accept-Language"){
			d.requestHeaders.splice(i, 1);
			i--;
			continue;
		}
		if(h.name == "Accept-Charset"){
			d.requestHeaders.splice(i, 1);
			i--;
			continue;
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
			req = {from: referrer, to: domain, block: false};
			TrackedRequests[reqKey] = req;
		}
	}

	//Allow empty referrer, we assume it is user entered requests
	if(referrer == undefined || referrer == "")
		return {requestHeaders: d.requestHeaders};

	//Load default
	if(filter == null)
		filter = defaultFilter;

	//Find existing match
	if(filter == "block")
		return {cancel: true};
	if(filter == "clear"){
		for(var i = 0; i < d.requestHeaders.length; i++){
			if(d.requestHeaders[i].name == "Referer"){
				d.requestHeaders.splice(i, 1);
				i--;
				continue;
			}
			if(d.requestHeaders[i].name == "Cookie"){
				d.requestHeaders.splice(i, 1);
				i--;
				continue;
			}
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

	if(f == "clear"){
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

