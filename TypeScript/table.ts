/// <reference path="./service_worker/service_worker.d.ts" />
/// <reference path="./chrome.d.ts" />
/// <reference path="./table.d.ts" />

async function loadTracked() {
    const tabId = await getActiveTabId();
    const response = await chrome.runtime.sendMessage({ action: "getTracked", tabId: tabId } as serviceRequest) as getTrackedResponse;

    console.log("GotTracked", tabId, response);

    const rows = document.getElementById("tracked-rows") as HTMLDivElement;
    rows.replaceChildren();
    addTrackedRow(rows, { from: "", to: "" });
    response.tracked.forEach(t => {
        addTrackedRow(rows, t);
    });
}

function addTrackedRow(rows: HTMLElement, tracked: trackedRequest) {

    const row = CloneRowTemplate()
    row.fromWild.onclick = () => domainClick(row.from, tracked.from);
    row.from.value = tracked.from;
    row.toWild.onclick = () => domainClick(row.to, tracked.to);
    row.to.value = tracked.to;
    row.actionType.value = "block";

    row.onsubmit = async function (e) {
        e.preventDefault();

        const type = row.actionType.value as chrome.declarativeNetRequest.RuleActionType;

        await chrome.runtime.sendMessage({
            action: "updateRules",
            update: {
                addRules: [
                    {
                        id: 0, //Set later
                        action: {
                            type: type,
                        },
                        condition: {
                            initiatorDomains: [row.from.value],
                            requestDomains: [row.to.value]
                        }
                    }
                ]
            },
        } as serviceRequest);

        rows.removeChild(row);

        loadRules();

        return true;
    };

    //Helpers for wildcard checkbox
    row.from.oninput = function () { wildcardTextHelper(row.from); };
    row.to.oninput = function () { wildcardTextHelper(row.to); };
    rows.appendChild(row);
}

async function loadRules() {
    const response = await chrome.runtime.sendMessage({ action: "getRules" } as serviceRequest) as getRulesResponse;

    console.log("GotRules", response);

    const tabId = await getActiveTabId();

    const rows = document.getElementById("rules-rows") as HTMLDivElement;
    rows.replaceChildren();
    response.rules.forEach(rule => {

        const row = CloneRowTemplate();
        const from = rule.condition.initiatorDomains![0];
        row.fromWild.onclick = () => domainClick(row.from, from, save);
        row.from.value = from;
        row.from.onchange = save;
        const to = rule.condition.requestDomains![0];
        row.toWild.onclick = () => domainClick(row.to, to, save);
        row.to.value = to;
        row.to.onchange = save;
        row.actionType.value = rule.action.type;
        row.add.remove();
        row.actionType.onchange = save;

        row.onsubmit = function (e) {
            e.preventDefault();
            save();
            return true;
        };
        async function save() {
            rule.condition.initiatorDomains = [row.from.value];
            rule.condition.requestDomains = [row.to.value];
            rule.action.type = row.actionType.value as chrome.declarativeNetRequest.RuleActionType;

            await chrome.runtime.sendMessage({
                action: "updateRules",
                update: {
                    addRules: [rule]
                },
            } as serviceRequest);
        }

        row.delete.onclick = async () => {

            await chrome.runtime.sendMessage({
                action: "updateRules",
                update: {
                    removeRuleIds: [rule.id]
                },
            } as serviceRequest);

            row.remove();
        }
        rows.appendChild(row);
    });
}

function domainClick(input: HTMLInputElement, original: string, save: () => void): boolean {

    let v = input.value;
    if (v == "*") {
        //Add back original domain
        input.value = original;
    } else if (v.indexOf("*") == 0) {
        //Strip one subdomain
        v = v.replace("*", "");
        let s = v.split(".");
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

    save();
    return false;
}

//Handle changes in the domain textbox
function wildcardTextHelper(text: HTMLInputElement) {
    let wild = false;
    //Get text and remove space and leading *
    let f = text.value;
    f = f.trim();
    if (f.startsWith("*")) {
        f = f.substring(1).trim();
        wild = true;
    }
    f = f.replace("*", "");

    if (wild)
        f = "*" + f;
    if (text.value != f)
        text.value = f;
}

function CloneRowTemplate(): RowForm {
    const template = document.getElementById("row-template") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const clone = fragment.firstElementChild as RowForm;
    return clone;
}

