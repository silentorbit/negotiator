//
// Script for user manipulation
// in the options page and the popup
//

var b = chrome.extension.getBackgroundPage();

window.onerror = b.logUncaught;
window.addEventListener("load", function(){	b.showErrors(document); }, false);

//Shared between tracked and popup
function cleanDomain(domain)
{
	domain = domain.trim();
	var wild = domain.indexOf("*") == 0;
	domain = domain.replace(/^[\*\.]+/,"").trim();
	var sep = domain.indexOf("/");
	if(sep >= 0)
		domain = domain.substring(0, sep);
	if(wild)
		domain = "*"+domain;
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

	if(f.from.indexOf(" ") >= 0 || f.to.indexOf(" ") >= 0)
	{
		alert("domains can't contain spaces");
		return null;
	}
	if(f.from.indexOf("*") > 0 || f.to.indexOf("*") > 0)
	{
		alert("domains can only start with wildcard *");
		return null;
	}
	//Empty is interpreted as wildcard(which includes empty)
	if(f.to == "")
		f.to = "*";

	var toWild = b.isWild(f.to);
	var toWithout = b.withoutWild(f.to);
	var fromWild = b.isWild(f.from);
	var fromWithout = b.withoutWild(f.from);

	//Remove tracked requests matching filter
	for(var i in b.TrackedRequests)
	{
		var t = b.TrackedRequests[i];

		if(f.from != null && f.from != "")
		{
			if(fromWild)
			{
				if(endsWith(t.from, b.withoutWild(f.from)) == false)
					continue;
			}
			else
			{
				if(f.from != t.from)
					continue;
			}
		}
		if(f.to != null && f.to != "")
		{
			if(toWild)
			{
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

//Shared between tracked and popup
function clearTrackedRequests()
{
	b.TrackedRequests = {};
	b.tabRequests = {};
	b.tabFilters = {};
}

//Shared with page filter and popup
//Return html representation of a filter
function generateFilterItem(table, f)
{
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
		b.syncUpdateFilter(newFilter);

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
	row.onsubmit = function(){return false;};

	//Update fields
	row.removeAttribute("id");
	row.style.background = b.actions[f.filter].color;
	var selFrom = row.from.selectionEnd;
	var selTo = row.to.selectionEnd;
	row.from.value = f.from;
	row.to.value = f.to;
	if(selFrom != 0)
	{
		row.from.selectionStart = selFrom;
		row.from.selectionEnd = selFrom;
	}
	if(selTo != 0)
	{
		row.to.selectionStart = selTo;
		row.to.selectionEnd = selTo;
	}
	fillActionSelect(row.filter, f.filter);
	row.track.checked = f.track;
	if(row.add != null)
		row.add.parentNode.removeChild(row.add); //Remove "add"/"save" button

	//Update events with the new filter settings (f)
	row.del.onclick = function(){
		b.deleteFilter(f.from, f.to);
		b.syncDeleteFilter(f.from, f.to);
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

function insertTrackedRow(table, req, submitAction)
{
	if(req.from == null)
		req.from = "";
	var row = b.filterTemplate.cloneNode(true);
	row.removeAttribute("id");
	row.del.style.display = "none";
	row.from.value = req.from;
	if(req.to != null)
		row.to.value = req.to;
	row.track.checked = req.track;
	
	fillActionSelect(row.filter, b.settings.defaultNewFilterAction);
	
	row.onsubmit=function(){
		var filter = getFilterFromForm(row);
		if(filter == null)
			return;
		b.addFilter(filter);
		b.syncUpdateFilter(filter);

		table.removeChild(row);
		if(submitAction != null)
			submitAction(filter);
		return false;
	};
	
	//Helpers for wildcard checkbox
	row.from.oninput=function(){wildcardTextHelper(row.from);};
	row.to.oninput=function(){wildcardTextHelper(row.to);};
	table.appendChild(row);
}

//Chandle changes in the domain textbox
function wildcardTextHelper(text)
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
		select.addEventListener("change", action);
}

function setSelected(list, value)
{
	for(var i = 0; i < list.length; i++)
	{
		var li = list[i];
		if(li.value == value)
		{
			list[i].selected = true;
			return;
		}
	}
}

function endsWith(str, suffix) {
	if(str == null)
		return false;
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
