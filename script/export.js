"use strict";

var filterFromToSeparator = " > ";

function importJson(json) {
    var list = JSON.parse(json);
    importAll(list);
}

function exportJson() {
    return JSON.stringify(exportAll(false), null, "\t");
}

function exportAll(includeVersion) {
    //Scan all filters and generate a single list
    var list = {};

    //Settings
    list.settings = JSON.parse(JSON.stringify(settings));
    if (!includeVersion)
        delete list.settings.version;
    
    //Actions
    for (var a in actions) {
        list[syncActionPrefix + a] = JSON.parse(JSON.stringify(actions[a]));
        if (!includeVersion)
            delete list[syncActionPrefix + a].version;
    }

    //Filters
    for (var f in filters) {
        if (f == "wild")
            continue;
        exportAllTo(f, filters[f], list, includeVersion);
    }
    var fw = filters.wild;
    for (var f in fw) {
        exportAllTo("*" + f, fw[f], list, includeVersion);
    }

    return list;
}
function exportAllTo(from, filters, list, includeVersion) {
    if (filters == null)
        return;

    for (var f in filters) {
        if (f == "wild")
            continue;
        var filter = filters[f];
        if (filter == null)
            continue;
        list[from + filterFromToSeparator + f] = generateExportItem(filter, includeVersion);
    }
    var fw = filters.wild;
    for (var f in fw) {
        var filter = fw[f];
        if (filter == null)
            continue;
        list[from + filterFromToSeparator + "*" + f] = generateExportItem(filter, includeVersion);
    }
}
function generateExportItem(f, includeVersion) {
    var i = {
        //from and to are not included since they are encoded into the key
        filter: f.filter,
    };
    if (includeVersion && f.version) //Used in synchronization
        i.version = f.version;
    if (f.track)
        i.track = true;
    return i;
}

