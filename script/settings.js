
//This is the backend settings
//UI to configure settings is options.html/js

//Settings

//Default filter: what action to take when no filter match
//We changed the storage key from defaultFilter to defaultAction
var defaultAction = localStorage.getItem('defaultAction') || localStorage.getItem('defaultFilter') || "pass";
function setDefaultAction(f){
	defaultAction = f;
	localStorage.defaultAction = f;
}

//This one is used when the referer is empty or the request is within the same domain
var defaultLocalAction = localStorage.getItem('defaultLocalAction') || "pass";
function setDefaultLocalAction(f){
	defaultLocalAction = f;
	localStorage.defaultLocalAction = f;
}

//This one is used when the TLD is the same such as www.example.com -> static.example.com
var defaultLocalTLDAction = localStorage.getItem('defaultLocalTLDAction') || defaultAction;
function setDefaultLocalTLDAction(f){
	defaultLocalTLDAction = f;
	localStorage.defaultLocalTLDAction = f;
}

//Default new filter: what the preselected action for new filters are
var defaultNewFilterAction = localStorage.getItem('defaultNewFilterAction') || "block";
function setDefaultNewFilterAction(f){
	defaultNewFilterAction = f;
	localStorage.defaultNewFilterAction = f;
}

//Ignore leading www.
var ignoreWWW = (localStorage.getItem('ignoreWWW') == "true");
function setIgnoreWWW(enabled){
	ignoreWWW = enabled;
	localStorage.ignoreWWW = enabled;
}

//Experimental: allow bar>bar when block:*>bar is set
var alwaysPassSame = (localStorage.getItem('alwaysPassSame') == "true");
function setAlwaysPassSame(enabled){
	alwaysPassSame = enabled;
	localStorage.alwaysPassSame = enabled;
}

//Load actions
var actions = JSON.parse(localStorage.getItem("actions"));
if(actions == null){
	//Load default actions
	actions = {};
	
	actions.pass = {
		color: "#4f4",
		block: "false"
	}

	actions.clear = {
		color: "#8ce",
		block: "false",
		agent: "pass",
		referer: "remove",
		cookie: "remove",
		accept: "pass",
		acceptlanguage: "pass",
		acceptencoding: "pass",
		acceptcharset: "pass"
	}

	actions.block = {
		color: "#f64",
		block: "true"
	}
	saveActions();
}
function saveActions(){
	localStorage.actions = JSON.stringify(actions, null, '\t');
}

//Filter storage, if true use chrome.storage.sync, otherwise use localStorage
var useChromeSync = (localStorage.getItem('useChromeSync') == "true");
function setUseChromeSync(val){
	//Save setting
	useChromeSync = val;
	localStorage.useChromeSync = val;
	//Reload filters
	loadFilters();
}

//Load filters
var filterFromToSeparator = " > ";
var filters;
loadFilters();

chrome.storage.onChanged.addListener(syncChanged);

function syncChanged(changed, namespace)
{
	if(namespace != "sync")
		return;
	if(!useChromeSync)
		return;

	for(var k in changed)
	{
	//console.log("Filters: changed: " + k);
		var c = changed[k];
		var sep = k.indexOf(filterFromToSeparator);
		if(sep < 0)
			continue;
		var from = k.substring(0, sep);
		var to = k.substring(sep + filterFromToSeparator.length);
		if(c.oldValue)
		{
			deleteFilter(from, to);
		}
		if(c.newValue)
		{
			var f = c.newValue;
			f.from = from;
			f.to = to;
			addFilter(f);
		}
	}
}

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

function importJson(json)
{
	var list = JSON.parse(json);
	importFilters(list);
}
function exportJson()
{
	return JSON.stringify(exportFilters(), null, '\t');
}

function importFilters(list)
{
	for(var k in list)
	{
		var f = list[k];
		var sep = k.indexOf(filterFromToSeparator);
		if(sep < 0)
			continue;
		f.from = k.substring(0, sep);
		f.to = k.substring(sep + filterFromToSeparator.length);
		addFilter(f);
	}
	prepareFilters();
}
function exportFilters()
{
	//Scan all filters and generate a single list
	var list = {};

	for(var f in filters)
	{
		if(f == "wild")
			continue;
		exportFiltersTo(f, filters[f], list);
	}
	var fw = filters.wild;
	for(var f in fw)
	{
		exportFiltersTo("*" + f, fw[f], list);
	}

	return list;
}
function exportFiltersTo(from, filters, list)
{
	if(filters == null)
		return;

	for(var f in filters)
	{
		if(f == "wild")
			continue;
		var filter = filters[f];
		if(filter == null)
			continue;
		list[from + filterFromToSeparator + f] = generateExportItem(filter);
	}
	var fw = filters.wild;
	for(var f in fw)
	{
		var filter = fw[f];
		if(filter == null)
			continue;
		list[from + filterFromToSeparator + "*" + f] = generateExportItem(filter);
	}
}
function generateExportItem(f)
{
	var i = {
		filter: f.filter,
	};
	if(f.track)
		i.track = true;
	return i;
}


function saveFilters(){
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

function saveFilter(filter)
{
	if(!useChromeSync)
		return;

	var i = {};
	i[filter.from + filterFromToSeparator + filter.to] = generateExportItem(filter);
	//console.log("Sync: Saving single filter", i);
	chrome.storage.sync.set(i, function()
	{
		if(chrome.runtime.lastError)
		{
			logError(chrome.runtime.lastError);
		}
	});
}

function prepareFilters()
{
	//First time
	if(filters == null){
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

function fixLegacyWildcard()
{
	//Fix from, to wildcards
	for(var i in filters)
	{
		if(i == "wild")
			continue;
		fixLegacyWildcardFrom(filters[i], false);
	}
	var fw = filters.wild;
	for(var i in fw)
	{
		fixLegacyWildcardFrom(fw[i], true);
	}
}
function fixLegacyWildcardFrom(list, fromWild)
{
	if(list == null)
		return;

	//Fix from, to wildcards
	for(var i in list)
	{
		if(i == "wild")
			continue;
		fixLegacyWildcardTo(list[i], fromWild, false);
	}
	var fw = list.wild;
	for(var i in fw)
	{
		fixLegacyWildcardTo(fw[i], fromWild, true);
	}
}
function fixLegacyWildcardTo(f, fromWild, toWild)
{
	if(f == null)
		return;
	if(fromWild && !isWild(f.from))
		f.from = "*" + f.from;
	if(toWild && !isWild(f.to))
		f.to = "*" + f.to;
}