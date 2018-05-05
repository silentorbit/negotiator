"use strict";

function saveAllLocal() {
    chrome.storage.local.set({ "settings": exportAll(true) }, function () {

        console.log("Save successful, deleting legacy");

        //Remove legacy saved data.
        localStorage.removeItem("filter-list");
    });
}

//Only called from loadAll()
function loadLocalFilters(callback: { (): void }) {
    filters = { wild: {}, direct: {} };
    fixAll();

    var json = localStorage.getItem("filter-list");
    if (json != null) {
        console.log("Legacy settings found: localstorage[filter-list]");
        //Import legacy settings
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

