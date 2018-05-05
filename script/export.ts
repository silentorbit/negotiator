"use strict";

var filterFromToSeparator = " > ";

function exportJSON() {
    return JSON.stringify(exportAll(), null, "\t");
}

function exportAll(): SettingsExport {
    //Scan all filters and generate a single list
    var list: SettingsExport = {};

    //Settings
    list.settings = JSON.parse(JSON.stringify(settings));

    //Actions
    for (var a in actions)
        list[syncActionPrefix + a] = JSON.parse(JSON.stringify(actions[a]));

    //Filters
    var fd = filters.direct
    for (var f in fd) {
        exportAllTo(f, fd[f], list);
    }
    var fw = filters.wild;
    for (var f in fw) {
        exportAllTo("*" + f, fw[f], list);
    }

    return list;
}
function exportAllTo(from: string, filters: FiltersTo, list: SettingsExport) {
    if (filters == null)
        return;

    var fd = filters.direct;
    for (var f in fd) {
        var filter = fd[f];
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
function generateExportItem(f: Filter) {
    var i: ExportItem = {
        //from and to are not included since they are encoded into the key
        filter: f.filter,
    };
    if (f.track)
        i.track = true;
    return i;
}

