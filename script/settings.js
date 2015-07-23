
//This is the backend settings
//UI to configure settings is options.html/js

//Filter storage, if true use chrome.storage.sync, otherwise use localStorage
var useChromeSync = (localStorage.getItem("useChromeSync") == "true");
function setUseChromeSync(val)
{
	//Save setting
	useChromeSync = val;
	localStorage.useChromeSync = val;

	//Reload
	loadAll();
}

//Settings
var settings = {};

//Only called from loadAll()
function loadLocalSettings()
{
	try
	{
		var json = localStorage.settings;
		if(json)
		{
			settings = JSON.parse(json);
			return;
		}
	}
	catch(error)
	{
		logError(error);
	}

	//Load old formats
	settings = loadLegacySettings();
}

function saveLocalSettings()
{
	localStorage.settings = JSON.stringify(settings);
}
