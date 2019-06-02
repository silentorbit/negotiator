"use strict";
var errorList = [];
var errorListUpdated = null;
window.onerror = function (message, url, line) {
    logError(line + ": " + url + "\n" + message);
};
function logError(error) {
    var message = error.message.replace(chrome.extension.getURL("/"), "/");
    console.log("Error", message);
    if (errorList.indexOf(message) >= 0)
        return;
    errorList.push(message);
    if (errorListUpdated != null)
        errorListUpdated(errorList);
}
function syncError() {
    var err = chrome.runtime.lastError;
    if (err)
        logError(err.message);
}
function showErrors(document) {
    var list = document.createElement("div");
    errorListUpdated = function () {
        showErrors(document);
        if (document.body.contains(list))
            document.body.removeChild(list);
    };
    if (errorList.length == 0)
        return;
    list.classList.add("errorList");
    document.body.appendChild(list);
    var clear = document.createElement("button");
    clear.textContent = "Clear Errors";
    clear.classList.add("button");
    clear.onclick = function () {
        document.body.removeChild(list);
        errorList = [];
    };
    list.appendChild(clear);
    for (var i in errorList) {
        var item = document.createElement("div");
        item.textContent = errorList[i];
        list.appendChild(item);
    }
}
