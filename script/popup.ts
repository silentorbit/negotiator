"use strict";

window.addEventListener("load", loadPopupPage, false);

//var b = chrome.extension.getBackgroundPage() as any as BackgroundPage;

function loadPopupPage() {
    //This works on all
    //For Firefox on Android where the page is loaded in a new tab
    var tabID = getParameterByName("tabID");
    var tabUrl = getParameterByName("tabUrl");
    /*}
    else { //for regular requests, keep in case we use it with browserAction once it is available for Firefox on Android
        //Chrome and Firefox desktop with an actual popup
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            LoadTabRequests(tab.id, tab.url);
        });
    }*/

    var clearButton = document.querySelector("#clearTrackedReload");
    if (clearButton) clearButton.addEventListener("click", function () {
        b.ClearTrackedRequests();
        location.reload();
    });

    LoadTabTracked(tabID, tabUrl);
}

function LoadTabTracked(tabID: string, tabUrl: string) {
    //Tracked requests
    var table = document.getElementById("table");
    table.innerHTML = "";

    var newFilterAdded = function (filter: Filter) {
        var tf = b.tabFilters[tabID];
        if (tf) {
            tf.push(filter);
            LoadTabTracked(tabID, tabUrl);
        }
    };

    //Get tab domain
    var domain = b.tabUrl[tabID];
    if (domain == null)
        domain = b.getDomain(tabUrl);

    insertTrackedRow(table, { from: domain, to: domain, track: false }, newFilterAdded);

    var trackedArray = b.tabRequests[tabID];
    if (trackedArray) {
        for (var i in trackedArray) {
            var t = trackedArray[i];
            insertTrackedRow(table, t, newFilterAdded);
        }
    }

    updateTabFilters(table, tabID);
}

function updateTabFilters(table: HTMLElement, tabID: string) {

    //Update list of filters for domain
    var tabFilterArray = b.tabFilters[tabID];
    if (tabFilterArray) {
        var added = [];
        for (var i in tabFilterArray) {
            var filter = tabFilterArray[i];
            if (added.indexOf(filter) < 0) {
                generateFilterItem(table, filter);
                added.push(filter);
            }
        }
    }
}

function getParameterByName(name: string) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
