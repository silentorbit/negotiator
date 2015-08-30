"use strict";

setInterval(syncIntervalCustom, 60000);

var syncCustomStatus = "";

function setSyncStatus(message) {
    var now = new Date();
    syncCustomStatus = now.getHours() + ":" + zeropad(now.getMinutes()) + ":" + (now.getSeconds()) + " " + message;
}

function zeropad(value) {
    value = "" + value;
    switch (value.length) {
        case 0: return "00";
        case 1: return "0" + value;
        default: return value;
    }
}

function syncIntervalCustom() {
    if (storageType != "custom") {
        setSyncStatus("Custom sync not enabled");
        return;
    }

    var all = exportAll();
    var sync = {};
    var total = 0;
    for (var k in all) {
        var value = all[k];

        if (value.sync == null)
            continue;

        sync[k] = value;
        total += 1;
    }

    if (total === 0) {
        setSyncStatus("Nothing to sync");
        return;
    }

    setSyncStatus("Synchronizing " + total + " items...");
    sendCustomRequest({ list: sync });
}

function fullStorageUrl(request) {
    var url = storageUrl;
    if (url[url.length - 1] != "/")
        url += "/";
    url += "beta/" + request;
    return url;
}

function sendCustomRequest(request) {
    var req = new XMLHttpRequest();
    var url = fullStorageUrl("update");
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.responseType = "json";
    req.onreadystatechange = function () {
        if (req.readyState != 4)
            return;

        if (req.status == 200) {
            var list = req.response.list;
            if (list == null) {
                logError("Empty list: " + JSON.stringify(req.response, null, "\t"));
                return;
            }
            var total = importAll(list);

            setSyncStatus("Completed " + total + " items");

            //Always save locally
            saveAllLocal();
        }
        else {
            setSyncStatus("Sync error " + req.statusText + "(" + req.status + ")");
            logError(url + "\n" + req.statusText + "(" + req.status + ")");
        }
    };
    req.send(JSON.stringify(request, null, "\t"));
}

function loadAllCustom() {
    var req = new XMLHttpRequest();
    var url = fullStorageUrl("get");
    req.open("GET", url, true);
    req.responseType = "json";
    req.onreadystatechange = function () {
        if (req.readyState != 4)
            return;

        if (req.status == 200) {
            var list = req.response.list;
            if (list == null) {
                logError("Empty list: " + JSON.stringify(req.response, null, "\t"));
                return;
            }
            filters = {};
            actions = {};
            importAll(list);

            //Always save locally
            saveAllLocal();
        }
        else {
            logError(url + "\n" + req.statusText + "(" + req.status + ")");
        }
    };
    req.send();
}

function saveAllCustom() {
    sendCustomRequest({
        complete: true,
        list: exportAll(),
    });
}

function syncDeleteCustom(key, value) {
    value.sync = "deleted";
    var dlist = {};
    dlist[key] = { sync: "deleted", version: value.version };
    sendCustomRequest({
        list: dlist,
    });
}

function syncUpdateCustom(key, value) {
    value.sync = "modified";
    var dlist = {};
    dlist[key] = value;
    sendCustomRequest({
        list: dlist,
    });
}
