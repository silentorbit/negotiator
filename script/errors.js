"use strict";

// List of errors to present to the user
var errorList = [];
var errorListUpdated = null; //Callback if an error occurred

window.onerror = logUncaught;

function logUncaught(message, url, line) {
    logError(line + ": " + url + "\n" + message);
}

function logError(message) {
    console.log("Error", message);
    if (errorList.indexOf(message) >= 0)
        return; //Prevent duplicates
    errorList.push(message);
    if (errorListUpdated != null)
        errorListUpdated(errorList);
}

function syncError() {
    var err = chrome.runtime.lastError;
    if (err)
        logError(err.message);
}

function showErrors(document)//If any
{
    var list = document.createElement("div");

    //Listen to new errors even if we don"t have any right now
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
    //List of errors
    for (var i in errorList) {
        var item = document.createElement("div");
        item.textContent = errorList[i];
        list.appendChild(item);
    }
}

//setInterval(function(){
//	logError("tick" + new Date());
//}, 3000);
