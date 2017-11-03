"use strict";

function loadTrackedPage() {

    var clearButton = document.querySelector("#clearTrackedReload");
    if (clearButton) clearButton.addEventListener("click", function () {
        b.ClearTrackedRequests();
        location.reload();
    });

    LoadAllTracked();
}

function LoadAllTracked() {
    //Tracked Requests
    var table = document.getElementById("trackedTable");
    table.innerHTML = "";
    table.appendChild(cloneElement("filterHeader"));//Add headers
    insertTrackedRow(table, {}, null);
    for (var i in b.TrackedRequests) {
        var r = b.TrackedRequests[i];

        insertTrackedRow(table, r, null);
    }
}
