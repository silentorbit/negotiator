"use strict";

//Add "*" to wildcard filters .from and .to properties.
function fixLegacyWildcard() {
    //Fix from, to wildcards
    for (var i in filters) {
        if (i == "wild")
            continue;
        fixLegacyWildcardFrom(filters[i], false);
    }
    var fw = filters.wild;
    for (var i in fw) {
        fixLegacyWildcardFrom(fw[i], true);
    }
}
function fixLegacyWildcardFrom(list, fromWild) {
    if (list == null)
        return;

    //Fix from, to wildcards
    for (var i in list) {
        if (i == "wild")
            continue;
        fixLegacyWildcardTo(list[i], fromWild, false);
    }
    var fw = list.wild;
    for (var i in fw) {
        fixLegacyWildcardTo(fw[i], fromWild, true);
    }
}
function fixLegacyWildcardTo(f, fromWild, toWild) {
    if (f == null)
        return;
    if (fromWild && !isWild(f.from))
        f.from = "*" + f.from;
    if (toWild && !isWild(f.to))
        f.to = "*" + f.to;
}

function loadLegacySettings() {
    //Load old formats
    var s = {};

    //Slightly newer format
    try {
        var json = localStorage.settings;
        if (json) {
            s = JSON.parse(json);
            return s;
        }
    }
    catch (error) {
        logError(error);
    }

    //Original format

    //Default filter: what action to take when no filter match
    //We changed the storage key from defaultFilter to defaultAction
    s.defaultAction = localStorage.defaultAction || localStorage.defaultFilter || "pass";

    //This one is used when the referer is empty or the request is within the same domain
    s.defaultLocalAction = localStorage.defaultLocalAction || "pass";

    //This one is used when the TLD is the same such as www.example.com -> static.example.com
    s.defaultLocalTLDAction = localStorage.defaultLocalTLDAction || s.defaultAction;

    //Default new filter: what the preselected action for new filters are
    s.defaultNewFilterAction = localStorage.defaultNewFilterAction || "block";

    //Ignore leading www.
    s.ignoreWWW = (localStorage.ignoreWWW == "true");

    return s;
}

//Only called from loadAll()
function loadLegacyActions() {
    try {
        var json = localStorage.getItem("actions")
        if (json != null) {
            actions = JSON.parse(json);
            return;
        }
    }
    catch (error) {
        logError(error);
    }
}

//Call this once saving in the new format is successful
function removeLegacy() {
    //Renamed to Negotiator
    localStorage.removeItem("syncCustomVersion");
    //These are now items in filter-list
    localStorage.removeItem("settings");
    localStorage.removeItem("actions");
    localStorage.removeItem("filters");
    //Original settings
    localStorage.removeItem("defaultAction");
    localStorage.removeItem("defaultFilter");
    localStorage.removeItem("defaultLocalAction");
    localStorage.removeItem("defaultLocalTLDAction");
    localStorage.removeItem("defaultNewFilterAction");
    localStorage.removeItem("ignoreWWW");
    localStorage.removeItem("alwaysPassSame");
}