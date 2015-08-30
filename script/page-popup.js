"use strict";

//Set by popup page when only filters for one domain is to be shown
var domain;

window.addEventListener("load", loadPopupPage, false);

function loadPopupPage() {
    document.querySelector("#showFilters").addEventListener("click", function () { showOptionsPage("filters.html"); });
    document.querySelector("#showTracked").addEventListener("click", function () { showOptionsPage("tracked.html"); });
    document.querySelector("#showOptions").addEventListener("click", function () { showOptionsPage("options.html"); });
    document.querySelector("#clearButton").addEventListener("click", function () {
        clearTrackedRequests();
        window.close();
    });

    chrome.tabs.getSelected(null, function (tab) {
        //Get tab domain
        domain = b.tabUrl[tab.id];
        if (domain == null)
            domain = b.getDomain(tab.url);

        updateTabFilters(tab);

        var newFilterAdded = function (filter) {
            var tf = b.tabFilters[tab.id];
            if (tf) {
                tf.push(filter);
                updateTabFilters(tab);
            }
        };

        //Tracked requests
        var trackedArray = b.tabRequests[tab.id];
        var tableTracked = document.getElementById("trackedTable");
        tableTracked.appendChild(b.filterHeader.cloneNode(true));//Add headers

        insertTrackedRow(tableTracked, { from: domain, to: domain, track: false }, newFilterAdded);
        if (trackedArray) {
            for (var i in trackedArray) {
                var t = trackedArray[i];
                insertTrackedRow(tableTracked, t, newFilterAdded);
            }
        }
    });
}

function updateTabFilters(tab) {
    //Update list of filters for domain
    var tabFilterArray = b.tabFilters[tab.id];
    if (tabFilterArray) {
        var tableFilters = document.getElementById("filters");
        tableFilters.innerHTML = "";
        tableFilters.appendChild(b.filterHeader.cloneNode(true));//Add headers
        var added = [];
        for (var i in tabFilterArray) {
            var filter = tabFilterArray[i];
            if (added.indexOf(filter) < 0) {
                generateFilterItem(tableFilters, filter);
                added.push(filter);
            }
        }
    }
}

//load options page in a new tab, or go to existing tab
function showOptionsPage(path) {
    var optionsUrl = chrome.extension.getURL(path);

    var extviews = chrome.extension.getViews({ "type": "tab" })
    for (var i in extviews) {
        if (extviews[i].location.href == optionsUrl) {
            extviews[i].chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, { "selected": true });
            });
            return;
        }
    }
    chrome.tabs.create({ url: optionsUrl });
}
