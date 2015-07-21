//Load filters
var filters;
loadFilters();

function loadFilters()
{
	//console.log("Filters: loading");
	if(useChromeSync)
	{
		//Try legacy format first
		chrome.storage.sync.get(null, function(list){ 
			if(chrome.runtime.lastError)
			{
				syncError();
				return;
			}

			if(list.filters != null)
			{
				//console.log("Filters: loaded legacy");
			
				//Legacy filters
				filters = JSON.parse(list.filters);
				prepareFilters();
				fixLegacyWildcard();
				return;
			}

			//console.log("Filters: loaded", list);
			filters = {};
			importFilters(list);
		});
	}
	else
	{
		//console.log("Local: loading...");

		var json = localStorage.getItem("filter-list");
		if(json != null)
		{
			//New format
			filters = {};
			importJson(json);
			//console.log("Local: new format loaded");
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
}

function saveFilters()
{
	if(useChromeSync)
	{
		var list = exportFilters();
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
	else
	{
		localStorage.setItem("filter-list", exportJson());
	}
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

		//By default new installs ignore www
		setIgnoreWWW(true);
	}

	if(filters == null)					filters = {};
	if(filters.wild == null)			filters.wild = {};
	if(filters.wild[""] == null)		filters.wild[""] = {};
	if(filters.wild[""].wild == null)	filters.wild[""].wild = {};
}
