"use strict";

//Here is all code that filters requests

//Requests without any matching filter
//Key: "referer domain"
var TrackedRequests = {} as { [index: string]: ITrackedRequest };

//Track filter for every chrome request
//Written in onBeforeSendHeaders and used/cleared in onHeadersReceived
//Value: Action key
var requestFilter = {} as { [tabID: string]: string };

//Track URL being blocked
//Written before redirecting and used/cleared in blocked.html
var blockReport: TabString = {};

//Cache of the current url for every tab
//Since retrieving the current URL of a tab is done asynchronously we store it here for faster access
var tabUrl: TabString = {};

//Cache requests and applied filters since the last page load
var tabRequests = {} as { [tabID: string]: TrackedRequestList };
var tabFilters: TabFilters = {};

//This one can redirect but since we can't get the referer here we can't be sure that we have the correct filter.
//chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"]}, ["blocking"]);

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, { urls: ["<all_urls>"] }, ["requestHeaders", "blocking"]);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, { urls: ["<all_urls>"] }, ["responseHeaders", "blocking"]);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
    chrome.pageAction.setPopup({
        tabId: tabId,
        popup: "popup.html?tabID=" + tabId + "&tabUrl=" + encodeURIComponent(tab.url)
    });
});

chrome.tabs.onActivated.addListener(function (info) {
    chrome.pageAction.show(info.tabId);
    chrome.pageAction.setPopup({
        tabId: info.tabId,
        popup: "popup.html?tabID=" + info.tabId
    });
});

function ClearTrackedRequests() {
    TrackedRequests = {};
    tabRequests = {};
    tabFilters = {};
}

//Clear cache of tracked requests if no new ones are registerred for 5 minutes
var lastTracked: Date = new Date();
setInterval(clearTracked, 10 * 1000);
function clearTracked() {
    var diff = new Date().valueOf() - lastTracked.valueOf();
    if (diff > 5 * 60 * 1000)
        TrackedRequests = {};
}

function getDomain(url: string) {
    if (url == null)
        return null;
    var start = url.indexOf("://");
    if (start < 0) return url;
    start = start + 3; //Past http://
    var end = url.length;

    //not further than first "/"
    var pos = url.indexOf("/", start);
    if (pos > 0 && pos < end) end = pos;

    //Detect ipv6 address
    if (url[start] == "[") {
        //ipv6
        pos = url.indexOf("]", start);
        return url.substr(start, pos - start);
    }
    //Strip port number
    pos = url.indexOf(":", start);
    if (pos > 0 && pos < end) end = pos;

    var domain = url.substr(start, end - start);

    //Remove leading www.
    if (settings.ignoreWWW && domain.lastIndexOf("www.", 0) == 0)
        domain = domain.substring(4);

    if (domain == "")
        return null;
    return domain;
}

//Return true if d1 and d2 with only one dot is the same
function sameTLD(d1: string, d2: string) {
    //console.log("Same?: " + d1 + " -> " + d2);
    d1 = "." + d1;
    d2 = "." + d2;
    var p1, p2 = 0, p3 = d1.indexOf(".", 1);
    if (p3 < 0)
        return false; //no dots in domain
    while (true) {
        p1 = p2;
        p2 = p3;
        p3 = d1.indexOf(".", p3 + 1);
        if (p3 < 0)
            break; //found last dot
    }
    var topDomain = d1.substr(p1);
    if (d2.length < topDomain.length)
        return false;
    if (d2.indexOf(topDomain, d2.length - topDomain.length) === -1)
        return false;
    //console.log("SAME");
    return true;
}

//Used to clean the path from the referer header
function getProtocolDomain(url: string) {
    if (url == null)
        return null;
    var length = url.length;
    var start = url.indexOf("://");
    if (start < 0) return url;
    start = start + 3;
    var pos = url.indexOf("/", start);
    if (pos > 0 && pos < length) length = pos;
    pos = url.indexOf(":", start);
    if (pos > 0 && pos < length) length = pos;
    pos = url.indexOf("@", start);
    if (pos > 0 && pos < length) length = pos;

    return url.substr(0, length);
}

