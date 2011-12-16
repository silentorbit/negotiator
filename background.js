
var blocked = 0;

//Domains blocked by the user
var userBlocked = JSON.parse(localStorage.getItem("userBlocked"));
if(userBlocked == null)
	userBlocked = {};

function BlockTarget(domain)
{
	userBlocked[domain] = true;
	localStorage.userBlocked = JSON.stringify(userBlocked);
}

function addOne()
{
	blocked++;
	chrome.browserAction.setBadgeText({text: '' + blocked});
	chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,255]});
	chrome.browserAction.setIcon({path: "red.png"});
	setTimeout(function(){
		chrome.browserAction.setIcon({path: "green.png"});
	}, 100);
}

var Agent = "Mozilla/5.0";

//Non blocked requests
var Requests = {};

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

	for(var i in blockedDomains)
	{
		//TODO: optimize with a list for top domains.
		if(endsWith(domain, blockedDomains[i]))
		{
			addOne();
			return {cancel: true};
		}
	}
	if(userBlocked[domain] === true)
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


	//Record attempt
	var reqKey = referrer + " " + domain;
	var req = Requests[reqKey];
	if(req === undefined)
	{
		req = {from: referrer, to: domain, block: false};
		Requests[reqKey] = req;
	}

	//Allow empty referrer, we assume it is user entered requests
	if(referrer == undefined || referrer == "")
		return;

	//Find existing match
	if(req.block)
	{
		addOne();
		return {cancel: true};
	}
	
	//Allow with modified headers
	return {requestHeaders: d.requestHeaders};
}
