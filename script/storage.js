"use strict";

//Load filters
var filters = {};

//Only called from loadAll()
function loadLocalFilters() {
    if (storageType != "local")
        return; //Loaded in loadAll();

    var json = localStorage.getItem("filter-list");
    if (json != null) {
        //New format
        filters = {};
        fixAll();
        importJson(json);
    }
    else {
        //Legacy format
        var json = localStorage.getItem("filters");
        filters = JSON.parse(json);
        fixAll();
        fixLegacyWildcard();
    }
}

function saveLocalFilters() {
    localStorage.setItem("filter-list", exportJson());
}

function saveAll() {
    //Always save locally
    saveLocalAll();

    if (storageType == "chrome") {
        var list = exportAll();
        //console.log("Filters: saving all", list);
        chrome.storage.sync.set(list, function () {
            if (chrome.runtime.lastError) {
                logError(chrome.runtime.lastError);
            }
            else {
                //Remove legacy code
                if (!chrome.runtime.lastError) {
                    //console.log("Filters: removing legacy, filters");
                    chrome.storage.sync.remove("filters", syncError);
                }
            }
        });
    }
}
function saveLocalAll() {
    saveLocalSettings();
    saveLocalActions();
    saveLocalFilters();
}

function fixAll() {
    //Filters
    if (filters == null) {
        //Fill with embedded block list
        filters = {};
        filters.wild = {};
        filters.wild[""] = {};
        filters.wild[""].wild = {};
    }

    if (filters == null) filters = {};
    if (filters.wild == null) filters.wild = {};
    if (filters.wild[""] == null) filters.wild[""] = {};
    if (filters.wild[""].wild == null) filters.wild[""].wild = {};

    //Settings
    if (settings == null) settings = {};
    if (settings.ignoreWWW === undefined)
        settings.ignoreWWW = true;//By default new installs ignore www
    if (settings.countIndicator === undefined)
        settings.countIndicator = "unfiltered";
    if (settings.defaultAction == undefined)
        settings.defaultAction = "pass";
    if (settings.defaultLocalAction == undefined)
        settings.defaultLocalAction = "passs";
    if (settings.defaultLocalTLDAction == undefined)
        settings.defaultLocalTLDAction = "pass";
    if (settings.defaultNewFilterAction == undefined)
        settings.defaultNewFilterAction = "block";
    if (settings.alwaysPassSame == undefined)
        settings.alwaysPassSame = false;

    //Actions
    if (actions == null || Object.keys(actions).length == 0) {
        //Load default actions
        actions = {};

        actions.pass = {
            color: "#4f4",
            block: "false"
        }

        actions.clear = {
            color: "#8ce",
            block: "false",
            request: {
                "referer": "remove",
                "cookie": "remove"
            },
            response: {
                "set-cookie": "remove"
            }
        }

        actions.block = {
            color: "#f64",
            block: "true"
        }
    }
    else {
        //Upgrade actions
        for (var k in actions) {
            var a = actions[k];
            if (a.request == null)
                a.request = {};
            if (a.response == null)
                a.response = {};

            switch (a.agent) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "random":
                    a.request["user-agent"] = "random";
                    break;
                case "simple":
                    a.request["user-agent"] = "simple";
                    break;
                case "minimal":
                    a.request["user-agent"] = "minimal";
                    break;
                case "remove":
                    a.request["user-agent"] = "remove";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.agent;

            switch (a.referer) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "dest":
                    a.request["referer"] = "dest";
                    break;
                case "destclean":
                    a.request["referer"] = "destclean";
                    break;
                case "clean":
                    a.request["referer"] = "clean";
                    break;
                case "remove":
                    a.request["referer"] = "remove";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.referer;

            switch (a.cookie) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "remove":
                    a.request["cookie"] = "remove";
                    a.response["set-cookie"] = "remove";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.cookie;

            switch (a.accept) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "remove":
                    a.request["accept"] = "remove";
                    break;
                case "any":
                    a.request["accept"] = "*/*";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.accept;

            switch (a.acceptlanguage) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "remove":
                    a.request["accept-language"] = "remove";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.acceptlanguage;

            switch (a.acceptencoding) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "remove":
                    a.request["accept-encoding"] = "remove";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.acceptencoding;

            switch (a.acceptcharset) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "remove":
                    a.request["accept-charset"] = "remove";
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.acceptcharset;

            switch (a.csp) {
                case null:
                case undefined:
                case "pass":
                    break;
                case "force":
                    a.response["content-security-policy-report-only"] = "force-csp";
                    break;
                case "none":
                    a.response["content-security-policy-report-only"] = "remove";
                    a.response["content-security-policy"] = "default-src: 'none'";
                    break;
                case "self":
                    a.response["content-security-policy-report-only"] = "remove";
                    a.response["content-security-policy"] = "default-src: 'self'";
                    break;
                case "custom":
                    a.response["content-security-policy-report-only"] = "remove";
                    a.response["content-security-policy"] = a.customcsp;
                    break;
                default:
                    throw "Upgrade error";
            }
            delete a.csp;
            delete a.customcsp;
        }
        console.log("Upgrade complete");
    }
}