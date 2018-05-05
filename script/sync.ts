"use strict";

var syncActionPrefix = "action:";

loadAll();

function loadAll() {
    //Always start with local
    loadLocalFilters(function () {

        fixAll();

        if (syncType == "chrome")
            loadAllChrome();
    });
}

function mergeUpdate(target: any, source: any) {
    for (var k in source)
        target[k] = source[k];
    //delete target.sync;
}

function importAll(list: { [key: string]: any }) {

    var total = 0;

    for (var k in list) {
        var row = list[k];
        total += 1;

        //Settings
        if (k == "settings") {
            mergeUpdate(settings, row);
            continue;
        }

        //Actions
        if (k.indexOf(syncActionPrefix) == 0) {
            var action = k.substring(syncActionPrefix.length);
            actions[action] = row;
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
    }
}

//Delete single filter item from sync storage
function syncDeleteFilter(filter: Filter) {
    deleteFilter(filter.from, filter.to);
    syncDelete(filter.from + filterFromToSeparator + filter.to);
}

//Delete single action
function syncDeleteAction(actionKey: string) {
    syncDelete(syncActionPrefix + actionKey);
}

function syncDelete(key: string) {
    saveAllLocal();
    switch (syncType) {
        default:
        case "local":
            break;

        case "chrome":
            syncDeleteChrome(key);
            break;
    }
}

function syncUpdateFilter(filter: Filter) {
    syncUpdate(filter.from + filterFromToSeparator + filter.to, filter);
}

function syncUpdateAction(action: string, config: Action) {
    syncUpdate(syncActionPrefix + action, config);
}

function syncUpdateSettings() {
    syncUpdate("settings", settings);
}

function syncUpdate(key: string, value: any) {
    saveAllLocal();
    switch (syncType) {
        default:
        case "local":
            break;

        case "chrome":
            syncUpdateChrome(key, value);
            break;
    }
}
