"use strict";

function saveAllLocal() {
    localStorage.setItem("filter-list", JSON.stringify(exportAll(true), null, "\t"));
    removeLegacy();
}

//Only called from loadAll()
function loadLocalFilters() {
    if (storageType != "local")
        return; //Loaded in loadAll();

    var json = localStorage.getItem("filter-list");
    if (json != null) {
        //New format
        filters = {};
        fixAll();
        importJson(json);
    }
    else {
        //Legacy format
        var json = localStorage.getItem("filters");
        filters = JSON.parse(json);
        fixAll();
        fixLegacyWildcard();
    }
}