function onBeforeSendHeaders(d: chrome.webRequest.WebRequestHeadersDetails) {
    //Get domain for target and referrer
    var domain = getDomain(d.url);
    var referrer = null;
    //Get header
    var header = {};
    for (var i = 0; i < d.requestHeaders.length; i++) {
        var h = d.requestHeaders[i];
        if (h.name == "Referer") {
            referrer = getDomain(h.value);
            break;
        }
    }

    //Clear requests and applied filters
    if (d.type == "main_frame" || tabRequests[d.tabId] == null) {
        tabRequests[d.tabId] = {};
        tabFilters[d.tabId] = [];
        tabUrl[d.tabId] = getDomain(d.url);
        //chrome.browserAction.setBadgeText({ text: "" });
    }

    //for empty referer to non top frame targets, use the cached tab url
    if (referrer == null && d.type != "main_frame") {
        //This modified referrer is only used in filter matching it does not affect the request being sent
        referrer = tabUrl[d.tabId];
    }

    //Find matching filter
    var filter = null;
    var f = getFilter(referrer, domain);
    if (f != null)
        filter = f.filter;

    //No matching filter
    if (f == null || f.track) {
        //Record attempt
        var reqKey = referrer + " " + domain;
        var req = TrackedRequests[reqKey];
        if (req == null) {
            req = { from: referrer, to: domain, track: f != null && f.track || false };
            TrackedRequests[reqKey] = req;
            lastTracked = new Date();
        }
        //Record attempt in tab
        var tr = tabRequests[d.tabId];
        tr[reqKey] = req;

        if (settings.countIndicator == "unfiltered") {
            //chrome.browserAction.setBadgeText({ text: "" + Object.keys(tr).length, tabId: d.tabId });
            //chrome.browserAction.setBadgeBackgroundColor({ color: "#000", tabId: d.tabId });
        }
        else {
            //chrome.browserAction.setBadgeText({ text: "" });
        }
    }

    if (filter == null) {
        //Empty referrer, we assume it is user entered requests
        if (referrer == null && d.type == "main_frame")
            filter = settings.defaultLocalAction;
        else if (domain === referrer) //Allow all within the same domain
            filter = settings.defaultLocalAction;
        else if (sameTLD(referrer, domain))
            filter = settings.defaultLocalTLDAction;
        else
            filter = settings.defaultAction; //Load default

        //Don"t block main_frame links
        if (filter == "block" && d.type == "main_frame")
            filter = settings.defaultLocalAction;
        //Catch download/save as... requests
        if (filter == "block" && d.type == "other" && d.frameId == -1)
            filter = settings.defaultLocalAction;
    }
    else
        tabFilters[d.tabId].push(f);

    //Save filter for onHeadersReceived below
    requestFilter[d.requestId] = filter;

    //Get matching action
    var action = actions[filter];

    if (action == null || action.request == null) {
        logError("missing action for filter: " + filter + ": " + JSON.stringify(f, null, "\t"));
        return { requestHeaders: d.requestHeaders }; //No use in running the filters
    }

    //Apply filters
    if (action.block == "true") {
        if (d.type == "main_frame") {
            blockReport[d.tabId] = d.url;
            //chrome.browserAction.setIcon({
            chrome.pageAction.setIcon({
                tabId: d.tabId,
                path: {
                    "19": "images/red38.png",
                    "38": "images/red38.png"
                }
            });
        }
        //Only cancel is possible here, no redirectUrl
        return { cancel: true };
    }

    var alreadyAdded = {} as { [key: string]: boolean };

    for (var i = 0; i < d.requestHeaders.length; i++) {
        let header = d.requestHeaders[i];
        var headerName = header.name.toLowerCase();
        alreadyAdded[header.name] = true;

        var headerAction = action.request[headerName];
        if (headerAction == null) {
            //Find with + prefix, remove if found
            headerAction = action.request["+" + header.name.toLowerCase()];
            if (headerAction != null) {
                d.requestHeaders.splice(i, 1);
                i--;
            }
            continue;
        }

        switch (headerAction) {
            case "":
            case "remove":
                d.requestHeaders.splice(i, 1);
                i--;
                break;

            case "dest":
                header.value = d.url;
                break;

            case "destclean":
                header.value = getProtocolDomain(d.url);
                break;

            case "clean":
                header.value = getProtocolDomain(header.value);
                break;

            case "random":
                header.value = getRandomUserAgent();
                break;

            case "simple":
                header.value = userAgent;
                break;

            case "pass":
                break;

            default:
                d.requestHeaders[i].value = headerAction;
                continue;
        }
    }

    //Insert add headers, those with + prefix
    for (let h in action.request) {
        if (h[0] != "+")
            continue;
        var headerName = h.substring(1);
        if (alreadyAdded[headerName])
            continue;

        var headerAction = action.request[h];
        switch (headerAction) {
            case "":
            case "remove":
            case "pass":
                //doesn't make any sense, but just in case so we don't add the header value "remove", or "pass"
                break;

            case "dest":
                d.requestHeaders.push({ name: headerName, value: d.url });
                break;

            case "destclean":
                d.requestHeaders.push({ name: headerName, value: getProtocolDomain(d.url) });
                break;

            case "random":
                d.requestHeaders.push({ name: headerName, value: getRandomUserAgent() });
                break;

            case "simple":
                d.requestHeaders.push({ name: headerName, value: userAgent });
                break;

            default:
                d.requestHeaders.push({ name: headerName, value: headerAction });
                continue;
        }
    }

    //Allow with modified headers
    return { requestHeaders: d.requestHeaders };
}

function onHeadersReceived(d: chrome.webRequest.WebResponseHeadersDetails) {
    var f = requestFilter[d.requestId];
    delete requestFilter[d.requestId];

    var action = actions[f];
    if (action == null || action.response == null)
        return { responseHeaders: d.responseHeaders };

    var alreadyAdded: any = {};

    for (var i = 0; i < d.responseHeaders.length; i++) {
        var header = d.responseHeaders[i];
        var headerName = header.name.toLowerCase();
        alreadyAdded[headerName] = true;

        var headerAction = action.response[headerName];
        if (headerAction == null) {
            //Find with + prefix, remove if found
            headerAction = action.response["+" + headerName];
            if (headerAction != null) {
                d.responseHeaders.splice(i, 1);
                i--;
            }
            continue;
        }

        switch (headerAction) {
            case "pass":
                break;

            case "remove":
                d.responseHeaders.splice(i, 1);
                i--;
                break;

            case "force-csp":
                if (headerName == "content-security-policy-report")
                    header.name = "Content-Security-Policy";
                break;

            default:
                header.value = headerAction;
                break;
        }
    }
    //Insert add headers, those with + prefix
    for (var h in action.response) {
        if (h[0] != "+")
            continue;
        let headerName = h.substring(1);
        if (alreadyAdded[headerName])
            continue;

        var headerAction = action.response[h];
        switch (headerAction) {
            case "":
            case "remove":
            case "pass":
            case "force-csp":
                //doesn't make any sense, but just in case so we don't add the header value "remove", or "pass"
                break;

            default:
                d.responseHeaders.push({ name: headerName, value: headerAction });
                continue;
        }
    }

    return { responseHeaders: d.responseHeaders };
}
