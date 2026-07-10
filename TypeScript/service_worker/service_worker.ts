/// <reference path="./service_worker.d.ts" />
/// <reference path="../chrome.d.ts" />

// In-memory store for requests
let tracked = new Map<number, Map<string, trackedRequest>>();

// Load data from session storage when the Service Worker wakes up
chrome.storage.session.get("tracked").then((data) => {
    console.log("get tracked", data);
    if (data.tracked) {
        tracked = deserializeTracked(data.tracked as any);
    }
});
let isSaveScheduled = false;
// Debounce saves to prevent hammering the Chrome Storage API
function scheduleSave() {
    if (isSaveScheduled) return; // A save is already queued up

    isSaveScheduled = true;

    console.log("scheduleSave");
    setTimeout(() => {
        var data = serializeTracked(tracked);
        console.log("scheduleSave: saving...", data);
        chrome.storage.session.set({ tracked: data });
        isSaveScheduled = false; // Open the gate for the next batch
    }, 1000);
}

// Convert nested Map to an Array of tuples for JSON serialization
function serializeTracked(map: Map<number, Map<string, trackedRequest>>): [number, [string, trackedRequest][]][] {
    const result: [number, [string, trackedRequest][]][] = [];
    for (const [tabId, innerMap] of map.entries()) {
        result.push([tabId, Array.from(innerMap.entries())]);
    }
    return result;
}

// Convert stored Arrays back into the nested Map
function deserializeTracked(data: [number, [string, trackedRequest][]][]): Map<number, Map<string, trackedRequest>> {
    const map = new Map<number, Map<string, trackedRequest>>();
    if (!Array.isArray(data)) return map;

    for (const [tabId, innerEntries] of data) {
        map.set(tabId, new Map(innerEntries));
    }
    return map;
}

// Track network requests before blocking
chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: ["<all_urls>"] });
//Only non blocked requests
//chrome.webRequest.onResponseStarted.addListener(onBeforeRequest, { urls: ["<all_urls>"] });

function onBeforeRequest(details: chrome.webRequest.OnBeforeRequestDetails): undefined {

    const from = getDomain(details.initiator);
    const to = getDomain(details.url);

    //console.log("onBeforeRequest", details.initiator, details.url, t);

    const tabId = details.tabId;

    let tabTracked = tracked.get(tabId);
    if (tabTracked == null) {
        tabTracked = new Map<string, trackedRequest>()
        tracked.set(tabId, tabTracked);
    }

    const key = `${from} ${to}`;
    if (tabTracked.has(key) == false) {
        tabTracked.set(key, { from: from, to: to, } as trackedRequest);
        scheduleSave(); // Trigger a save to session storage
    }
}

function getDomain(url?: string) {
    if (!url) return "";
    try {
        return new URL(url).hostname;
    } catch (e) {
        return ""; // Fallback for invalid URLs
    }
}

//Clear tracked of closed tabs
chrome.tabs.onRemoved.addListener(onRemoved);
function onRemoved(tabId: number) {
    if (tracked.has(tabId) == false)
        return;

    tracked.delete(tabId);
    scheduleSave();
}

// Handle commands from the popup UI
chrome.runtime.onMessage.addListener((message: serviceRequest, sender, sendResponse) => {
    console.log("onMessage", message.action, message);

    switch (message.action) {

        case "getTracked":
            const result = [];
            if (message.tabId == 0) {
                for (const tabDictionary of tracked.values())
                    result.push(...tabDictionary.values());
            } else {
                var tabTracked = tracked.get(message.tabId);
                if (tabTracked)
                    result.push(...tabTracked.values());
            }
            sendResponse({ tracked: result } as getTrackedResponse);
            return false;

        case "clearTracked":
            tracked.clear();
            return false;

        case "getRules":
            getRules(sendResponse);
            return true; //true: will use sendResponse async

        case "updateRules":
            updateRules(message, sendResponse);
            return true; //true: will use sendResponse async

        default:
            console.error("Unhandled action: " + message.action, message);
            return false;
    }
});

async function getRules(sendResponse: (response?: any) => void) {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    sendResponse({ rules: rules });
}

async function updateRules(message: serviceRequest, sendResponse: (response?: any) => void) {

    // Set id for addRules
    if (message.update.addRules) {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        let nextRuleId = 0;
        rules.forEach(r => nextRuleId = Math.max(nextRuleId, r.id));
        nextRuleId++; //one above highest

        message.update.removeRuleIds ??= [];
        message.update.addRules?.forEach(rule => {
            if (rule.id == 0) {
                rule.id = nextRuleId++;
            }
            else {
                message.update.removeRuleIds!.push(rule.id);
            }
        });
    }

    await chrome.declarativeNetRequest.updateDynamicRules(message.update);

    console.log("updateRules", message.update);

    sendResponse(message as updateRulesResponse);
}
