//Load filters
var filters = {};

//Only called from loadAll()
function loadLocalFilters()
{
	if(useChromeSync)
		return; //Loaded in loadAll();
	
	var json = localStorage.getItem("filter-list");
	if(json != null)
	{
		//New format
		filters = {};
		prepareFilters();
		importJson(json);
	}
	else
	{
		//Legacy format
		var json = localStorage.getItem("filters");
		filters = JSON.parse(json);
		prepareFilters();
		fixLegacyWildcard();
	}
}

function saveLocalFilters()
{
	localStorage.setItem("filter-list", exportJson());
}

function saveAll()
{
	//Always save locally
	saveLocalAll();

	if(useChromeSync)
	{
		var list = exportAll();
		//console.log("Filters: saving all", list);
		chrome.storage.sync.set(list, function()
		{
			if(chrome.runtime.lastError)
			{
				logError(chrome.runtime.lastError);
			}
			else
			{
				//Remove legacy code
				if(!chrome.runtime.lastError)
				{
					//console.log("Filters: removing legacy, filters");
					chrome.storage.sync.remove("filters", syncError);
				}
			}
		});
	}
}
function saveLocalAll()
{
	saveLocalSettings();
	saveLocalActions();
	saveLocalFilters();
}

function prepareFilters()
{
	//First time
	if(filters == null)
	{
		//Fill with embedded block list
		filters = {};
		filters.wild = {};
		filters.wild[""] = {};
		filters.wild[""].wild = {};
	}

	if(filters == null)					filters = {};
	if(filters.wild == null)			filters.wild = {};
	if(filters.wild[""] == null)		filters.wild[""] = {};
	if(filters.wild[""].wild == null)	filters.wild[""].wild = {};
}
