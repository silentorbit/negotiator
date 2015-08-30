"use strict";

function fullStorageUrl(request) {
    var url = storageUrl;
    if (url[url.length - 1] != "/")
        url += "/";
    url += "beta/" + request;
    return url;
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
            importAll(list);

            //Always save locally
            saveAllLocal();
        }
        else {
            logError(url + "\n" + req.statusText + "(" + req.status + ")");
        }
    };
    var request = {
        complete: true,
        list: exportAll(),
    };
    req.send(JSON.stringify(request, null, "\t"));
}

function syncDeleteCustom(key) {
    console.error("TODO: syncDeleteCustom");
}

function syncUpdateCustom(key, value) {
    console.error("TODO: syncUpdateCustom");
}
