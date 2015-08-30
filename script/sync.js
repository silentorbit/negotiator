"use strict";

var syncActionPrefix = "action:";

loadAll();

function loadAll() {
    //Always start with local
    loadLegacySettings();
    loadLegacyActions();
    loadLocalFilters();
    fixAll();

    switch (storageType) {
        case "chrome":
            loadAllChrome();
            break;
        case "custom":
            loadAllCustom();
            break;
    }
}

function mergeUpdate(target, source) {
    for (var k in source)
        target[k] = source[k];
}

function mergeListUpdate(list, index, source) {
    var target = list[index];
    if (target == null)
        list[index] = source;
    else
        mergeUpdate(target, source);
}

function importAll(list) {

    for (var k in list) {
        var row = list[k];

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
}


function saveAll() {
    //Always save locally
    saveAllLocal();

    switch (storageType) {
        case "chrome":
            saveAllChrome();
            break;
        case "custom":
            saveAllCustom();
            break;
    }
}

//Delete single filter item from sync storage
function syncDeleteFilter(from, to) {
    syncDelete(from + filterFromToSeparator + to);
}

//Delete single action
function syncDeleteAction(action) {
    syncDelete(syncActionPrefix + action);
}

function syncDelete(key) {
    //Always save locally
    saveAllLocal();

    switch (storageType) {
        case "chrome":
            syncDeleteChrome(key);
            break;
        case "custom":
            syncDeleteCustom(key);
            break;
    }
}

function syncUpdateFilter(filter) {
    syncUpdate(
		filter.from + filterFromToSeparator + filter.to,
		generateExportItem(filter));
}

function syncUpdateAction(action, config) {
    syncUpdate(syncActionPrefix + action, config);
}

function syncUpdateSettings() {
    syncUpdate("settings", settings);
}

function syncUpdate(key, value) {
    //Always save locally
    saveAllLocal();

    switch (storageType) {
        case "chrome":
            syncUpdateChrome(key);
            break;
        case "custom":
            syncUpdateCustom(key);
            break;
    }
}
