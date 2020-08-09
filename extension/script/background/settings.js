"use strict";
var syncType = localStorage.getItem("syncType");
if (syncType == null)
    syncType = "local";
function setSync(type) {
    syncType = type;
    localStorage.syncType = syncType;
    loadAll();
}
var settings = {};
var actions = {};
var filters = { wild: {}, direct: {} };
function addAction(actionKey, action) {
    action = JSON.parse(JSON.stringify(action));
    actions[actionKey] = action;
}
function deleteAction(actionKey) {
    delete actions[actionKey];
    syncDeleteAction(actionKey);
}
function fixAll() {
    if (settings == null)
        settings = {};
    if (settings.ignoreWWW === undefined)
        settings.ignoreWWW = true;
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
    if (actions == null || Object.keys(actions).length == 0) {
        actions = {
            pass: {
                color: "#4f4",
                block: "false",
                request: {},
                response: {},
                sync: "modified"
            },
            clear: {
                color: "#8ce",
                block: "false",
                request: {
                    "referer": "remove",
                    "cookie": "remove"
                },
                response: {
                    "set-cookie": "remove"
                },
                sync: "modified"
            },
            block: {
                color: "#f64",
                block: "true",
                request: {},
                response: {},
                sync: "modified"
            }
        };
    }
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
