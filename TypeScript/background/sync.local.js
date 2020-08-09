"use strict";
function saveAllLocal() {
    var settingsExport = exportAll();
    chrome.storage.local.set({ settings: settingsExport }, function () {
        console.log("Saved " + Object.keys(settingsExport).length + " rows");
        if (localStorage.getItem("filter-list") != null) {
            localStorage.removeItem("filter-list");
            console.log("Removed legacy storage");
        }
    });
}
function loadLocalFilters(callback) {
    filters = { wild: {}, direct: {} };
    fixAll();
    var json = localStorage.getItem("filter-list");
    if (json != null) {
        console.log("Legacy settings found: localstorage[filter-list]");
        var list = JSON.parse(json);
        importAll(list);
        callback();
        return;
    }
    console.log("No legacy settings found");
    chrome.storage.local.get("settings", function (json) {
        importAll(json.settings);
        callback();
    });
}
