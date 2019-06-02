"use strict";
function loadSettingsPage() {
    var www = document.getElementById("counterIndicator");
    www.checked = b.settings.countIndicator == "unfiltered";
    www.addEventListener("click", function () {
        b.settings.countIndicator = this.checked ? "unfiltered" : "";
        b.syncUpdateSettings();
    });
    var syncType = document.getElementById("syncType");
    setSelected(syncType, b.syncType);
    syncType.addEventListener("change", function () {
        b.setSync(syncType.value);
    });
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
    var www = document.getElementById("ignoreWWW");
    www.checked = b.settings.ignoreWWW;
    www.addEventListener("click", function () {
        b.settings.ignoreWWW = this.checked;
        b.syncUpdateSettings();
    });
    updateActions();
    document.querySelector("#addActionForm").addEventListener("submit", function (evt) {
        evt.preventDefault();
        var name = document.getElementById("actionName");
        addActionKey(name.value);
        name.value = "";
        return false;
    });
    document.querySelector("#examplePass").textContent = navigator.userAgent;
    document.querySelector("#exampleRandom").textContent = b.getRandomUserAgent();
    document.querySelector("#exampleSimple").textContent = b.userAgent;
}
function updateActions() {
    var forms = document.querySelectorAll("#actions form");
    for (var n = 0; n < forms.length; n++)
        forms[n].remove();
    for (var i in b.actions)
        addActionRow(i);
}
function updateEnabled(row) {
    var isBlocked = row.block.value == "true";
    var display = isBlocked ? "none" : "";
    row.request.style.display = display;
    row.response.style.display = display;
}
function addActionRow(actionKey) {
    var row = CloneByID("actionTemplate");
    var action = b.actions[actionKey];
    row.style.background = action.color;
    row.querySelector(".name").textContent = actionKey;
    row.color.value = action.color;
    setSelected(row.block, action.block);
    row.request.value = formatActionFilters(action.request);
    row.response.value = formatActionFilters(action.response);
    updateEnabled(row);
    var save = function (event) {
        event.preventDefault();
        action = b.actions[actionKey];
        action.color = row.color.value;
        action.block = row.block.value;
        action.request = parseActionFilters(row.request.value);
        action.response = parseActionFilters(row.response.value);
        b.syncUpdateAction(actionKey, action);
        row.style.backgroundColor = row.color.value;
        updateEnabled(row);
    };
    row.color.oninput = save;
    row.block.onchange = save;
    row.request.oninput = save;
    row.response.oninput = save;
    var table = document.getElementById("actions");
    row["delete"].onclick = function (event) {
        event.preventDefault();
        var count = ActionUse();
        if (count > 0) {
            alert("Action is in use by " + count + " filters\n\nDelete those filters first.");
            return;
        }
        b.deleteAction(actionKey);
        table.removeChild(row);
    };
    table.appendChild(row);
    function ActionUse() {
        var use = 0;
        use += ActionUse1(b.filters.direct);
        use += ActionUse1(b.filters.wild);
        return use;
    }
    function ActionUse1(list) {
        var use = 0;
        for (var k in list) {
            use += ActionUse2(list[k]);
        }
        return use;
    }
    function ActionUse2(to) {
        var use = 0;
        use += ActionUse3(to.direct);
        use += ActionUse3(to.wild);
        return use;
    }
    function ActionUse3(list) {
        var use = 0;
        for (var k in list) {
            if (list[k].filter == actionKey)
                use++;
        }
        return use;
    }
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
        var sep = line.indexOf(":");
        if (sep < 0)
            headerFilter[line] = "";
        else
            headerFilter[line.substring(0, sep).toLowerCase()] = line.substring(sep + 1).trim();
    }
    return headerFilter;
}
function addActionKey(actionKey) {
    if (b.actions[actionKey] != null) {
        alert(actionKey + " already exists");
        return;
    }
    var action = { color: "green", block: "false" };
    b.addAction(actionKey, action);
    addActionRow(actionKey);
}
