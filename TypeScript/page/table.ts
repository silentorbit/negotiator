"use strict";

//
// Shared / used in both popup.html and options.html
//

//
// Script for user manipulation
// in the options page and the popup
//

//Must load before any other page scripts
var b = chrome.extension.getBackgroundPage() as any as BackgroundPage;

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

function cleanDomain(domain: string) {
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

//Create a new filter based on the form data
//Return null if the form entry is invalid.
function getFilterFromForm(form: FilterRow): Filter {
    var f: Filter = {
        from: form.from.value,
        to: form.to.value,
        filter: form.filter.value,
        track: form.track.checked
    };

    if (f.from == "" && f.to == "")
        return null;

    //Remove leading dots, and everything after slash
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
    //Empty is interpreted as wildcard(which includes empty)
    if (f.to == "")
        f.to = "*";

    var toWild = isWild(f.to);
    var toWithout = withoutWild(f.to);
    var fromWild = isWild(f.from);
    var fromWithout = withoutWild(f.from);

    //Remove tracked requests matching filter
    for (var i in b.TrackedRequests) {
        let t = b.TrackedRequests[i];

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
            } else {
                if (f.to != t.to)
                    continue;
            }
        }

        //Remove record
        delete b.TrackedRequests[i];
    }

    return f;
}

interface HTMLInputElement {
    orig: string //Original value before clicking the "*" button
}

//Shared with page filter and popup
//Return html representation of a filter
function AddFilterRow(table: HTMLElement, f: Filter) {
    var row = CloneByID("filterTemplate") as FilterRow;
    row.add.remove(); //Remove "add"/"save" button

    //Update events with the new filter settings (f)
    row.del.onclick = function () {
        b.syncDeleteFilter(f);
        row.remove();
        return false;
    };

    row.from.orig = f.from;
    row.to.orig = f.to;
    row.fromWild.onclick = function () { DomainClick(row.from); };
    row.toWild.onclick = function () { DomainClick(row.to); };

    row.from.oninput = function () { onFilterChange(row, f); };
    row.to.oninput = function () { onFilterChange(row, f); };
    row.filter.onchange = function () { onFilterChange(row, f); };
    row.track.onchange = function () { onFilterChange(row, f); };
    row.onsubmit = function () {
        onFilterChange(row, f);
        return false;
    };

    UpdateFilterRow(row, f);

    table.appendChild(row);
    return row;
}

function UpdateFilterRow(row: FilterRow, f: Filter) {
    row.currentFilter = f;

    //Update fields
    for (var ci = 0; ci < row.children.length; ci++)
        (row.children[ci] as HTMLElement).style.background = b.actions[f.filter].color;

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
}

//Add wildcard or strip one subdomain each click
function DomainClick(input: HTMLInputElement) {

    var v = input.value;
    if (v == "*") {
        //Add back original domain
        input.value = input.orig;
    } else if (v.indexOf("*") == 0) {
        //Strip one subdomain
        v = v.replace("*", "");
        var s = v.split(".");
        if (s.length <= 2) {
            input.value = "*";
        }
        else {
            s.shift();
            input.value = "*" + s.join(".");
        }
    } else {
        //Add wildcard
        input.value = "*" + input.value;
    }
}

function onFilterChange(row: FilterRow, f: Filter) {
    wildcardTextHelper(row.from);
    wildcardTextHelper(row.to);

    var newFilter = getFilterFromForm(row);
    if (newFilter != null) {
        b.updateFilter(f, newFilter);
        b.syncUpdateFilter(newFilter);

        UpdateFilterRow(row, newFilter);
    }
}

//Tracked requests

function AddTrackedRow(table: HTMLElement, req: ITrackedRequest, submitAction: { (f: Filter): void }) {
    if (req.from == null)
        req.from = "";
    var row = CloneByID("filterTemplate") as FilterRow;
    row.del.remove();
    row.from.value = req.from;
    if (req.to != null)
        row.to.value = req.to;
    row.track.checked = req.track;

    fillActionSelect(row.filter, b.settings.defaultNewFilterAction);

    row.from.orig = row.from.value;
    row.to.orig = row.to.value;
    row.fromWild.onclick = function (e) { e.preventDefault(); DomainClick(row.from); };
    row.toWild.onclick = function (e) { e.preventDefault(); DomainClick(row.to); };

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

    //Helpers for wildcard checkbox
    row.from.oninput = function () { wildcardTextHelper(row.from); };
    row.to.oninput = function () { wildcardTextHelper(row.to); };
    table.appendChild(row);
}

//Handle changes in the domain textbox
function wildcardTextHelper(text: HTMLInputElement) {
    var wild = false;
    //Get text and remove space and leading *
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

function fillActionSelect(select: HTMLSelectElement, selectedAction: string, action?: EventListener) {
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

function setSelected(list: HTMLSelectElement, value: string) {
    for (var i = 0; i < list.length; i++) {
        var option: HTMLOptionElement = list.options[i];
        if (option.value == value) {
            option.selected = true;
            return;
        }
    }
}

function endsWith(str: string, suffix: string) {
    if (str == null)
        return false;
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function CloneByID<T extends Element>(id: string): T {
    var source = document.getElementById(id);
    var clone = source.cloneNode(true) as T;
    clone.removeAttribute("id");
    return clone;
}

function RemoveAllChildren(tag: HTMLElement) {
    while (tag.firstChild)
        tag.removeChild(tag.firstChild);
}
