"use strict";

setInterval(function () { syncCustomNow(false); }, 15 * 1000); //15 seconds
setInterval(function () { syncCustomNow(true); }, 15 * 60 * 1000); //15 minutes

var syncCustomStatus = "";

function setSyncStatus(message) {
    var now = new Date();
    syncCustomStatus = now.getHours() + ":" + zeropad(now.getMinutes()) + ":" + zeropad(now.getSeconds()) + " " + message;
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
function syncCustomNow(download) {
    if (syncType != "custom") {
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

    if ((download == false) && (total === 0)) {
        setSyncStatus("Nothing to sync");
        return;
    }

    setSyncStatus("Synchronizing " + total + " items...");
    sendCustomRequest({ list: sync });
}

function syncUploadIntervalCustom() {
    if (syncType != "custom") {
        setSyncStatus("Custom sync not enabled");
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

function sendCustomRequest(request) {
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
                localStorage.syncCustomVersion = req.response.version;

            var total = importAll(req.response.list);

            setSyncStatus("Completed " + total + " items");

            //Always save locally
            saveAllLocal();
        }
        else {
            setSyncStatus("Sync error " + req.statusText + "(" + req.status + ")");
            logError("Custom Sync: " + url + "\n" + req.statusText + "(" + req.status + ")");
        }
    };
    request.version = localStorage.syncCustomVersion;
    req.send(JSON.stringify(request, null, "\t"));
}

function saveAllCustom() {
    sendCustomRequest({
        complete: true,
        list: exportAll(),
    });
}

function syncDeleteCustom(key, value) {
    value.sync = "deleted";
    /*var dlist = {};
    dlist[key] = { sync: "deleted", version: value.version };
    sendCustomRequest({
        list: dlist,
    });*/
}

function syncUpdateCustom(key, value) {
    value.sync = "modified";
    /*var dlist = {};
    dlist[key] = value;
    sendCustomRequest({
        list: dlist,
    });*/
}
