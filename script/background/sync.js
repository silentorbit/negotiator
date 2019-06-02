"use strict";
var syncActionPrefix = "action:";
loadAll();
function loadAll() {
    loadLocalFilters(function () {
        fixAll();
        if (syncType == "chrome")
            loadAllChrome();
    });
}
function mergeUpdate(target, source) {
    for (var k in source)
        target[k] = source[k];
}
function importAll(list) {
    var total = 0;
    for (var k in list) {
        var row = list[k];
        total += 1;
        if (k == "settings") {
            mergeUpdate(settings, row);
            continue;
        }
        if (k.indexOf(syncActionPrefix) == 0) {
            var action = k.substring(syncActionPrefix.length);
            actions[action] = row;
            continue;
        }
        var sep = k.indexOf(filterFromToSeparator);
        if (sep >= 0) {
            row.from = k.substring(0, sep);
            row.to = k.substring(sep + filterFromToSeparator.length);
            addFilter(row);
            continue;
        }
        console.log("Error, unknown key", k, row);
    }
    fixAll();
    return total;
}
function saveAll() {
    saveAllLocal();
    switch (syncType) {
        case "chrome":
            saveAllChrome();
            break;
    }
}
function syncDeleteFilter(filter) {
    deleteFilter(filter.from, filter.to);
    syncDelete(filter.from + filterFromToSeparator + filter.to);
}
function syncDeleteAction(actionKey) {
    syncDelete(syncActionPrefix + actionKey);
}
function syncDelete(key) {
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
