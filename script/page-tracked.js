"use strict";

window.addEventListener("load", loadTrackedPage, false);

function loadTrackedPage() {
    //Tracked Requests
    var table = document.getElementById("trackedTable");
    table.appendChild(cloneElement(b.filterHeader));//Add headers
    for (var i in b.TrackedRequests) {
        var r = b.TrackedRequests[i];

        insertTrackedRow(table, r, null);
    }
    insertTrackedRow(table, {}, null);

    var button = document.querySelector("#clearTrackedReload");
    if (button) button.addEventListener("click", function () {
        clearTrackedRequests();
        location.reload();
    });
}