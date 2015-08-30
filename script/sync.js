"use strict";

var syncActionPrefix = "action:";

loadAll();

function loadAll() {
    //Always start with local
    loadLocalSettings();
    loadLocalActions();
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

function importAll(list) {
    for (var k in list) {
        var c = list[k];

        //Settings
        if (k == "settings") {
            settings = c;
            continue;
        }
        //Actions
        if (k.indexOf(syncActionPrefix) == 0) {
            var action = k.substring(syncActionPrefix.length);
            actions[action] = c;
            continue;
        }

        //Filters
        var sep = k.indexOf(filterFromToSeparator);
        if (sep >= 0) {
            c.from = k.substring(0, sep);
            c.to = k.substring(sep + filterFromToSeparator.length);
            addFilter(c);
            continue;
        }

        //Unknown
        console.log("Error, unknown key", k, c)
    }
    fixAll();
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
    saveLocalAll();

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
    saveLocalAll();

    switch (storageType) {
        case "chrome":
            syncUpdateChrome(key);
            break;
        case "custom":
            syncUpdateCustom(key);
            break;
    }
}
