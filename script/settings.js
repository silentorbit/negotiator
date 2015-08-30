
//This is the backend settings
//UI to configure settings is options.html/js

//Filter storage
//Upgrade setting
if (localStorage.getItem("useChromeSync") == "true") //if true use chrome.storage.sync, otherwise use localStorage
{
    localStorage.setItem("storageType", "chrome");
    localStorage.removeItem("useChromeSync");
}
var storageType = localStorage.getItem("storageType");
if (storageType == null)
    storageType = "local";
var storageUrl = localStorage.getItem("storageUrl");

function setStorage(type, url) {
    //Save setting
    storageType = type;
    storageUrl = url;
    localStorage.storageType = storageType;
    localStorage.storageUrl = storageUrl;

    //Reload
    loadAll();
}

//Settings
var settings = {};

//Only called from loadAll()
function loadLocalSettings() {
    try {
        var json = localStorage.settings;
        if (json) {
            settings = JSON.parse(json);
            return;
        }
    }
    catch (error) {
        logError(error);
    }

    //Load old formats
    settings = loadLegacySettings();
}

function saveLocalSettings() {
    localStorage.settings = JSON.stringify(settings);
}
