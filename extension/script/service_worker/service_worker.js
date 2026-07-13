"use strict";
let tracked = new Map();
chrome.storage.session.get("tracked").then((data) => {
    console.log("get tracked", data);
    if (data.tracked) {
        tracked = deserializeTracked(data.tracked);
    }
});
let isSaveScheduled = false;
function scheduleSave() {
    if (isSaveScheduled)
        return;
    isSaveScheduled = true;
    console.log("scheduleSave");
    setTimeout(() => {
        var data = serializeTracked(tracked);
        console.log("scheduleSave: saving...", data);
        chrome.storage.session.set({ tracked: data });
        isSaveScheduled = false;
    }, 1000);
}
function serializeTracked(map) {
    const result = [];
    for (const [tabId, innerMap] of map.entries()) {
        result.push([tabId, Array.from(innerMap.entries())]);
    }
    return result;
}
function deserializeTracked(data) {
    const map = new Map();
    if (!Array.isArray(data))
        return map;
    for (const [tabId, innerEntries] of data) {
        map.set(tabId, new Map(innerEntries));
    }
    return map;
}
chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: ["<all_urls>"] });
function onBeforeRequest(details) {
    const from = getDomain(details.initiator);
    const to = getDomain(details.url);
    const tabId = details.tabId;
    let tabTracked = tracked.get(tabId);
    if (tabTracked == null) {
        tabTracked = new Map();
        tracked.set(tabId, tabTracked);
    }
    const key = `${from} ${to}`;
    if (tabTracked.has(key) == false) {
        tabTracked.set(key, { from: from, to: to, });
        scheduleSave();
    }
}
function getDomain(url) {
    if (!url)
        return "";
    try {
        return new URL(url).hostname;
    }
    catch (e) {
        return "";
    }
}
chrome.tabs.onRemoved.addListener(onRemoved);
function onRemoved(tabId) {
    if (tracked.has(tabId) == false)
        return;
    tracked.delete(tabId);
    scheduleSave();
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("onMessage", message.action, message);
    switch (message.action) {
        case "getTab":
            getTab(message, sendResponse);
            return true;
        case "getTracked":
            const result = [];
            for (const tabDictionary of tracked.values())
                result.push(...tabDictionary.values());
            sendResponse({ tracked: result });
            return false;
        case "clearTracked":
            tracked.clear();
            return false;
        case "getRules":
            getRules(sendResponse);
            return true;
        case "updateRules":
            updateRules(message, sendResponse);
            return true;
        default:
            console.error("Unhandled action: " + message.action, message);
            return false;
    }
});
async function getTab(message, sendResponse) {
    var trackedResult = [];
    var tabTracked = tracked.get(message.tabId);
    if (!tabTracked) {
        const resp = { tracked: [], rules: [], };
        console.log("getTab", "Nothing tracked, no rules to match", resp);
        sendResponse(resp);
        return;
    }
    trackedResult.push(...tabTracked.values());
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleMap = new Map(dynamicRules.map(rule => [rule.id, rule]));
    const matchingRules = [];
    const unmatchedRequests = [];
    const matchPromises = trackedResult.map(async (trackedRequest) => {
        const outcome = await chrome.declarativeNetRequest.testMatchOutcome({
            url: "https://" + trackedRequest.to,
            type: "main_frame",
            method: "get",
            tabId: 1,
            initiator: "https://" + trackedRequest.from,
        });
        if (outcome.matchedRules && outcome.matchedRules.length > 0) {
            for (const match of outcome.matchedRules) {
                if (ruleMap.has(match.ruleId)) {
                    matchingRules.push(ruleMap.get(match.ruleId));
                }
            }
        }
        else {
            unmatchedRequests.push(trackedRequest);
        }
    });
    await Promise.all(matchPromises);
    const uniqueMatchedRules = [...new Map(matchingRules.map(r => [r.id, r])).values()];
    const resp = {
        tracked: unmatchedRequests,
        rules: uniqueMatchedRules,
    };
    console.log("getTab return", resp);
    sendResponse(resp);
}
async function getRules(sendResponse) {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    sendResponse({ rules: rules });
}
async function updateRules(message, sendResponse) {
    if (message.update.addRules) {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        let nextRuleId = 0;
        rules.forEach(r => nextRuleId = Math.max(nextRuleId, r.id));
        nextRuleId++;
        message.update.removeRuleIds ??= [];
        message.update.addRules?.forEach(rule => {
            if (rule.id == 0) {
                rule.id = nextRuleId++;
            }
            else {
                message.update.removeRuleIds.push(rule.id);
            }
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
