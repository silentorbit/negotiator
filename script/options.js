//
// Script for user manipulation
// in the options page and the popup
//

var b = chrome.extension.getBackgroundPage();

window.onload = function(){
	if(window.location.pathname.indexOf('options.html') > 0)
		updateOptionsPage();
	if(window.location.pathname.indexOf('filters.html') > 0)
		updateFiltersPage();
	if(window.location.pathname.indexOf('tracked.html') > 0)
		updateTrackedPage();
	if(window.location.pathname.indexOf('popup.html') > 0)
		updatePopupPage();
}

//Called at the end of the options page load
function updateOptionsPage()
{
	//Default Actions
	fillActionSelect(document.getElementById('defaultAction'), b.defaultAction, defaultActionClick);
	fillActionSelect(document.getElementById('defaultLocalAction'), b.defaultLocalAction, defaultLocalActionClick);
	fillActionSelect(document.getElementById('defaultLocalTLDAction'), b.defaultLocalTLDAction, defaultLocalTLDActionClick);
	fillActionSelect(document.getElementById('defaultNewFilterAction'),	b.defaultNewFilterAction, defaultNewFilterActionClick);

	//Ignore WWW
	var www = document.getElementById('ignoreWWW');
	www.checked = b.ignoreWWW;
	www.addEventListener('click', ignoreWWWClick);

	//Experimental, pass same
	var passSame = document.getElementById('alwaysPassSame');
	passSame.checked = b.alwaysPassSame;
	passSame.addEventListener('click', alwaysPassSameClick);
	
	//Action List
	updateActions();
	//New action
	document.querySelector('#add').addEventListener('click', addNewAction);

	//Help examples:
	document.querySelector('#examplePass').innerHTML = navigator.userAgent;
	document.querySelector('#exampleRandom').innerHTML = b.getRandomUserAgent();
	document.querySelector('#exampleSimple').innerHTML = b.userAgent;
	document.querySelector('#exampleMinimal').innerHTML = "Mozilla/5.0";
}

function updateFiltersPage()
{
	//Filters
	updateFilters();

	//Test button
	var button = document.querySelector('#testButton');
	if(button) button.addEventListener('click', test);

	//Filter Storage
	var useChromeSync = document.getElementById('useChromeSync');
	useChromeSync.checked = b.useChromeSync;
	useChromeSync.addEventListener('click', 
		function()
		{
			b.setUseChromeSync(useChromeSync.checked);
		});
	
	document.querySelector('#exportJSON').addEventListener('click', exportJSON);
	document.querySelector('#importJSON').addEventListener('click', importJSON);
}

function updateTrackedPage()
{
	//Tracked Requests
	var table = document.getElementById('trackedTable');
	table.appendChild(b.filterHeader.cloneNode(true));//Add headers
	for(var i in b.TrackedRequests)
	{
		var r = b.TrackedRequests[i];
		if(domain != null && r.from != domain && r.to != domain)
			continue;
			
		insertTrackedRow(table, r.from, r.to, function (row) {
			var filter = getFilterFromForm(row);
			b.addFilter(filter);
			b.saveFilters();
			table.removeChild(row);
		});
	}

	var button = document.querySelector('#clearTrackedReload');
	if(button) button.addEventListener('click', clearTrackedReload);
}

function updatePopupPage()
{
}

function clearTrackedReload()
{
	clearTrackedRequests();
	location.reload();
}

function defaultActionClick()
{
	b.setDefaultAction(this.value);
}

function defaultLocalActionClick()
{
	b.setDefaultLocalAction(this.value);
}

function defaultLocalTLDActionClick()
{
	b.setDefaultLocalTLDAction(this.value);
}

function defaultNewFilterActionClick()
{
	b.setDefaultNewFilterAction(this.value);
}

function ignoreWWWClick()
{
	b.setIgnoreWWW(this.checked);
}

