"use strict";

window.addEventListener("load", loadOptionsPage, false);

var syncCustom;

//Called at the end of the options page load
function loadOptionsPage() {
    //Count unfiltered
    var www = document.getElementById("counterIndicator");
    www.checked = b.settings.countIndicator == "unfiltered";
    www.addEventListener("click", function () {
        b.settings.countIndicator = this.checked ? "unfiltered" : "";
        b.syncUpdateSettings();
    });

    //Filter Sync
    var syncType = document.getElementById("syncType");
    var syncUrl = document.getElementById("syncUrl");
    var syncUrlButton = document.getElementById("syncUrlButton");
    syncCustom = document.getElementById("syncCustom");

    setSelected(syncType, b.syncType);
    syncUrl.value = b.syncUrl;
    showSyncUrl();
    syncType.addEventListener("change", function () {
        b.setSync(syncType.value, syncUrl.value);
        showSyncUrl();
    });
    syncUrlButton.onclick = function () {
        if (syncUrl.disabled) {
            syncUrl.disabled = false;
            syncUrlButton.textContent = "Save";
            syncUrl.focus();
        }
        else {
            syncUrl.disabled = true;
            syncUrlButton.textContent = "Change";
            b.setSync(syncType.value, syncUrl.value);
        }
    };

    //Custom sync
    document.getElementById("syncNow").onclick = function () {
        b.syncCustomNow(true);
    };
    var syncStatus = document.getElementById("syncStatus");
    setInterval(function () {
        syncStatus.textContent = b.syncCustomStatus;
    }, 1000);

    //Default Actions
    fillActionSelect(document.getElementById("defaultAction"), b.settings.defaultAction, function () {
        b.settings.defaultAction = this.value;
        b.syncUpdateSettings();
    });
    fillActionSelect(document.getElementById("defaultLocalAction"), b.settings.defaultLocalAction, function () {
        b.settings.defaultLocalAction = this.value;
        b.syncUpdateSettings();
    });
    fillActionSelect(document.getElementById("defaultLocalTLDAction"), b.settings.defaultLocalTLDAction, function () {
        b.settings.defaultLocalTLDAction = this.value;
        b.syncUpdateSettings();
    });
    fillActionSelect(document.getElementById("defaultNewFilterAction"), b.settings.defaultNewFilterAction, function () {
        b.settings.defaultNewFilterAction = this.value;
        b.syncUpdateSettings();
    });

    //Ignore WWW
    var www = document.getElementById("ignoreWWW");
    www.checked = b.settings.ignoreWWW;
    www.addEventListener("click", function () {
        b.settings.ignoreWWW = this.checked;
        b.syncUpdateSettings();
    });

    //Experimental, pass same
    var passSame = document.getElementById("alwaysPassSame");
    passSame.checked = b.settings.alwaysPassSame;
    passSame.addEventListener("click", function () {
        b.settings.alwaysPassSame = this.checked;
        b.syncUpdateSettings();
    });

    //Action List
    updateActions();
    //New action
    document.querySelector("#addActionForm").addEventListener("submit", function (evt) {
        event.preventDefault();

        var name = document.getElementById("actionName");

        addAction(name.value);

        name.value = "";
        return false;
    });

    //Help examples:
    document.querySelector("#examplePass").innerHTML = navigator.userAgent;
    document.querySelector("#exampleRandom").innerHTML = b.getRandomUserAgent();
    document.querySelector("#exampleSimple").innerHTML = b.userAgent;
}

function showSyncUrl() {
    if (b.syncType == "custom")
        syncCustom.style.display = "";
    else
        syncCustom.style.display = "none";
}

//Populate Actions list
function updateActions() {
    for (var i in b.actions)
        addActionRow(i);
}

function updateEnabled(row) {
    var isBlocked = row.block.value == "true";
    var display = isBlocked ? "none" : "";
    row.request.style.display = display;
    row.response.style.display = display;
}

function addActionRow(a) {
    var row = document.getElementById("actionTemplate").cloneNode(true);
    var action = b.actions[a];

    row.removeAttribute("id");
    row.style.background = action.color;

    row.querySelector(".name").textContent = a;

    row.color.value = action.color;

    setSelected(row.block, action.block);	//Block request

    row.request.value = formatActionFilters(action.request);
    row.response.value = formatActionFilters(action.response);

    updateEnabled(row);

    //Automatically save settings when changed
    var save = function (event) {
        event.preventDefault();

        action.color = row.color.value;
        action.block = row.block.value;
        action.request = parseActionFilters(row.request.value);
        action.response = parseActionFilters(row.response.value);
        //Debug
        row.querySelector("#requestParsed").textContent = JSON.stringify(action.request, null, "\t");
        row.querySelector("#responseParsed").textContent = JSON.stringify(action.response, null, "\t");
        b.syncUpdateAction(a, action);

        row.style.backgroundColor = row.color.value;

        updateEnabled(row);
    };
    row.color.oninput = save;
    row.block.onchange = save;
    row.request.oninput = save;
    row.response.oninput = save;

    var table = document.getElementById("actions");

    row.delete.onclick = function (event) {
        event.preventDefault();

        b.syncDeleteAction(a)
        table.removeChild(row);
    }

    table.appendChild(row);
}

function formatActionFilters(headerFilter) {
    if (headerFilter == null)
        return "";
    var text = "";
    for (var k in headerFilter) {
        text += k + ": " + headerFilter[k] + "\n";
    }
    return text;
}
function parseActionFilters(text) {
    var headerFilter = {};
    var lines = text.replace("\r", "\n").split("\n");
    for (var l in lines) {
        var line = lines[l].trim();
        if (line == "")
            continue;
        var sep = line.indexOf(":")
        if (sep < 0)
            headerFilter[line] = "";
        else
            headerFilter[line.substring(0, sep).toLowerCase()] = line.substring(sep + 1).trim();
    }
    return headerFilter;
}

function addAction(a) {
    if (b.actions[a] != null) {
        alert(a + " already exists");
        return;
    }

    var action = { color: "green", block: "false" };
    b.actions[a] = action;
    b.syncUpdateAction(a, action)

    addActionRow(a);
}
