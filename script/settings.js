
//This is the backend settings
//UI to configure settings is options.html/js

//Filter storage, if true use chrome.storage.sync, otherwise use localStorage
var useChromeSync = (localStorage.getItem('useChromeSync') == "true");
function setUseChromeSync(val)
{
	//Save setting
	useChromeSync = val;
	localStorage.useChromeSync = val;

	//Reload
	loadSettings();
	loadActions();
	loadFilters();
}

//Settings
var settings;
loadSettings();

function loadSettings()
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

function saveSettings()
{
	localStorage.settings = JSON.stringify(settings);
}
