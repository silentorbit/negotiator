
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

//Load filters
var filters = JSON.parse(localStorage.getItem("filters"));

function saveFilters(){
	localStorage.filters = JSON.stringify(filters, null, '\t');
}

//First time
if(filters == null){
	//Fill with embedded block list
	filters = {};
	filters.wild = {};
	filters.wild[""] = {};
	filters.wild[""].wild = {};
	var wildToWild = filters.wild[""].wild;

	//By default new installs ignore www
	setIgnoreWWW(true);
}

if(filters.wild == null)
	filters.wild = {};

if(filters[""] != null){
	//Uppgrade from [""] to .wild[""]
	var list = filters[""];
	//Prepare .wild[""]
	if(filters.wild[""] == null)
		filters.wild[""] = {};
	var fromWildList = filters.wild[""];
	if(fromWildList.wild == null)
		fromWildList.wild = {};

	//Format old wildcard [""]
	for(ti in list){
		if(ti == "wild"){
			//toWild
			for(twi in list.wild){
				fromWildList.wild[twi] = list.wild[twi];
				fromWildList.wild[twi].fromWild = true;
			}
		}else{
			fromWildList[ti] = list[ti];
			fromWildList[ti].fromWild = true;
		}
	}

	//remove old version of converted filters
	filters[""] = null;

	//Save changes
	saveFilters();
}


bugFix();
function bugFix()
{
	if(filters.wild[""].wild == null)
		filters.wild[""].wild = {};

	//Bugfix: toWild=true filters in filters.wild[""]["asd.com"] should be located in filters.wild[""].wild["asd.com"]
	var wrong = filters.wild[""];
	var right = filters.wild[""].wild;
	
	for(i in wrong){
		if(i == "wild")
			continue;
		if(wrong[i].toWild == false)
			continue;
		right[i] = wrong[i];
		delete wrong[i];
	}
	saveFilters();
}
