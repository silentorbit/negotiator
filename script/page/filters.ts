"use strict";

function loadFiltersPage() {
    //Filters
    setTimeout(updateFilters, 0);

    //Test button
    var button = document.querySelector("#testButton");
    if (button) button.addEventListener("click", testFilter);
}

function testFilter() {
    var referrer = b.getDomain((document.getElementById("testFrom") as HTMLInputElement).value);
    var domain = b.getDomain((document.getElementById("testTo") as HTMLInputElement).value);
    var filter = b.getFilter(referrer, domain);

    var result = document.getElementById("testResult");
    if (filter == null)
        result.textContent = "no match, default";
    else {
        result.innerHTML = "";
        result.appendChild(CloneByID("filterHeader"));//Add headers
        generateFilterItem(result, filter);
    }
}

//Populate filters list in filter page
function updateFilters() {
    var list = b.filters;

    var filtersBlockedTag = document.getElementById("filtersBlocked");
    var filtersTag = document.getElementById("filters");
    if (filtersTag == null || filtersBlockedTag == null)
        return;

    RemoveAllChildren(filtersTag);
    RemoveAllChildren(filtersBlockedTag);

    //Add headers
    filtersTag.appendChild(CloneByID("filterHeader"));
    filtersBlockedTag.appendChild(CloneByID("filterHeader"));

    for (var i in list.wild)
        generateFilterList(filtersBlockedTag, filtersTag, list.wild[i]);

    for (var i in list.direct) {
        generateFilterList(filtersBlockedTag, filtersTag, list.direct[i]);
    }
}

function RemoveAllChildren(tag: HTMLElement) {
    while (tag.firstChild)
        tag.removeChild(tag.firstChild);
}

//Fill table with html representaton of a filter list
function generateFilterList(tableBlocked: HTMLElement, table: HTMLElement, list: FiltersTo) {
    if (list == null)
        return;

    for (var i in list.wild) {
        var f = list.wild[i];
        if (f.filter == "block")
            generateFilterItem(tableBlocked, f);
        else
            generateFilterItem(table, f);
    }

    for (var i in list.direct) {
        var f = list.direct[i];
        if (f == null)
            continue;

        if (f.filter == "block")
            generateFilterItem(tableBlocked, f);
        else
            generateFilterItem(table, f);
    }
}