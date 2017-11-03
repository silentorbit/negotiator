"use strict";

function loadFiltersPage() {
    //Filters
    setTimeout(updateFilters, 0);

    //Test button
    var button = document.querySelector("#testButton");
    if (button) button.addEventListener("click", testFilter);
}

function testFilter() {
    var referrer = b.getDomain(document.getElementById("testFrom").value);
    var domain = b.getDomain(document.getElementById("testTo").value);
    var filter = b.getFilter(referrer, domain);

    var result = document.getElementById("testResult");
    if (filter == null)
        result.innerHTML = "no match, default";
    else {
        result.innerHTML = "";
        result.appendChild(cloneElement("filterHeader"));//Add headers
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

    //Add headers
    filtersTag.innerHTML = document.getElementById("filterHeader").outerHTML;
    filtersBlockedTag.innerHTML = document.getElementById("filterHeader").outerHTML;
    
    for (var i in list.wild)
        generateFilterList(filtersBlockedTag, filtersTag, list.wild[i]);

    for (var i in list) {
        if (i == "wild")
            continue;
        generateFilterList(filtersBlockedTag, filtersTag, list[i]);
    }
}

//Fill table with html representaton of a filter list
function generateFilterList(tableBlocked, table, list) {
    if (list == null)
        return;

    for (var i in list.wild) {
        var f = list.wild[i];
        if (f.filter == "block")
            generateFilterItem(tableBlocked, f);
        else
            generateFilterItem(table, f);
    }

    for (var i in list) {
        if (i == "wild")
            continue;

        var f = list[i];
        if (f == null)
            continue;

        if (f.filter == "block")
            generateFilterItem(tableBlocked, f);
        else
            generateFilterItem(table, f);
    }
}