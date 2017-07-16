"use strict";

window.addEventListener("load", loadPopupPage, false);

function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function loadPopupPage() {
    document.querySelector("#showFilters").addEventListener("click", function () { showOptionsPage("filters.html"); });
    document.querySelector("#showTracked").addEventListener("click", function () { showOptionsPage("tracked.html"); });
    document.querySelector("#showOptions").addEventListener("click", function () { showOptionsPage("options.html"); });
    document.querySelector("#clearButton").addEventListener("click", function () {
        clearTrackedRequests();
        window.close();
    });

    //This works on all
    //if (navigator.userAgent.toLowerCase().indexOf("android") > -1) {
        //For Firefox on Android where the page is loaded in a new tab
        var tabID = getParameterByName("tabID");
        var tabUrl = getParameterByName("tabUrl");
        LoadTabRequests(tabID, tabUrl);
    /*}
    else {
        //Chrome and Firefox desktop with an actual popup
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            LoadTabRequests(tab.id, tab.url);
        });
    }*/
}

function LoadTabRequests(tabID, tabUrl) {
    updateTabFilters(tabID);

    var newFilterAdded = function (filter) {
        var tf = b.tabFilters[tabID];
        if (tf) {
            tf.push(filter);
            updateTabFilters(tabID);
        }
    };

    //Tracked requests
    var tableTracked = document.getElementById("trackedTable");
    tableTracked.appendChild(cloneElement(b.filterHeader));//Add headers

    //Get tab domain
    var domain = b.tabUrl[tabID];
    if (domain == null)
        domain = b.getDomain(tabUrl);

    insertTrackedRow(tableTracked, { from: domain, to: domain, track: false }, newFilterAdded);

    var trackedArray = b.tabRequests[tabID];
    if (trackedArray) {
        for (var i in trackedArray) {
            var t = trackedArray[i];
            insertTrackedRow(tableTracked, t, newFilterAdded);
        }
    }
}

function updateTabFilters(tabID) {
    //Update list of filters for domain
    var tabFilterArray = b.tabFilters[tabID];
    if (tabFilterArray) {
        var tableFilters = document.getElementById("filters");
        tableFilters.innerHTML = "";
        tableFilters.appendChild(cloneElement(b.filterHeader));//Add headers
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

    if (chrome.extension.getViews) {
        var extviews = chrome.extension.getViews({ "type": "tab" })
        for (var i in extviews) {
            if (extviews[i].location.href == optionsUrl) {
                extviews[i].chrome.tabs.getCurrent(function (tab) {
                    chrome.tabs.update(tab.id, { "active": true });
                });
                return;
            }
        }
    }
    chrome.tabs.create({ url: optionsUrl });
}
