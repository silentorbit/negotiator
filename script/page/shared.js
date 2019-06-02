"use strict";
var b = chrome.extension.getBackgroundPage();
function loadShared() {
    var myPort = chrome.runtime.connect({ name: "port-from-cs" });
    myPort.postMessage({ greeting: "hello from content script" });
    myPort.onMessage.addListener(function (m) {
        console.log("In content script, received message from background script: ");
        console.log(m.greeting);
    });
    window.onerror = b.logUncaught;
}
loadShared();
function cleanDomain(domain) {
    domain = domain.trim();
    var wild = domain.indexOf("*") == 0;
    domain = domain.replace(/^[\*\.]+/, "").trim();
    var sep = domain.indexOf("/");
    if (sep >= 0)
        domain = domain.substring(0, sep);
    if (wild)
        domain = "*" + domain;
    return domain;
}
function getFilterFromForm(form) {
    var f = {
        from: form.from.value,
        to: form.to.value,
        filter: form.filter.value,
        track: form.track.checked
    };
    if (f.from == "" && f.to == "")
        return null;
    f.from = cleanDomain(f.from);
    f.to = cleanDomain(f.to);
    if (f.from.indexOf(" ") >= 0 || f.to.indexOf(" ") >= 0) {
        alert("domains can't contain spaces");
        return null;
    }
    if (f.from.indexOf("*") > 0 || f.to.indexOf("*") > 0) {
        alert("domains can only start with wildcard *");
        return null;
    }
    if (f.to == "")
        f.to = "*";
    var toWild = isWild(f.to);
    var toWithout = withoutWild(f.to);
    var fromWild = isWild(f.from);
    var fromWithout = withoutWild(f.from);
    for (var i in b.TrackedRequests) {
        var t = b.TrackedRequests[i];
        if (f.from != null && f.from != "") {
            if (fromWild) {
                if (endsWith(t.from, withoutWild(f.from)) == false)
                    continue;
            }
            else {
                if (f.from != t.from)
                    continue;
            }
        }
        if (f.to != null && f.to != "") {
            if (toWild) {
                if (endsWith(t.to, toWithout) == false)
                    continue;
            }
            else {
                if (f.to != t.to)
                    continue;
            }
        }
        delete b.TrackedRequests[i];
    }
    return f;
}
function generateFilterItem(table, f) {
    var row = CloneByID("filterTemplate");
    updateFilterRow(row, f);
    table.appendChild(row);
    return row;
}
function onFilterChange(row, f) {
    wildcardTextHelper(row.from);
    wildcardTextHelper(row.to);
    var newFilter = getFilterFromForm(row);
    if (newFilter != null) {
        b.updateFilter(f, newFilter);
        b.syncUpdateFilter(newFilter);
        updateFilterRow(row, newFilter);
    }
}
function updateFilterRow(row, f) {
    row.from.oninput = null;
    row.to.oninput = null;
    row.filter.onchange = null;
    row.track.onchange = null;
    row.onsubmit = function () { return false; };
    row.removeAttribute("id");
    row.style.background = b.actions[f.filter].color;
    var selFrom = row.from.selectionEnd;
    var selTo = row.to.selectionEnd;
    row.from.value = f.from;
    row.to.value = f.to;
    if (selFrom != 0) {
        row.from.selectionStart = selFrom;
        row.from.selectionEnd = selFrom;
    }
    if (selTo != 0) {
        row.to.selectionStart = selTo;
        row.to.selectionEnd = selTo;
    }
    fillActionSelect(row.filter, f.filter);
    row.track.checked = f.track;
    if (row.add != null)
        row.add.parentNode.removeChild(row.add);
    row.del.onclick = function () {
        b.syncDeleteFilter(f);
        row.parentNode.removeChild(row);
        return false;
    };
    row.from.oninput = function () { onFilterChange(row, f); };
    row.to.oninput = function () { onFilterChange(row, f); };
    row.filter.onchange = function () { onFilterChange(row, f); };
    row.track.onchange = function () { onFilterChange(row, f); };
    row.onsubmit = function () {
        onFilterChange(row, f);
        return false;
    };
}
function insertTrackedRow(table, req, submitAction) {
    if (req.from == null)
        req.from = "";
    var row = CloneByID("filterTemplate");
    row.removeAttribute("id");
    row.del.parentNode.removeChild(row.del);
    row.from.value = req.from;
    if (req.to != null)
        row.to.value = req.to;
    row.track.checked = req.track;
    fillActionSelect(row.filter, b.settings.defaultNewFilterAction);
    row.onsubmit = function () {
        var filter = getFilterFromForm(row);
        if (filter == null)
            return;
        b.addFilter(filter);
        b.syncUpdateFilter(filter);
        table.removeChild(row);
        if (submitAction != null)
            submitAction(filter);
        return false;
    };
    row.from.oninput = function () { wildcardTextHelper(row.from); };
    row.to.oninput = function () { wildcardTextHelper(row.to); };
    table.appendChild(row);
}
function wildcardTextHelper(text) {
    var wild = false;
    var f = text.value;
    f = f.trim();
    if (f.indexOf("*") == 0) {
        f = f.substring(1).trim();
        wild = true;
    }
    f = f.replace("*", "");
    if (wild)
        f = "*" + f;
    if (text.value != f)
        text.value = f;
}
function fillActionSelect(select, selectedAction, action) {
    var i = 0;
    for (var f in b.actions) {
        var o = new Option(f, f);
        select.options[i] = o;
        o.style.background = b.actions[f].color;
        o.selected = true;
        i++;
    }
    setSelected(select, selectedAction);
    if (action)
        select.addEventListener("change", action);
}
function setSelected(list, value) {
    for (var i = 0; i < list.length; i++) {
        var option = list.options[i];
        if (option.value == value) {
            option.selected = true;
            return;
        }
    }
}
function endsWith(str, suffix) {
    if (str == null)
        return false;
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function CloneByID(id) {
    var source = document.getElementById(id);
    var clone = source.cloneNode(true);
    clone.removeAttribute("id");
    return clone;
}
