"use strict";
var ua = navigator.userAgent;
var userAgent = ua.match(/^([^ ]*)/g) + " (X) " +
    (ua.match(/(AppleWebKit[^ ]*)/g) || "") + " (KHTML, like Gecko) " +
    (ua.match(/(Chrome[^ ]*)/g) || "");
userAgent = userAgent.replace("  ", " ");
var TrackedRequests = {};
var requestFilter = {};
var blockReport = {};
var tabUrl = {};
var tabRequests = {};
var tabFilters = {};
var uaPlatform = ["Windows", "X11", "Macintosh"];
var uaArch = ["Linux x86_64", "Linux i686", "Linux i586", "FreeBSD i386", "Intel Mac OS X 10.5", "Intel Mac OS X 10_5_8", "Intel Mac OS X 10_6_3", "PPC Mac OS X 10.5", "Windows NT 5.1", "Windows NT 5.2", "Windows NT 6.0", "Windows NT 6.1"];
var uaLang = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "as", "av", "ae", "ay", "az", "bm", "ba", "eu", "be", "bn", "bh", "bi", "bjn", "bs", "br", "bg", "my", "ca", "ch", "ce", "ny", "zh", "cv", "kw", "co", "cr", "hr", "cs", "da", "day", "dv", "nl", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "de", "el", "gn", "gu", "ht", "ha", "he", "hz", "hi", "ho", "hu", "ia", "id", "ie", "ga", "ig", "ik", "io", "is", "it", "iu", "ja", "jv", "kl", "kn", "kr", "ks", "kk", "km", "ki", "rw", "ky", "kv", "kg", "ko", "ku", "kj", "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "gv", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mh", "mn", "na", "nv", "nb", "nd", "ne", "ng", "nn", "no", "ii", "nr", "oc", "oj", "cu", "om", "or", "os", "pa", "pi", "fa", "pl", "ps", "pt", "qu", "rm", "rn", "ro", "ru", "sa", "sc", "sd", "se", "sm", "sg", "sr", "gd", "sn", "si", "sk", "sl", "so", "st", "es", "su", "sw", "ss", "sv", "ta", "te", "tg", "th", "ti", "bo", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "cy", "wo", "fy", "xh", "yi", "yo", "za", "zu"];
var uaEngine = ["AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0", "AppleWebKit/533.16 (KHTML, like Gecko) Version/4.1", "AppleWebKit/533.4 (KHTML, like Gecko) Version/4.1", "AppleWebKit/531.22.7 (KHTML, like Gecko) Version/4.0.5 ", "AppleWebKit/528.16 (KHTML, like Gecko) Version/4.0 ", "Gecko/20100401", "Gecko/20121223", "Gecko/2008092313", "Gecko/20100614", "Gecko/20100625", "Gecko/20100403", "Gecko/20100401", "Gecko/20100404", "Gecko/20100401", "Gecko/20100101", "Gecko/20100115", "Gecko/20091215", "Gecko/20090612", "Gecko/20090624", "AppleWebKit/534.2 (KHTML, like Gecko)", "AppleWebKit/534.1 (KHTML, like Gecko)", "AppleWebKit/533.2 (KHTML, like Gecko)", "AppleWebKit/533.3 (KHTML, like Gecko)"];
var uaBrowser = ["Safari/533.16", "Safari/533.4", "Safari/533.3", "Safari/534.1", "Safari/534.2", "Safari/528.16", "Firefox/4.0 (.NET CLR 3.5.30729)", "Firefox/3.5", "Firefox/3.6", "Firefox/3.5", "Firefox/3.5.6", "Chrome/6.0.428.0", "Chrome/6.0.422.0", "Chrome/6.0", "Chrome/5.0.357.0"];
var uaOS = ["Fedora/3.5.9-2.fc12 Firefox/3.5.9", "Ubuntu/8.04 (hardy)", "Ubuntu/9.10 (karmic)", "Ubuntu/12.04", "Gentoo", "Ubuntu/10.04 (lucid)", "Fedora/3.6.3-4.fc13", "SUSE/3.6.3-1.1", "", "", ""];
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
var lastTracked = new Date();
setInterval(clearTracked, 10 * 1000);
function clearTracked() {
    var diff = new Date().valueOf() - lastTracked.valueOf();
    if (diff > 5 * 60 * 1000)
        TrackedRequests = {};
}
function getRandom(list) {
    var index = Math.floor(Math.random() * list.length);
    return list[index];
}
function getRandomUserAgent() {
    return "Mozilla/5.0 (" + getRandom(uaPlatform) + "; U; " + getRandom(uaArch) + "; " + getRandom(uaLang) + ") " + getRandom(uaEngine) + " " + getRandom(uaBrowser) + " " + getRandom(uaOS);
}
function getDomain(url) {
    if (url == null)
        return null;
    var start = url.indexOf("://");
    if (start < 0)
        return url;
    start = start + 3;
    var end = url.length;
    var pos = url.indexOf("/", start);
    if (pos > 0 && pos < end)
        end = pos;
    if (url[start] == "[") {
        pos = url.indexOf("]", start);
        return url.substr(start, pos - start);
    }
    pos = url.indexOf(":", start);
    if (pos > 0 && pos < end)
        end = pos;
    var domain = url.substr(start, end - start);
    if (settings.ignoreWWW && domain.lastIndexOf("www.", 0) == 0)
        domain = domain.substring(4);
    if (domain == "")
        return null;
    return domain;
}
function sameTLD(d1, d2) {
    d1 = "." + d1;
    d2 = "." + d2;
    var p1, p2 = 0, p3 = d1.indexOf(".", 1);
    if (p3 < 0)
        return false;
    while (true) {
        p1 = p2;
        p2 = p3;
        p3 = d1.indexOf(".", p3 + 1);
        if (p3 < 0)
            break;
    }
    var topDomain = d1.substr(p1);
    if (d2.length < topDomain.length)
        return false;
    if (d2.indexOf(topDomain, d2.length - topDomain.length) === -1)
        return false;
    return true;
}
function getProtocolDomain(url) {
    if (url == null)
        return null;
    var length = url.length;
    var start = url.indexOf("://");
    if (start < 0)
        return url;
    start = start + 3;
    var pos = url.indexOf("/", start);
    if (pos > 0 && pos < length)
        length = pos;
    pos = url.indexOf(":", start);
    if (pos > 0 && pos < length)
        length = pos;
    pos = url.indexOf("@", start);
    if (pos > 0 && pos < length)
        length = pos;
    return url.substr(0, length);
}
function onBeforeSendHeaders(d) {
    var domain = getDomain(d.url);
    var referrer = null;
    var header = {};
    for (var i = 0; i < d.requestHeaders.length; i++) {
        var h = d.requestHeaders[i];
        if (h.name == "Referer") {
            referrer = getDomain(h.value);
            break;
        }
    }
    if (d.type == "main_frame" || tabRequests[d.tabId] == null) {
        tabRequests[d.tabId] = {};
        tabFilters[d.tabId] = [];
        tabUrl[d.tabId] = getDomain(d.url);
    }
    if (referrer == null && d.type != "main_frame") {
        referrer = tabUrl[d.tabId];
    }
    var filter = null;
    var f = getFilter(referrer, domain);
    if (f != null)
        filter = f.filter;
    if (f == null || f.track) {
        var reqKey = referrer + " " + domain;
        var req = TrackedRequests[reqKey];
        if (req == null) {
            req = { from: referrer, to: domain, track: f != null && f.track || false };
            TrackedRequests[reqKey] = req;
            lastTracked = new Date();
        }
        var tr = tabRequests[d.tabId];
        tr[reqKey] = req;
        if (settings.countIndicator == "unfiltered") {
        }
        else {
        }
    }
    if (filter == null) {
        if (referrer == null && d.type == "main_frame")
            filter = settings.defaultLocalAction;
        else if (domain === referrer)
            filter = settings.defaultLocalAction;
        else if (sameTLD(referrer, domain))
            filter = settings.defaultLocalTLDAction;
        else
            filter = settings.defaultAction;
        if (filter == "block" && d.type == "main_frame")
            filter = settings.defaultLocalAction;
        if (filter == "block" && d.type == "other" && d.frameId == -1)
            filter = settings.defaultLocalAction;
    }
    else
        tabFilters[d.tabId].push(f);
    requestFilter[d.requestId] = filter;
    var action = actions[filter];
    if (action == null || action.request == null) {
        logError("missing action for filter: " + filter + ": " + JSON.stringify(f, null, "\t"));
        return { requestHeaders: d.requestHeaders };
    }
    if (action.block == "true") {
        if (d.type == "main_frame") {
            blockReport[d.tabId] = d.url;
            chrome.pageAction.setIcon({
                tabId: d.tabId,
                path: {
                    "19": "images/red38.png",
                    "38": "images/red38.png"
                }
            });
        }
        return { cancel: true };
    }
    var alreadyAdded = {};
    for (var i = 0; i < d.requestHeaders.length; i++) {
        var header_1 = d.requestHeaders[i];
        var headerName = header_1.name.toLowerCase();
        alreadyAdded[header_1.name] = true;
        var headerAction = action.request[headerName];
        if (headerAction == null) {
            headerAction = action.request["+" + header_1.name.toLowerCase()];
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
                header_1.value = d.url;
                break;
            case "destclean":
                header_1.value = getProtocolDomain(d.url);
                break;
            case "clean":
                header_1.value = getProtocolDomain(header_1.value);
                break;
            case "random":
                header_1.value = getRandomUserAgent();
                break;
            case "simple":
                header_1.value = userAgent;
                break;
            case "pass":
                break;
            default:
                d.requestHeaders[i].value = headerAction;
                continue;
        }
    }
    for (var h_1 in action.request) {
        if (h_1[0] != "+")
            continue;
        var headerName = h_1.substring(1);
        if (alreadyAdded[headerName])
            continue;
        var headerAction = action.request[h_1];
        switch (headerAction) {
            case "":
            case "remove":
            case "pass":
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
    return { requestHeaders: d.requestHeaders };
}
function onHeadersReceived(d) {
    var f = requestFilter[d.requestId];
    delete requestFilter[d.requestId];
    var action = actions[f];
    if (action == null || action.response == null)
        return { responseHeaders: d.responseHeaders };
    var alreadyAdded = {};
    for (var i = 0; i < d.responseHeaders.length; i++) {
        var header = d.responseHeaders[i];
        var headerName = header.name.toLowerCase();
        alreadyAdded[headerName] = true;
        var headerAction = action.response[headerName];
        if (headerAction == null) {
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
    for (var h in action.response) {
        if (h[0] != "+")
            continue;
        var headerName_1 = h.substring(1);
        if (alreadyAdded[headerName_1])
            continue;
        var headerAction = action.response[h];
        switch (headerAction) {
            case "":
            case "remove":
            case "pass":
            case "force-csp":
                break;
            default:
                d.responseHeaders.push({ name: headerName_1, value: headerAction });
                continue;
        }
    }
    return { responseHeaders: d.responseHeaders };
}
