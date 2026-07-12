"use strict";
async function loadTracked() {
    const tabId = await getActiveTabId();
    const response = await chrome.runtime.sendMessage({ action: "getTracked", tabId: tabId });
    console.log("GotTracked", tabId, response);
    const rows = document.querySelector("#tracked-rows");
    rows.replaceChildren();
    rows.appendChild(createRow({
        id: 0,
        action: {
            type: "block",
        },
        condition: {
            initiatorDomains: undefined,
            requestDomains: undefined,
        }
    }));
    response.tracked
        .map(t => createRow({
        id: 0,
        action: {
            type: "block",
        },
        condition: {
            initiatorDomains: wildcardToCondition(t.from),
            requestDomains: wildcardToCondition(t.to),
        }
    }))
        .forEach((row) => rows.appendChild(row));
}
async function loadRules() {
    const response = await chrome.runtime.sendMessage({ action: "getRules" });
    console.log("GotRules", response);
    const tabId = await getActiveTabId();
    const rows = document.querySelector("#rules-rows");
    rows.replaceChildren();
    response.rules
        .map(createRow)
        .forEach(row => rows.appendChild(row));
}
function createRow(rule) {
    const row = CloneTemplate("row-template");
    const fromDomain = conditionToWildcard(rule.condition.initiatorDomains);
    const toDomain = conditionToWildcard(rule.condition.requestDomains);
    const saveOnChange = rule.id == 0 ? ruleChanged : save;
    const inputFrom = row.querySelector("input.from");
    const inputTo = row.querySelector("input.to");
    row.querySelector("button.fromWild").onclick = () => domainClick(inputFrom, fromDomain, saveOnChange);
    row.querySelector("button.toWild").onclick = () => domainClick(inputTo, toDomain, saveOnChange);
    inputFrom.value = fromDomain;
    inputFrom.onchange = saveOnChange;
    inputTo.value = toDomain;
    inputTo.onchange = saveOnChange;
    const selectActionType = row.querySelector("select.actionType");
    selectActionType.value = rule.action.type;
    selectActionType.onchange = saveOnChange;
    loadModifyHeaders(row.querySelector(".modifyHeadersRequestRows"), rule.action.requestHeaders);
    loadModifyHeaders(row.querySelector(".modifyHeadersResponseRows"), rule.action.responseHeaders);
    function loadModifyHeaders(div, headers) {
        div.replaceChildren();
        headers?.map(m => createModifyHeaders(headers, m))
            .forEach(row => div.appendChild(row));
    }
    row.querySelector(".addRequestHeader").onclick = function () {
        var headers = rule.action.requestHeaders ??= [];
        var m = { header: "cookie", operation: "remove", value: "" };
        headers.push(m);
        row.querySelector(".modifyHeadersRequestRows").appendChild(createModifyHeaders(headers, m));
        saveOnChange();
    };
    row.querySelector(".addResponseHeader").onclick = function () {
        var headers = rule.action.responseHeaders ??= [];
        var m = { header: "cookie", operation: "remove", value: "" };
        headers.push(m);
        row.querySelector(".modifyHeadersResponseRows").appendChild(createModifyHeaders(headers, m));
        saveOnChange();
    };
    row.onsubmit = async function (e) {
        e.preventDefault();
        await save();
        if (rule.id == 0) {
            row.remove();
            loadRules();
        }
        return true;
    };
    function ruleChanged() {
        if (!row.reportValidity())
            return;
        rule.condition.initiatorDomains = wildcardToCondition(inputFrom.value);
        rule.condition.requestDomains = wildcardToCondition(inputTo.value);
        rule.action.type = selectActionType.value;
        var headers = row.querySelector(".modifyHeaders");
        if (rule.action.type == "modifyHeaders")
            headers.classList.remove("hidden");
        else
            headers.classList.add("hidden");
    }
    async function save() {
        if (!row.reportValidity())
            return;
        ruleChanged();
        await chrome.runtime.sendMessage({ action: "updateRules", update: { addRules: [rule] }, });
    }
    const deleteButton = row.querySelector("button.delete");
    const addButton = row.querySelector("button.add");
    if (rule.id == 0) {
        deleteButton.remove();
    }
    else {
        addButton.remove();
        deleteButton.onclick = async function () {
            await chrome.runtime.sendMessage({ action: "updateRules", update: { removeRuleIds: [rule.id] }, });
            row.remove();
        };
    }
    ruleChanged();
    return row;
    function createModifyHeaders(headers, modify) {
        const headerDiv = CloneTemplate("modifyHeaders-template");
        const header = headerDiv.querySelector(".header");
        const operation = headerDiv.querySelector(".operation");
        const value = headerDiv.querySelector(".value");
        header.value = modify.header;
        operation.value = modify.operation;
        value.value = modify.value ?? "";
        header.onchange = headerRuleChanged;
        operation.onchange = headerRuleChanged;
        value.onchange = headerRuleChanged;
        headerRuleChanged();
        function headerRuleChanged() {
            modify.header = header.value;
            modify.operation = operation.value;
            modify.value = value.value;
            if (operation.value == "remove") {
                delete modify.value;
                value.value = "";
                value.disabled = true;
            }
            else {
                modify.value ??= "";
                value.disabled = false;
            }
            saveOnChange();
        }
        ;
        headerDiv.querySelector("button.delete").onclick = function () {
            const index = headers.indexOf(modify);
            if (index < 0)
                return;
            headers.splice(index, 1);
            headerDiv.remove();
        };
        return headerDiv;
    }
}
function wildcardToCondition(domain) {
    domain = domain.replace(/^\*.?/, '');
    if (domain == "")
        return undefined;
    return [domain];
}
function conditionToWildcard(arr) {
    if (!arr || arr.length == 0)
        return "*";
    return "*." + arr[0];
}
function domainClick(input, original, saveOnChange) {
    let v = input.value;
    if (v == "*") {
        input.value = original;
    }
    else {
        v = v.replace(/^[*.]*/, "");
        let s = v.split(".");
        if (s.length <= 2) {
            input.value = "*";
        }
        else {
            s.shift();
            input.value = "*" + s.join(".");
        }
    }
    saveOnChange();
    return false;
}
function CloneTemplate(templateID) {
    const template = document.getElementById(templateID);
    const fragment = template.content.cloneNode(true);
    const clone = fragment.firstElementChild;
    return clone;
}
