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
        case "getTab":
            getTab(message, sendResponse);
            return true;
        case "getTracked":
            const result = [];
            for (const tabDictionary of tracked.values())
                result.push(...tabDictionary.values());
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

async function getTab(message: serviceRequest, sendResponse: (response: getTabResponse) => void): Promise<void> {
    //Tab specific tracked
    var trackedResult: trackedRequest[] = [];
    var tabTracked = tracked.get(message.tabId);
    if (!tabTracked) {
        const resp = { tracked: [], rules: [], } as getTabResponse
        console.log("getTab", "Nothing tracked, no rules to match", resp);
        sendResponse(resp);
        return;
    }
    trackedResult.push(...tabTracked.values());

    //Find matching rules, remove matching tracked
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleMap = new Map(dynamicRules.map(rule => [rule.id, rule]));
    const matchingRules: chrome.declarativeNetRequest.Rule[] = [];
    const unmatchedRequests: trackedRequest[] = [];

    // Test each request in the cache against active DNR rules
    const matchPromises = trackedResult.map(async (trackedRequest) => {

        // Construct the test request using webRequest details
        const outcome = await chrome.declarativeNetRequest.testMatchOutcome({
            url: "https://" + trackedRequest.to,
            type: "main_frame",
            method: "get",
            tabId: 1,
            initiator: "https://" + trackedRequest.from,
        });

        if (outcome.matchedRules && outcome.matchedRules.length > 0) {
            // Store the rule and DROP the request from cache.
            for (const match of outcome.matchedRules) {
                if (ruleMap.has(match.ruleId)) {
                    matchingRules.push(ruleMap.get(match.ruleId)!);
                }
            }
        } else {
            // 3b. No match. KEEP the request in the cache.
            unmatchedRequests.push(trackedRequest);
        }
    });

    // Wait for all test outcomes to resolve
    await Promise.all(matchPromises);

    // Deduplicate the matched rules (in case multiple requests hit the same rule)
    const uniqueMatchedRules = [...new Map(matchingRules.map(r => [r.id, r])).values()];

    const resp = {
        tracked: unmatchedRequests,
        rules: uniqueMatchedRules,
    } as getTabResponse;
    console.log("getTab return", resp);
    sendResponse(resp);
}

async function getRules(sendResponse: (response: getRulesResponse) => void) {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    sendResponse({ rules: rules });
}

async function updateRules(message: serviceRequest, sendResponse: (response: updateRulesResponse) => void) {

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

            //Always apply to all types
            rule.condition.resourceTypes =
                [
                    "object",
                    "main_frame",
                    "sub_frame",
                    "stylesheet",
                    "script",
                    "image",
                    "font",
                    "xmlhttprequest",
                    "ping",
                    "csp_report",
                    "media",
                    "websocket",
                    "webtransport",
                    "webbundle",
                    "other"
                ];
        });
    }

    await chrome.declarativeNetRequest.updateDynamicRules(message.update);

    console.log("updateRules", message.update);

    sendResponse(message);
}
