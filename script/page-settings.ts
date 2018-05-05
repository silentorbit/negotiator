"use strict";

//Called at the end of the options page load
function loadSettingsPage() {
    //Count unfiltered
    var www = document.getElementById("counterIndicator") as HTMLInputElement;
    www.checked = b.settings.countIndicator == "unfiltered";
    www.addEventListener("click", function () {
        b.settings.countIndicator = this.checked ? "unfiltered" : "";
        b.syncUpdateSettings();
    });

    //Filter Sync
    var syncType = document.getElementById("syncType") as HTMLSelectElement;

    setSelected(syncType, b.syncType);
    syncType.addEventListener("change", function () {
        b.setSync(syncType.value);
    });

    //Default Actions
    fillActionSelect(document.getElementById("defaultAction") as HTMLSelectElement, b.settings.defaultAction, function () {
        b.settings.defaultAction = this.value;
        b.syncUpdateSettings();
    });
    fillActionSelect(document.getElementById("defaultLocalAction") as HTMLSelectElement, b.settings.defaultLocalAction, function () {
        b.settings.defaultLocalAction = this.value;
        b.syncUpdateSettings();
    });
    fillActionSelect(document.getElementById("defaultLocalTLDAction") as HTMLSelectElement, b.settings.defaultLocalTLDAction, function () {
        b.settings.defaultLocalTLDAction = this.value;
        b.syncUpdateSettings();
    });
    fillActionSelect(document.getElementById("defaultNewFilterAction") as HTMLSelectElement, b.settings.defaultNewFilterAction, function () {
        b.settings.defaultNewFilterAction = this.value;
        b.syncUpdateSettings();
    });

    //Ignore WWW
    var www = document.getElementById("ignoreWWW") as HTMLInputElement;
    www.checked = b.settings.ignoreWWW;
    www.addEventListener("click", function () {
        b.settings.ignoreWWW = this.checked;
        b.syncUpdateSettings();
    });

    //Action List
    updateActions();
    //New action
    document.querySelector("#addActionForm").addEventListener("submit", function (evt) {
        evt.preventDefault();

        var name = document.getElementById("actionName") as HTMLInputElement;

        addActionKey(name.value);

        name.value = "";
        return false;
    });

    //Help examples:
    document.querySelector("#examplePass").innerHTML = navigator.userAgent;
    document.querySelector("#exampleRandom").innerHTML = b.getRandomUserAgent();
    document.querySelector("#exampleSimple").innerHTML = b.userAgent;
}

//Populate Actions list
function updateActions() {
    //Clear list
    var forms = document.querySelectorAll("#actions form");
    for (var n = 0; n < forms.length; n++)
        forms[n].remove();

    for (var i in b.actions)
        addActionRow(i);
}

function updateEnabled(row: ActionRow) {
    var isBlocked = row.block.value == "true";
    var display = isBlocked ? "none" : "";
    row.request.style.display = display;
    row.response.style.display = display;
}

function addActionRow(actionKey: string) {
    var row = document.getElementById("actionTemplate").cloneNode(true) as ActionRow;
    var action = b.actions[actionKey];

    row.removeAttribute("id");
    row.style.background = action.color;

    row.querySelector(".name").textContent = actionKey;

    row.color.value = action.color;

    setSelected(row.block, action.block);	//Block request

    row.request.value = formatActionFilters(action.request);
    row.response.value = formatActionFilters(action.response);

    updateEnabled(row);

    //Automatically save settings when changed
    var save = function (event: Event) {
        event.preventDefault();

        action = b.actions[actionKey];
        action.color = row.color.value;
        action.block = row.block.value;
        action.request = parseActionFilters(row.request.value);
        action.response = parseActionFilters(row.response.value);
        //Debug
        //row.querySelector("#requestParsed").textContent = JSON.stringify(action.request, null, "\t");
        //row.querySelector("#responseParsed").textContent = JSON.stringify(action.response, null, "\t");
        b.syncUpdateAction(actionKey, action);

        row.style.backgroundColor = row.color.value;

        updateEnabled(row);
    };
    row.color.oninput = save;
    row.block.onchange = save;
    row.request.oninput = save;
    row.response.oninput = save;

    var table = document.getElementById("actions");

    row.delete.onclick = function (event: Event) {
        event.preventDefault();

        //Make sure the action is not inuse.
        var count = ActionUse();
        if (count > 0) {
            alert("Action is in use by " + count + " filters");
            return;
        }

        b.deleteAction(actionKey);
        table.removeChild(row);
    }

    table.appendChild(row);

    function ActionUse() {
        var use = 0;
        use += ActionUse1(b.filters.direct);
        use += ActionUse1(b.filters.wild);
        return use;
    }

    function ActionUse1(list: { [index: string]: FiltersTo }): number {
        var use = 0;
        for (var k in list) {
            use += ActionUse2(list[k]);
        }
        return use;
    }

    function ActionUse2(to: FiltersTo): number {
        var use = 0;
        use += ActionUse3(to.direct);
        use += ActionUse3(to.wild);
        return use;
    }

    function ActionUse3(list: { [index: string]: Filter }): number {
        var use = 0;
        for (var k in list) {
            if (list[k].filter == actionKey)
                use++;
        }
        return use;
    }
}

function formatActionFilters(headerFilter: HeaderFilter) {
    if (headerFilter == null)
        return "";
    var text = "";
    for (var k in headerFilter) {
        text += k + ": " + headerFilter[k] + "\n";
    }
    return text;
}
function parseActionFilters(text: string): HeaderFilter {
    var headerFilter: HeaderFilter = {};
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

function addActionKey(actionKey: string) {
    if (b.actions[actionKey] != null) {
        alert(actionKey + " already exists");
        return;
    }

    var action = { color: "green", block: "false" };
    b.addAction(actionKey, action);

    addActionRow(actionKey);
}
