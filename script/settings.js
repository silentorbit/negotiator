"use strict";

//Storage location: local, chrome, negotiator
//Upgrade setting
if (localStorage.getItem("useChromeSync") == "true") //if true use chrome.storage.sync, otherwise use localStorage
{
    localStorage.setItem("syncType", "chrome");
    localStorage.removeItem("useChromeSync");
}
var syncType = localStorage.getItem("syncType");
if (syncType == null)
    syncType = "local";
if (syncType == "custom")
    syncType == "negotiator";
var syncUrl = localStorage.getItem("syncUrl");

function setSync(type, url) {
    //Save setting
    syncType = type;
    syncUrl = url;
    localStorage.syncType = syncType;
    localStorage.syncUrl = syncUrl;
    localStorage.syncNegotiatorVersion = "0";
    localChanges = true;

    //Reload
    loadAll();
}

//Live storage
var settings = {};
var actions = {};
var filters = {};

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
        settings.defaultLocalAction = "pass";
    if (settings.defaultLocalTLDAction == undefined)
        settings.defaultLocalTLDAction = "pass";
    if (settings.defaultNewFilterAction == undefined)
        settings.defaultNewFilterAction = "block";

    //Actions
    if (actions == null || Object.keys(actions).length == 0) {
        //Load default actions
        actions = {};

        actions.pass = {
            color: "#4f4",
            block: "false",
            request: {},
            response: {}
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
            block: "true",
            request: {},
            response: {}
        }
    }

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

        console.log("Upgrade complete");
    }
}
