"use strict";

setInterval(function () { syncNegotiatorNow(false); }, 15 * 1000); //15 seconds
setInterval(function () { syncNegotiatorNow(true); }, 15 * 60 * 1000); //15 minutes

var syncNegotiatorStatus = "";
var localChanges = true; //First time we scan for changes

function setSyncNegotiatorStatus(message) {
    var now = new Date();
    syncNegotiatorStatus = now.getHours() + ":" + zeropad(now.getMinutes()) + ":" + zeropad(now.getSeconds()) + " " + message;
}

function zeropad(value) {
    value = "" + value;
    switch (value.length) {
        case 0: return "00";
        case 1: return "0" + value;
        default: return value;
    }
}

//download, check with remote server even if we have no local changes
function syncNegotiatorNow(download) {
    if (syncType != "negotiator") {
        setSyncNegotiatorStatus("Negotiator sync not enabled");
        return;
    }

    var sync = {};
    var total = 0;
    if (localChanges) {
        var all = exportAll();
        for (var k in all) {
            var value = all[k];

            if (value.sync == null)
                continue;

            sync[k] = value;
            total += 1;
        }
    }
    localChanges = false;

    if ((download == false) && (total === 0)) {
        setSyncNegotiatorStatus("All synchronized");
        return;
    }

    setSyncNegotiatorStatus("Synchronizing " + total + " items...");
    sendNegotiatorRequest({ list: sync });
}

function syncUploadIntervalNegotiator() {
    if (syncType != "negotiator") {
        setSyncNegotiatorStatus("Negotiator sync not enabled");
        return;
    }
}

function fullSyncUrl() {
    var url = syncUrl;
    if (url[url.length - 1] != "/")
        url += "/";
    url += "beta";
    return url;
}

function sendNegotiatorRequest(request) {
    var req = new XMLHttpRequest();
    var url = fullSyncUrl();
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.responseType = "json";
    req.onreadystatechange = function () {
        if (req.readyState != 4)
            return;

        if (req.status == 200) {
            if (req.response.version != null && req.response.version != "" && req.response.version != "0")
                localStorage.syncNegotiatorVersion = req.response.version;

            if (request.version == "0") {
                filters = {};
                actions = {};
            }
            var total = importAll(req.response.list);

            if (request.version == "0")
                setSyncNegotiatorStatus("Complete download, " + total + " items");
            else
                setSyncNegotiatorStatus("Done, " + total + " changes");

            //Always save locally
            saveAllLocal();
        }
        else {
            setSyncNegotiatorStatus("Sync error " + req.statusText + "(" + req.status + ")");
            logError("Negotiator Sync: " + url + "\n" + req.statusText + "(" + req.status + ")");
            localChanges = true;
        }
    };
    request.version = localStorage.syncNegotiatorVersion;
    req.send(JSON.stringify(request, null, "\t"));
}

function saveAllNegotiator() {
    sendNegotiatorRequest({
        complete: true,
        list: exportAll(),
    });
}

function syncDeleteNegotiator(key, value) {
    value.sync = "deleted";
    localChanges = true;    //Sync will trigger every 15 seconds if there are changes
}

function syncUpdateNegotiator(key, value) {
    value.sync = "modified";
    localChanges = true;    //Sync will trigger every 15 seconds if there are changes
}
