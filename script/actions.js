
var actions = {};

//Only called from loadAll()
function loadLocalActions() {
    if (useChromeSync)
        return; //Loaded in loadAll()

    try {
        var json = localStorage.getItem("actions")
        if (json != null) {
            actions = JSON.parse(json);
            return;
        }
    }
    catch (error) {
        logError(error);
    }
}

function saveLocalActions() {
    localStorage.actions = JSON.stringify(actions, null, "\t");
}

