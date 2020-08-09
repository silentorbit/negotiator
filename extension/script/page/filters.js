"use strict";
function loadFiltersPage() {
    setTimeout(updateFilters, 0);
    var button = document.querySelector("#testButton");
    if (button)
        button.addEventListener("click", testFilter);
}
function testFilter() {
    var referrer = b.getDomain(document.getElementById("testFrom").value);
    var domain = b.getDomain(document.getElementById("testTo").value);
    var filter = b.getFilter(referrer, domain);
    var result = document.getElementById("testResult");
    if (filter == null)
        result.textContent = "no match, default";
    else {
        result.innerHTML = "";
        result.appendChild(CloneByID("filterHeader"));
        AddFilterRow(result, filter);
    }
}
function updateFilters() {
    var list = b.filters;
    var filtersBlockedTag = document.getElementById("filtersBlocked");
    var filtersTag = document.getElementById("filters");
    if (filtersTag == null || filtersBlockedTag == null)
        return;
    RemoveAllChildren(filtersTag);
    RemoveAllChildren(filtersBlockedTag);
    filtersTag.appendChild(CloneByID("filterHeader"));
    filtersBlockedTag.appendChild(CloneByID("filterHeader"));
    for (var i in list.wild)
        generateFilterList(filtersBlockedTag, filtersTag, list.wild[i]);
    for (var i in list.direct) {
        generateFilterList(filtersBlockedTag, filtersTag, list.direct[i]);
    }
}
function generateFilterList(tableBlocked, table, list) {
    if (list == null)
        return;
    for (var i in list.wild) {
        var f = list.wild[i];
        if (f.filter == "block")
            AddFilterRow(tableBlocked, f);
        else
            AddFilterRow(table, f);
    }
    for (var i in list.direct) {
        var f = list.direct[i];
        if (f == null)
            continue;
        if (f.filter == "block")
            AddFilterRow(tableBlocked, f);
        else
            AddFilterRow(table, f);
    }
}