function alwaysPassSameClick()
{
	b.setAlwaysPassSame(this.checked);
}

function addNewAction()
{
	return addAction(document.getElementById("actionName").value);
}

function cleanDomain(domain)
{
	domain = domain.trim();
	var wild = domain.indexOf("*") == 0;
	domain = domain.replace(/^[\*\.]+/,'').trim();
	var sep = domain.indexOf("/");
	if(sep >= 0)
		domain = domain.substring(0, sep);
	if(wild)
		domain = "*"+domain;
	return domain;
}

//return whether the domain contain a leading wildcard
function isWild(domain)
{
	if(domain.length = 0)
		return false;
	return domain.indexOf("*") == 0;
}

//return domain without leading wildcard
function withoutWild(domain)
{
	if(isWild(domain))
		return domain.substring(1);
	else
		return domain;
}

//Create a new filter based on the form data
//Return false if the form entry is invalid.
function getFilterFromForm(form)
{
	var f = {
		from: form.from.value,
		to: form.to.value,
		filter: form.filter.value,
		track: form.track.checked
	};

	if(f.from == "" && f.to == "")
		return null;

	//Remove leading dots, and everything after slash
	f.from = cleanDomain(f.from);
	f.to = cleanDomain(f.to);

	if(f.from.indexOf(" ") >= 0 || f.to.indexOf(" ") >= 0){
		alert("domains can't contain spaces");
		return null;
	}
	if(f.from.indexOf("*") > 0 || f.to.indexOf("*") > 0){
		alert("domains can only start with wildcard *");
		return null;
	}
	//Empty is interpreted as wildcard(which includes empty)
	if(f.to == "")
		f.to = "*";

	var toWild = isWild(f.to);
	var toWithout = withoutWild(f.to);
	var fromWild = isWild(f.from);
	var fromWithout = withoutWild(f.from);

	//Remove tracked requests matching filter
	for(var i in b.TrackedRequests){
		var t = b.TrackedRequests[i];

		if(f.from != null && f.from != ""){
			if(fromWild){
				if(endsWith(t.from, withoutWild(f.from)) == false)
					continue;
			}else{
				if(f.from != t.from)
					continue;
			}
		}
		if(f.to != null && f.to != ""){
			if(toWild){
				if(endsWith(t.to, toWithout) == false)
					continue;
			}else{
				if(f.to != t.to)
					continue;
			}
		}
		
		//Remove record
		delete b.TrackedRequests[i];
	}

	return f;
}

function clearTrackedRequests()
{
	b.TrackedRequests = {};
	b.tabRequests = {};
	b.tabFilters = {};
}

function test(){
	var referrer = b.getDomain(document.getElementById("testFrom").value);
	var domain = b.getDomain(document.getElementById("testTo").value);
	var filter = b.getFilter(referrer, domain);

	var result = document.getElementById("testResult");
	if(filter == null)
		result.innerHTML = "no match, default";
	else {
		result.innerHTML = "";
		result.appendChild(b.filterHeader.cloneNode(true));//Add headers
		generateFilterItem(result, filter);
	}
}

//Set by popup page when only filters for one domain is to be shown
var domain;

function setSelected(list, value){
	for(var i = 0; i < list.length; i++){
		var li = list[i];
		if(li.value == value){
			list[i].selected = true;
			return;
		}
	}
}

//Populate Actions list
function updateActions(){
	var tag = document.getElementById('actions');
	for(var i in b.actions)
		tag.appendChild(generateActionRow(i));
}

function updateEnabled(row)
{
	var isBlocked = row.block.value == "true";
	var vis = isBlocked ? "hidden" : "visible";
	row.agent.style.visibility = vis;
	row.referer.style.visibility = vis;
	row.cookie.style.visibility = vis;
	row.accept.style.visibility = vis;
	row.acceptlanguage.style.visibility = vis;
	row.acceptencoding.style.visibility = vis;
	row.acceptcharset.style.visibility = vis;
	row.csp.style.visibility = vis;
	row.customcsp.style.visibility = (isBlocked || row.csp.value != "custom") ? "collapse":"visible";
}

