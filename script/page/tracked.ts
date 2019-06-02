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
    table.appendChild(CloneByID("filterHeader"));//Add headers
    insertTrackedRow(table, { from: "", to: "" }, null);
    for (var i in b.TrackedRequests) {
        var r = b.TrackedRequests[i];

        insertTrackedRow(table, r, null);
    }
}
