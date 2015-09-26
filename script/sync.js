"use strict";

var syncActionPrefix = "action:";

loadAll();

function loadAll() {
    //Always start with local
    loadLegacySettings();
    loadLegacyActions();
    loadLocalFilters();
    fixAll();

    switch (syncType) {
        case "chrome":
            loadAllChrome();
            break;
        case "negotiator":
            syncNegotiatorNow(true);
            break;
    }
}

function mergeUpdate(target, source) {
    for (var k in source)
        target[k] = source[k];
}

//With Special handling of deletion
function mergeListUpdate(list, index, source) {
    if (source.sync == "deleted") {
        delete list[index];
        return;
    }
    
    var target = list[index];
    if (target == null)
        target = list[index] = source;
    else
        mergeUpdate(target, source);

    delete target.sync;
}

function importAll(list) {

    var total = 0;

    for (var k in list) {
        var row = list[k];
        total += 1;

        //Settings
        if (k == "settings")
            mergeUpdate(settings, row);

        //Actions
        if (k.indexOf(syncActionPrefix) == 0) {
            var action = k.substring(syncActionPrefix.length);
            mergeListUpdate(actions, action, row);
            continue;
        }

        //Filters
        var sep = k.indexOf(filterFromToSeparator);
        if (sep >= 0) {
            row.from = k.substring(0, sep);
            row.to = k.substring(sep + filterFromToSeparator.length);
            addFilter(row);
            continue;
        }

        //Unknown
        console.log("Error, unknown key", k, row)
    }
    fixAll();
    return total;
}


function saveAll() {
    //Always save locally
    saveAllLocal();

    switch (syncType) {
        case "chrome":
            saveAllChrome();
            break;
        case "negotiator":
            saveAllNegotiator();
            break;
    }
}

//Delete single filter item from sync storage
function syncDeleteFilter(filter) {
    syncDelete(filter.from + filterFromToSeparator + filter.to, filter);
}

//Delete single action
function syncDeleteAction(actionKey) {
    syncDelete(syncActionPrefix + actionKey, actions[actionKey]);
}

function syncDelete(key, value) {
    switch (syncType) {
        default:
            throw "Unknown storage type: " + syncType;

        case "local":
            saveAllLocal();
            break;

        case "chrome":
            saveAllLocal();
            syncDeleteChrome(key);
            break;

        case "negotiator":
            syncDeleteNegotiator(key, value);
            //Save after sync flag has been set
            saveAllLocal();
            break;
    }
}

function syncUpdateFilter(filter) {
    syncUpdate(filter.from + filterFromToSeparator + filter.to, filter);
}

function syncUpdateAction(action, config) {
    syncUpdate(syncActionPrefix + action, config);
}

function syncUpdateSettings() {
    syncUpdate("settings", settings);
}

function syncUpdate(key, value) {
    switch (syncType) {
        default:
            throw "Unknown storage type: " + syncType;

        case "local":
            saveAllLocal();
            break;

        case "chrome":
            saveAllLocal();
            syncUpdateChrome(key, value);
            break;

        case "negotiator":
            syncUpdateNegotiator(key, value);
            //Save after sync flag has been set
            saveAllLocal();
            break;
    }
}