function generateActionRow(i){
	var row = document.getElementById('actionTemplate').cloneNode(true);
	var a = b.actions[i];
	row.filterAction = a;
	
	row.removeAttribute('id');
	//row.className = "filter" + i;
	row.style.background = a.color;

	row.actionName.value = i;
	row.actionName.disabled = true;

	row.color.value = a.color;
	
	setSelected(row.block, a.block);	//Block request
	setSelected(row.agent, a.agent);	//User-Agent
	setSelected(row.referer, a.referer);	//Referer
	setSelected(row.cookie, a.cookie);	//Cookie, Cookie-Set
	setSelected(row.accept, a.accept);	//Accept
	setSelected(row.acceptlanguage, a.acceptlanguage);	//Accept-Language
	setSelected(row.acceptencoding, a.acceptencoding);	//Accept-Encoding
	setSelected(row.acceptcharset, a.acceptcharset);	//Accept-Charset
	setSelected(row.csp, a.csp);	//CSP
	if(a.customcsp != null)
		row.customcsp.value = a.customcsp;

	updateEnabled(row);

	//Automatically save settings when changed
	var save = function(){
		row.filterAction.color = row.color.value;
		row.filterAction.block = row.block.value;
		row.filterAction.agent = row.agent.value;
		row.filterAction.referer = row.referer.value;
		row.filterAction.cookie = row.cookie.value;
		row.filterAction.accept = row.accept.value;
		row.filterAction.acceptlanguage = row.acceptlanguage.value;
		row.filterAction.acceptencoding = row.acceptencoding.value;
		row.filterAction.acceptcharset = row.acceptcharset.value;
		row.filterAction.csp = row.csp.value;
		row.filterAction.customcsp = row.customcsp.value;
		b.saveActions();
		
		row.style.backgroundColor = row.color.value;

		updateEnabled(row);
		return true;
	};
	row.color.oninput = save;
	row.block.onchange = save;
	row.agent.onchange = save;
	row.referer.onchange = save;
	row.cookie.onchange = save;
	row.accept.onchange = save;
	row.acceptlanguage.onchange = save;
	row.acceptencoding.onchange = save;
	row.acceptcharset.onchange = save;
	row.csp.onchange = save;
	row.customcsp.onchange = save;

	row.delete.onclick = function(){
		delete b.actions[this.form.actionName.value];
		return true;
	}
	
	return row;
}
		

function addAction(a){
	if(b.actions[a] != null){
		alert(a + " does already exist");
		return false;
	}

	var action = {color: "green", block: "false"};
	b.actions[a] = action;

	var tag = document.getElementById('actions');
	tag.appendChild(generateActionRow(a));
	tag.appendChild(generateActionRow(a));
	return false;
}

//Filter Import/Export
function exportJSON()
{
	var textJson = document.querySelector('#filterJSON');
	textJson.value = b.exportJson();
}

function importJSON()
{
	var textJson = document.querySelector('#filterJSON');
	b.importJson(textJson.value);
	b.saveFilters();
	updateFilters();
}

//Populate filters list in filter page
function updateFilters(){
	var list = b.filters;

	var filtersBlockedTag = document.getElementById('filtersBlocked');
	var filtersTag = document.getElementById('filters');
	if(filtersTag == null || filtersBlockedTag == null)
		return;
	
	filtersTag.innerHTML = "";
	filtersBlockedTag.innerHTML = "";
	//Add headers
	filtersTag.appendChild(b.filterHeader.cloneNode(true));
	filtersBlockedTag.appendChild(b.filterHeader.cloneNode(true));

	for(var i in list.wild)
		generateFilterList(filtersBlockedTag, filtersTag, list.wild[i]);
		
	for(var i in list){
		if(i == "wild")
			continue;
		generateFilterList(filtersBlockedTag, filtersTag, list[i]);
	}
}

