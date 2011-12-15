var active = false;
browserActionClicked(); //Activate

chrome.browserAction.onClicked.addListener(browserActionClicked);

function browserActionClicked(tab) {
	active = !active;
	if(active)
	{
		chrome.browserAction.setIcon({path: "green.png"});
		chrome.browserAction.setBadgeText({text: ""});
		chrome.browserAction.setBadgeBackgroundColor({color: [0,192,0,255]});
		//does not appear to work
		//chrome.experimental.privacy.websites.thirdPartyCookiesAllowed = false;
	}
	else
	{
		blocked = 0;
		chrome.browserAction.setIcon({path: "gray.png"});
		chrome.browserAction.setBadgeText({text: "off"});
		chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,255]});
	}
}


var blocked = 0;

function addOne()
{
	blocked++;
	chrome.browserAction.setBadgeText({text: ''+blocked});
	chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,255]});
	chrome.browserAction.setIcon({path: "red.png"});
	setTimeout(function(){
		chrome.browserAction.setIcon({path: "green.png"});
	}, 100);
}


chrome.experimental.webRequest.onBeforeRequest.addListener(onBeforeRequest,{},["blocking"]);

function onBeforeRequest(r) {
	if(active != true)
		return;
	var redirect = chrome.extension.getURL("/blocked.html");
	if(r.url.indexOf(redirect) == 0)
		return;

	//Skip google result click tracking
	if(r.url.indexOf("google.com/url") != -1)
	{
		var re = /url=([^&]*)/g;
		var p = re.exec(r.url);
		p = decodeURIComponent(p[1]);

		console.log("Redirecting: " + JSON.stringify(r, null, "	"));

		//chrome.tabs.executeScript(r.tabId, {code: "history.back();"});
		chrome.tabs.update(r.tabId, {url: p});
		return {cancel: true};
		//return {redirectUrl: p};
	}

	//Get domain
	var domain = r.url.split("://")[1].split("/")[0];
	var pos = domain.indexOf("@");
	if(pos != -1) domain = domain.substr(pos + 1);
	pos = domain.indexOf(":");
	if(pos != -1) domain = domain.substr(0, pos);
	//domain == full hostname

	for(var i in blockedDomains)
	{
		//TODO: optimize a list for top domains.
		if(endsWith(domain, blockedDomains[i]))
		{
			addOne();
			return {cancel: true};
		}
	}
}

//TODO: Block if accessed as third party site
var blocedThirdParties = [
	"twitter.com",
	"linkedin.com",
	"stumble-upon.com",
	"slashdot.org",
	"facebook.net",
	"plusone.google.com",
	"gravatar.com",
	"disqus.com"];

//TODO: ClickTracking
/*
	"bit.ly",
	"feedburner.com",
	"adf.ly",
	"",
	"",
	"",
	"",
*/
	

function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var Agent = "Mozilla/5.0";

chrome.experimental.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {}, ["blocking", "requestHeaders"]);

function onBeforeSendHeaders(d) {
	if(active != true)
		return;
	for(var i in d.requestHeaders)
	{
		var h = d.requestHeaders[i];
		if(h.name == "User-Agent")
		{
			h.value = Agent;
			break;
		}
	}
	return {requestHeaders: d.requestHeaders};
}
