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
	fillActionSelect(document.getElementById('defaultNewFilterAction'),	b.defaultNewFilterAction, defaultNewFilterActionClick);

	//Ignore WWW
	var www = document.getElementById('ignoreWWW');
	www.checked = b.ignoreWWW;
	www.addEventListener('click', ignoreWWWClick);
	
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

	var button = document.querySelector('#testButton');
	if(button) button.addEventListener('click', test);
}

function updateTrackedPage()
{
	//Tracked Requests
	var table = document.getElementById('trackedTable');
	for(var i in b.TrackedRequests)
	{
		var r = b.TrackedRequests[i];
		if(domain != null && r.from != domain && r.to != domain)
			continue;
			
		insertTrackedRow(table, r.from, r.to);
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

function defaultNewFilterActionClick()
{
	b.setDefaultNewFilterAction(this.value);
}

function ignoreWWWClick()
{
	b.setIgnoreWWW(this.checked);
}

function addNewAction()
{
	return addAction(document.getElementById("actionName").value);
}

function addFilter(form)
{
	var f = {
		from: form.from.value,
		fromWild: form.fromWild.checked,
		to: form.to.value,
		toWild: form.toWild.checked,
		filter: form.filter.value
	};

	if(f.from == "" && f.to == "")
		return;

	b.addFilter(f);

	//Remove tracked requests matching filter
	for(var i in b.TrackedRequests){
		var t = b.TrackedRequests[i];

		if(f.from != null && f.from != ""){
			if(f.fromWild){
				if(endsWith(t.from, f.from) == false)
					continue;
			}else{
				if(f.from != t.from)
					continue;
			}
		}
		if(f.to != null && f.to != ""){
			if(f.toWild){
				if(endsWith(t.to, f.to) == false)
					continue;
			}else{
				if(f.to != t.to)
					continue;
			}
		}
		
		//Remove record
		delete b.TrackedRequests[i];
	}
}

function deleteFilter(fromWild, from, toWild, to){
	//Remove leading "* " for wildcard filters
	if(fromWild)
		from = from.substring(2);
	if(toWild)
		to = to.substring(2);
		
	b.deleteFilter(fromWild, from, toWild, to);
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
		result.appendChild(generateFilterItem(filter));
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

function generateActionRow(i){
	var row = b.actionTemplate.cloneNode(true);
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

	row.onsubmit = function(){
		this.filterAction.color = this.color.value;
		this.filterAction.block = this.block.value;
		this.filterAction.agent = this.agent.value;
		this.filterAction.referer = this.referer.value;
		this.filterAction.cookie = this.cookie.value;
		this.filterAction.accept = this.accept.value;
		this.filterAction.acceptlanguage = this.acceptlanguage.value;
		this.filterAction.acceptencoding = this.acceptencoding.value;
		this.filterAction.acceptcharset = this.acceptcharset.value;
		
		b.saveActions();
		return true;
	};

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

//Populate filters list in filter page
function updateFilters(){
	var list = b.filters;

	var filterTag = document.getElementById('filters');
	if(filterTag == null)
		return;
		
	for(var i in list.wild)
		generateFilterList(filterTag, list.wild[i]);
		
	for(var i in list){
		if(i == "wild")
			continue;
		generateFilterList(filterTag, list[i]);
	}
}

//Fill table with html representaton of a filter list
function generateFilterList(table, list){
	if(list == null)
		return;
		
	for(var i in list.wild)
		table.appendChild(generateFilterItem(list.wild[i]));
		
	for(var i in list) {
		if(i == "wild")
			continue;
		if(list[i] == null)
			continue;
		table.appendChild(generateFilterItem(list[i]));
	}
}

//Return html representation of a filter
function generateFilterItem(f){
	var row = b.trackedTemplate.cloneNode(true);
	row.removeAttribute('id');
	row.style.background = b.actions[f.filter].color;
	row.from.value = f.from;
	if(f.fromWild)
		row.from.value = "* " + row.from.value;
	row.fromWild.checked = f.fromWild;
	row.to.value = f.to;
	if(f.toWild)
		row.to.value = "* " + row.to.value;
	row.toWild.checked = f.toWild;
	fillActionSelect(row.filter, f.filter);
	row.add.value = "save";

	var orig = {};
	orig.fromWild = row.fromWild.checked;
	orig.from = row.from.value;
	orig.toWild = row.toWild.checked;
	orig.to = row.to.value;
	
	row.del.onclick = function(){
		deleteFilter(orig.fromWild, orig.from, orig.toWild, orig.to);
		location.reload();
	};
	row.onsubmit = function(){
		deleteFilter(orig.fromWild, orig.from, orig.toWild, orig.to);
		addFilter(row);
		location.reload();
	};
	return row;
}

//Tracked requests

function insertTrackedRow(table, from, to)
{
	if(from == null)
		from = "";
	var row = b.trackedTemplate.cloneNode(true);
	row.removeAttribute('id');
	row.del.style.display = "none";
	row.from.value = from;
	if(to != null)
		row.to.value = to;
	
	fillActionSelect(row.filter, b.defaultNewFilterAction);
	
	row.onsubmit=function(){
		addFilter(row);
		location.reload();
	};
	
	table.appendChild(row);
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
		select.addEventListener('click', action);
}

function endsWith(str, suffix) {
	if(str == null)
		return false;
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
