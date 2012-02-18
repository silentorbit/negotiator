
//This is the backend settings
//UI to configure settings is options.html/js

//Settings

//Default filter: what action to take when no filter match
//We changed the storage key from defaultFilter to defaultAction
var defaultAction = localStorage.getItem('defaultAction') || localStorage.getItem('defaultFilter') || "pass";
function setDefaultFilter(f){
	defaultAction = f;
	localStorage.defaultAction = f;
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