//Fill table with html representaton of a filter list
function generateFilterList(tableBlocked, table, list){
	if(list == null)
		return;
	
	for(var i in list.wild)
	{
		var f = list.wild[i];
		if(f.filter == "block")
			generateFilterItem(tableBlocked, f);
		else
			generateFilterItem(table, f);
	}
		
	for(var i in list) {
		if(i == "wild")
			continue;

		var f = list[i];
		if(f == null)
			continue;
		
		if(f.filter == "block")
			generateFilterItem(tableBlocked, f);
		else
			generateFilterItem(table, f);
	}
}

//Return html representation of a filter
function generateFilterItem(table, f){
	var row = b.filterTemplate.cloneNode(true);
	updateFilterRow(row, f);

	table.appendChild(row);
	return row;
}

function onFilterChange(row, f)
{
	wildcardTextHelper(row.from);
	wildcardTextHelper(row.to);

	var newFilter = getFilterFromForm(row);
	if(newFilter != null)
	{
		b.updateFilter(f, newFilter);
		b.saveFilters();

		updateFilterRow(row, newFilter);
	}
}

function updateFilterRow(row, f)
{
	//Clear events, new ones are added in the end
	row.from.oninput=null;
	row.to.oninput=null;
	row.filter.onchange=null;
	row.track.onchange=null;
	row.onsubmit = null;

	//Update fields
	row.removeAttribute('id');
	row.style.background = b.actions[f.filter].color;
	row.from.value = f.from;
	row.to.value = f.to;
	fillActionSelect(row.filter, f.filter);
	row.track.checked = f.track;
	if(row.add != null)
		row.add.parentNode.removeChild(row.add); //Remove "add"/"save" button

	//Update events with the new filter settings (f)
	row.del.onclick = function(){
		b.deleteFilter(f.from, f.to);
		b.saveFilters();
		row.parentNode.removeChild(row);
		return false;
	};
	row.from.oninput=function(){onFilterChange(row, f);};
	row.to.oninput=function(){onFilterChange(row, f);};
	row.filter.onchange=function(){onFilterChange(row, f);};
	row.track.onchange=function(){onFilterChange(row, f);};
	row.onsubmit = function(){
		onFilterChange(row, f);
		return false;
	};
}

//Tracked requests

function insertTrackedRow(table, from, to, submitAction)
{
	if(from == null)
		from = "";
	var row = b.filterTemplate.cloneNode(true);
	row.removeAttribute('id');
	row.del.style.display = "none";
	row.from.value = from;
	if(to != null)
		row.to.value = to;
	
	fillActionSelect(row.filter, b.defaultNewFilterAction);
	
	row.onsubmit=function(){
		table.removeChild(row);
		submitAction(row);
		return false;
	};
	
	//Helpers for wildcard checkbox
	row.from.oninput=function(){wildcardTextHelper(row.from);};
	row.to.oninput=function(){wildcardTextHelper(row.to);};
	table.appendChild(row);
}

//Chandle changes in the domain textbox
function wildcardTextHelper (text)
{
	var wild = false;
	//Get text and remove space and leading *
	var f = text.value;
	f = f.trim();
	if(f.indexOf("*") == 0)
	{
		f = f.substring(1).trim();
		wild = true;
	}
	f = f.replace("*", "");
	
	if(wild)
		f = "*" + f;
	if(text.value != f)
		text.value = f;
}
	
function fillActionSelect(select, selectedAction, action)
{
	var i = 0;
	for(var f in b.actions)
	{
		select.options[i] = new Option(f, f);
		select.options[i].style.background = b.actions[f].color;
		select.options[i].selected = true;
		i++;
	}
	setSelected(select, selectedAction);
	if(action)
		select.addEventListener('change', action);
}

function endsWith(str, suffix) {
	if(str == null)
		return false;
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
