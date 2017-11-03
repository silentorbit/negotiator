"use strict";

function saveAllLocal() {
    localStorage.setItem("filter-list", JSON.stringify(exportAll(true), null, "\t"));

    //Remove legacy saved data.
    //localStorage.removeItem("filter-list");
}

//Only called from loadAll()
function loadLocalFilters() {
    var json = localStorage.getItem("filter-list");
    filters = {};
    fixAll();
    importJson(json);
}

