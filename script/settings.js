
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
function setUseChromeSync(val, callback){
	//Save setting
	useChromeSync = val;
	localStorage.useChromeSync = val;
	//Reload filters
	loadFilters(callback);
}

//Load filters
var filterFromToSeparator = " > ";
var filters;
loadFilters(prepareFilters);

function loadFilters(callback)
{
	if(useChromeSync)
	{
		chrome.storage.sync.get('filters', function(json){ 
			filters = JSON.parse(json.filters);
			callback();
		});
	}
	else
	{
		var json = localStorage.getItem("filter-list");
		if(json != null)
		{
			//New format
			filters = {};
			importJson(json);
		}
		else
		{
			//Legacy format
			var json = localStorage.getItem("filters");
			filters = JSON.parse(json);
			fixLegacyWildcard();
		}
		callback();
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
		exportFiltersTo(f, fw[f], list);
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
		list[from + filterFromToSeparator + f] = generateExportItem(filter);
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
		var json = JSON.stringify(filters, null, '\t');
		chrome.storage.sync.set({'filters': json});
	}
	else
	{
		localStorage.setItem("filter-list", exportJson());
	}
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