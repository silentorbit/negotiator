"use strict";

var filterFromToSeparator = " > ";

function importJson(json) {
    var list = JSON.parse(json);
    importAll(list);
}

function exportJson() {
    return JSON.stringify(exportAll(), null, "\t");
}

function exportAll() {
    //Scan all filters and generate a single list
    var list = {};

    //Settings
    list.settings = settings;

    //Actions
    for (var a in actions) {
        list[syncActionPrefix + a] = actions[a];
    }

    //Filters
    for (var f in filters) {
        if (f == "wild")
            continue;
        exportAllTo(f, filters[f], list);
    }
    var fw = filters.wild;
    for (var f in fw) {
        exportAllTo("*" + f, fw[f], list);
    }

    return list;
}
function exportAllTo(from, filters, list) {
    if (filters == null)
        return;

    for (var f in filters) {
        if (f == "wild")
            continue;
        var filter = filters[f];
        if (filter == null)
            continue;
        list[from + filterFromToSeparator + f] = generateExportItem(filter);
    }
    var fw = filters.wild;
    for (var f in fw) {
        var filter = fw[f];
        if (filter == null)
            continue;
        list[from + filterFromToSeparator + "*" + f] = generateExportItem(filter);
    }
}
function generateExportItem(f) {
    var i = {
        filter: f.filter,
    };
    if (f.track)
        i.track = true;
    return i;
}

