"use strict";

//
// Script for user manipulation
// in the options page and the popup
//

var tabs = { "filters": 1, "tracked": 1, "settings": 1, "export": 1 }

window.addEventListener("load", function () {
    b.showErrors(document);

    function buttonCallback(tab) {
        return function () { loadTab(tab) }
    }

    for (var tab in tabs) {
        document.getElementById(tab + "-button").addEventListener("click", buttonCallback(tab));
    }

    var current = window.location.hash;
    if (current == "")
        current = "#settings";
    loadTab(current.substr(1));
}, false);

function loadTab(activeTab) {
    console.log("Loading tab: " + activeTab);

    for (var tab in tabs) {
        document.getElementById(tab + "-button").classList.remove("active");
        document.getElementById(tab + "-tab").classList.remove("active");
    }

    document.getElementById(activeTab + "-button").classList.add("active");
    document.getElementById(activeTab + "-tab").classList.add("active");
    window.location.hash = "#" + activeTab;

    switch (activeTab) {
        case "tracked":
            loadTrackedPage();
            break;
        case "settings":
            loadSettingsPage();
            break;
        case "filters":
            loadFiltersPage();
            break;
        case "export":
            loadExportPage();
            break;
    }
}
