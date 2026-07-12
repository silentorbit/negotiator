/// <reference path="./service_worker/service_worker.d.ts" />
/// <reference path="./chrome.d.ts" />

async function loadTracked() {
    const tabId = await getActiveTabId();
    const response = await chrome.runtime.sendMessage({ action: "getTracked", tabId: tabId } as serviceRequest) as getTrackedResponse;

    console.log("GotTracked", tabId, response);

    const rows = document.querySelector("#tracked-rows") as HTMLDivElement;
    rows.replaceChildren();
    //First empty row
    rows.appendChild(createRow({
        id: 0, //Set when added
        action: {
            type: "block",
        },
        condition: {
            initiatorDomains: undefined,
            requestDomains: undefined,
        }
    }));
    //Tracked rows
    response.tracked
        .map(t => createRow(
            {
                id: 0, //Set when added
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
    const response = await chrome.runtime.sendMessage({ action: "getRules" } as serviceRequest) as getRulesResponse;

    console.log("GotRules", response);

    const tabId = await getActiveTabId();

    const rows = document.querySelector("#rules-rows") as HTMLDivElement;
    rows.replaceChildren();
    response.rules
        .map(createRow)
        .forEach(row => rows.appendChild(row));
}

function createRow(rule: chrome.declarativeNetRequest.Rule): HTMLFormElement {
    const row = CloneTemplate<HTMLFormElement>("row-template");

    //Wildcard is implied
    const fromDomain = conditionToWildcard( rule.condition.initiatorDomains);
    const toDomain = conditionToWildcard(rule.condition.requestDomains);

    //Autosave existing rules
    const saveOnChange = rule.id == 0 ? ruleChanged : save;

    const inputFrom = row.querySelector<HTMLInputElement>("input.from")!;
    const inputTo = row.querySelector<HTMLInputElement>("input.to")!;
    row.querySelector<HTMLButtonElement>("button.fromWild")!.onclick = () => domainClick(inputFrom, fromDomain, saveOnChange);
    row.querySelector<HTMLButtonElement>("button.toWild")!.onclick = () => domainClick(inputTo, toDomain, saveOnChange);
    inputFrom.value = fromDomain;
    inputFrom.onchange = saveOnChange;
    inputFrom.oninput = wildcardTextHelper;
    inputTo.value = toDomain;
    inputTo.onchange = saveOnChange;
    inputTo.oninput = wildcardTextHelper;

    const selectActionType = row.querySelector<HTMLSelectElement>("select.actionType")!;
    selectActionType.value = rule.action.type;
    selectActionType.onchange = saveOnChange;

    loadModifyHeaders(row.querySelector(".modifyHeadersRequestRows")!, rule.action.requestHeaders);
    loadModifyHeaders(row.querySelector(".modifyHeadersResponseRows")!, rule.action.responseHeaders);
    function loadModifyHeaders(div: HTMLDivElement, headers: chrome.declarativeNetRequest.ModifyHeaderInfo[] | undefined) {
        div.replaceChildren();
        headers?.map(m => createModifyHeaders(headers, m))
            .forEach(row => div.appendChild(row));
    }

    row.querySelector<HTMLButtonElement>(".addRequestHeader")!.onclick = function () {
        var headers = rule.action.requestHeaders ??= [];
        var m = { header: "cookie", operation: "remove", value: "" } as chrome.declarativeNetRequest.ModifyHeaderInfo;
        headers.push(m);
        row.querySelector(".modifyHeadersRequestRows")!.appendChild(createModifyHeaders(headers, m));
        saveOnChange();
    };
    row.querySelector<HTMLButtonElement>(".addResponseHeader")!.onclick = function () {
        var headers = rule.action.responseHeaders ??= [];
        var m = { header: "cookie", operation: "remove", value: "" } as chrome.declarativeNetRequest.ModifyHeaderInfo;
        headers.push(m);
        row.querySelector(".modifyHeadersResponseRows")!.appendChild(createModifyHeaders(headers, m));
        saveOnChange();
    };

    row.onsubmit = async function (e) {
        e.preventDefault();

        await save();

        if (rule.id == 0) {
            //Move to rules table
            row.remove();
            loadRules();
        }
        return true;
    };

    function ruleChanged() {

        //Wildcard is implied
        rule.condition.initiatorDomains = wildcardToCondition(inputFrom.value);
        rule.condition.requestDomains = wildcardToCondition(inputTo.value);
        rule.action.type = selectActionType.value as chrome.declarativeNetRequest.RuleActionType;

        var headers = row.querySelector(".modifyHeaders") as HTMLDivElement;
        if (rule.action.type == "modifyHeaders")
            headers.classList.remove("hidden");
        else
            headers.classList.add("hidden");
    }
    async function save() {
        ruleChanged();
        await chrome.runtime.sendMessage({ action: "updateRules", update: { addRules: [rule] }, } as serviceRequest);
    }

    const deleteButton = row.querySelector<HTMLButtonElement>("button.delete")!;
    const addButton = row.querySelector<HTMLButtonElement>("button.add")!;

    if (rule.id == 0) {
        deleteButton.remove();
    } else {
        addButton.remove();
        deleteButton.onclick = async function () {
            await chrome.runtime.sendMessage({ action: "updateRules", update: { removeRuleIds: [rule.id] }, } as serviceRequest);
            row.remove();
        };
    }

    ruleChanged();
    return row;

    function createModifyHeaders(headers: chrome.declarativeNetRequest.ModifyHeaderInfo[], modify: chrome.declarativeNetRequest.ModifyHeaderInfo): HTMLDivElement {
        const headerDiv = CloneTemplate<HTMLDivElement>("modifyHeaders-template");
        const header = headerDiv.querySelector<HTMLInputElement>(".header")!;
        const operation = headerDiv.querySelector<HTMLSelectElement>(".operation")!;
        const value = headerDiv.querySelector<HTMLInputElement>(".value")!;
        header.value = modify.header;
        operation.value = modify.operation;
        value.value = modify.value ?? "";
        header.onchange = headerRuleChanged;
        operation.onchange = headerRuleChanged;
        value.onchange = headerRuleChanged;

        headerRuleChanged();
        function headerRuleChanged() {
            modify.header = header.value
            modify.operation = operation.value as chrome.declarativeNetRequest.HeaderOperation;
            modify.value = value.value;

            if (operation.value == "remove") {
                delete modify.value;
                value.value = "";
                value.disabled = true;
            } else {
                modify.value = "";
                value.value = "";
                value.disabled = false;
            }
            saveOnChange()
        };

        headerDiv.querySelector<HTMLButtonElement>("button.delete")!.onclick = function () {
            const index = headers.indexOf(modify);
            if (index < 0)
                return;
            headers.splice(index, 1);
            headerDiv.remove();
        };

        return headerDiv;
    }
}

function wildcardToCondition(domain: string): string[] | undefined {
    domain = domain.replace(/^\*.?/, '');
    if (domain == "")
        return undefined;
    return [domain];
}

function conditionToWildcard(arr: string[] | undefined): string {
    if (!arr || arr.length == 0)
        return "*";

    return "*." + arr[0];
}

function domainClick(input: HTMLInputElement, original: string, saveOnChange: () => void): boolean {

    let v = input.value;
    if (v == "*") {
        //Add back original domain
        input.value = original;
    } else {
        //Strip one subdomain
        v = v.replace(/^[*.]*/, "");
        let s = v.split(".");
        if (s.length <= 2) {
            input.value = "*";
        } else {
            s.shift();
            input.value = "*" + s.join(".");
        }
    }

    saveOnChange();
    return false;
}

//Force wildcard while editing
function wildcardTextHelper(ev: Event) {
    const text = ev.target as HTMLInputElement

    let f = "*." + text.value.replace(/^[*.]+/, '');
    if (text.value != f)
        text.value = f;
}

function CloneTemplate<T>(templateID: string): T {
    const template = document.getElementById(templateID) as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const clone = fragment.firstElementChild as T;
    return clone;
}

