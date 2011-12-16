
var blocked = 0;

//Flash the icon and increase the block count
function addOne()
{
	blocked++;
	chrome.browserAction.setBadgeText({text: '' + blocked});
	chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,255]});
	chrome.browserAction.setIcon({path: "images/red.png"});
	setTimeout(function(){
		chrome.browserAction.setIcon({path: "images/green.png"});
	}, 100);
}

var Agent = "Mozilla/5.0";

//Non blocked requests
var TrackedRequests = {};

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"]}, ["blocking"]);

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
	{
		addOne();
		return {cancel: true};
	}
}

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);

function onBeforeSendHeaders(d) {

	//Get header
	var header = {};
	for(var i in d.requestHeaders)
	{
		var h = d.requestHeaders[i];
		if(h.name == "User-Agent")
			header.UserAgent = h;
		if(h.name == "Referer")
			header.Referer = h;
	}

	//Set User-Agent
	header.UserAgent.value = Agent;

	//Get domain for target and referrer
	var domain = getDomain(d.url);
	var referrer;
	if(header.Referer != undefined)
		referrer = getDomain(header.Referer.value);

	//Allow all within the same domain
	if(domain === referrer)
		return;

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
		return;

	//Find existing match
	if(filter == "block")
	{
		addOne();
		return {cancel: true};
	}
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

//Track filter for every chrome request
var requestFilter = {};

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["<all_urls>"]}, ["responseHeaders"]);

function onHeadersReceived(d){
	var f = requestFilter[d.requestId];

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

