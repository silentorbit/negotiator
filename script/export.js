"use strict";

var filterFromToSeparator = " > ";

function importJson(json) {
    var list = JSON.parse(json);
    importAll(list);
}

function exportJson() {
    return JSON.stringify(exportAll(false), null, "\t");
}

function exportAll(includeEtag) {
    //Scan all filters and generate a single list
    var list = {};

    //Settings
    list.settings = JSON.parse(JSON.stringify(settings));

    //Actions
    for (var a in actions)
        list[syncActionPrefix + a] = JSON.parse(JSON.stringify(actions[a]));

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

    if (includeEtag !== true) {
        for (var k in list) {
            var i = list[k];
            delete i.etag;
            delete i.version;
            delete i.sync;
        }
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
        //from and to are not included since they are encoded into the key
        filter: f.filter,
    };
    if (f.etag)
        i.etag = f.etag;
    if (f.sync)
        i.sync = f.sync;
    if (f.track)
        i.track = true;
    return i;
}

