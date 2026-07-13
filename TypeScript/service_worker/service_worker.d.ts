
type trackedRequest = {
    from: string;
    to: string;
}

type requestAction = "getTab" | "getTracked" | "clearTracked" | "getRules" | "updateRules";

type serviceRequest = {
    action: requestAction;
    tabId: number;
    update: chrome.declarativeNetRequest.UpdateRuleOptions;
}

type getTabResponse = {
    tracked: trackedRequest[];
    rules: chrome.declarativeNetRequest.Rule[];
}

type getTrackedResponse = {
    tracked: trackedRequest[];
}

type getRulesResponse = {
    rules: chrome.declarativeNetRequest.Rule[];
}

type updateRulesResponse = {
    update: chrome.declarativeNetRequest.UpdateRuleOptions;
}

