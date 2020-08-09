"use strict";
window.addEventListener("load", loadPopupPage, false);
function loadPopupPage() {
    var tabID = getQueryParameterByName("tabID");
    var tabUrl = getQueryParameterByName("tabUrl");
    var clearButton = document.querySelector("#clearTrackedReload");
    if (clearButton)
        clearButton.addEventListener("click", function () {
            b.ClearTrackedRequests();
            location.reload();
        });
    LoadTabTracked(tabID, tabUrl);
}
function getQueryParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function LoadTabTracked(tabID, tabUrl) {
    var table = document.getElementById("table");
    RemoveAllChildren(table);
    var newFilterAdded = function (filter) {
        var tf = b.tabFilters[tabID];
        if (tf) {
            tf.push(filter);
            LoadTabTracked(tabID, tabUrl);
        }
    };
    var domain = b.tabUrl[tabID];
    if (domain == null)
        domain = b.getDomain(tabUrl);
    AddTrackedRow(table, { from: domain, to: domain }, newFilterAdded);
    var trackedArray = b.tabRequests[tabID];
    if (trackedArray) {
        for (var i in trackedArray) {
            var t = trackedArray[i];
            AddTrackedRow(table, t, newFilterAdded);
        }
    }
    var tabFilterArray = b.tabFilters[tabID];
    if (tabFilterArray) {
        var added = [];
        for (var i in tabFilterArray) {
            var filter = tabFilterArray[i];
            if (added.indexOf(filter) < 0) {
                AddFilterRow(table, filter);
                added.push(filter);
            }
        }
    }
}
