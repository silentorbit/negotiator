
//This is the backend settings
//UI to configure settings is options.html/js

//Settings

//Default filter
var defaultFilter = localStorage.getItem('defaultFilter') || "pass";
function setDefaultFilter(f){
	defaultFilter = f;
	localStorage.defaultFilter = f;
}

//Ignore leading www.
var ignoreWWW = (localStorage.getItem('ignoreWWW') == "true");
function setIgnoreWWW(enabled){
	ignoreWWW = enabled;
	localStorage.ignoreWWW = enabled;
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
		ccceptlanguage: "pass",
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
	localStorage.actions = JSON.stringify(actions);
}

//Load filters
var filters = JSON.parse(localStorage.getItem("filters"));

//First time the filter is filled with entries from blockedDomains
if(filters == null){
	//Fill with embedded block list
	filters = {};
	filters[""] = {};
	filters[""].wild = {};
	
	for(var i in blockedDomains)
	{
		var f = {
			from: "",
			fromWild: false,
			to: blockedDomains[i],
			toWild: true,
			filter: "block"
		};
		filters[""].wild[f.to] = f;
	}

	//By default new installs ignore www
	setIgnoreWWW(true);
}
if(filters.wild == null)
	filters.wild = {};

function saveFilters(){
	localStorage.filters = JSON.stringify(filters);
}
