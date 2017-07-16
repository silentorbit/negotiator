"use strict";

window.addEventListener("load", LoadTracked, false);


function LoadTracked() {
    var tabID = getParameterByName("tabID");
    var tabUrl = getParameterByName("tabUrl");
    
    if (tabID != null) {
        var navButtons = document.querySelectorAll("#mainpanel a");
        for (var n = 0; n < navButtons.length; n++)
            navButtons[n].setAttribute("target", "_blank");
    }

    var allButton = document.querySelector("#allTrackedReload");
    if (allButton) allButton.addEventListener("click", function () {
        window.location.href = "tracked.html";
    });
    var clearButton = document.querySelector("#clearTrackedReload");
    if (clearButton) clearButton.addEventListener("click", function () {
        clearTrackedRequests();
        location.reload();
    });

    if (tabID == null)
    {
        allButton.parentElement.removeChild(allButton);
        LoadAllTracked();
    }
    else
        LoadTabTracked(tabID, tabUrl);
}

function LoadAllTracked() {
    //Tracked Requests
    var table = document.getElementById("trackedTable");
    table.appendChild(cloneElement(b.filterHeader));//Add headers
    insertTrackedRow(table, {}, null);
    for (var i in b.TrackedRequests) {
        var r = b.TrackedRequests[i];

        insertTrackedRow(table, r, null);
    }
}

function LoadTabTracked(tabID, tabUrl) {
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

function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
