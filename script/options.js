//
// Script for user manipulation
// in the options page and the popup
//

	var b = chrome.extension.getBackgroundPage();

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
		updateFilters();

		//Remove tracked requests matching filter
		for(var i in b.TrackedRequests){
			var t = b.TrackedRequests[i];

			if(f.from != undefined && f.from != ""){
				if(f.fromWild){
					if(endsWith(t.from, f.from) == false)
						continue;
				}else{
					if(f.from != t.from)
						continue;
				}
			}
			if(f.to != undefined && f.to != ""){
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

		//Update tracked requests list
		fillTrackedTable(domain, document.getElementById('trackedTable'));
	}

	function deleteFilterFrom(fromWild, from){
		b.deleteFilterFrom(fromWild, from);
		updateFilters();
	}

	function deleteFilter(fromWild, from, toWild, to){
		b.deleteFilter(fromWild, from, toWild, to);
		updateFilters();
	}

	function clearTrackedRequests()
	{
		b.TrackedRequests = {};
		location.reload()
	}

	function test(){
		var referrer = b.getDomain(document.getElementById("testFrom").value);
		var domain = b.getDomain(document.getElementById("testTo").value);
		var filter = b.getFilter(referrer, domain);

		var result = document.getElementById("testResult");
		if(filter == null)
			result.innerHTML = "no match, default";
		else
			result.innerHTML = referrer + " -> " + generateFilterItem('span', filter);
	}

	//load options page in a new tab
	function showOptions(){
		var optionsUrl = chrome.extension.getURL('options.html');

		var extviews = chrome.extension.getViews({"type": "tab"}) 
		for (var i in extviews) { 
			if (extviews[i].location.href == optionsUrl) { 
				extviews[i].chrome.tabs.getCurrent(function(tab) {
					chrome.tabs.update(tab.id, {"selected": true});
				}); 
				return; 
			} 
		} 
		chrome.tabs.create({url:optionsUrl}); 
	}

	//Set by popup page when only filters for one domain is to be shown
	var domain;

	function updateFilters(){
		var list;
		if(domain == null)
			list = b.filters;
		else
			list = b.listDomainFilters(domain);
			
			
		var filterTag = document.getElementById('filters');
		if(filterTag == null)
			return;
			
		if(list[""] != null)
			generateFilterList(filterTag, list[""]);
		
		for(var i in list)
		{
			if(i == "" || i == "wild")
				continue;
			generateFilterList(filterTag, list[i]);
		}
		for(var i in list.wild)
		{
			generateFilterList(filterTag, list.wild[i]);
		}
	}

	function generateFilterList(table, list){
		for(var i in list)
		{
			if(i == "wild")
				continue;
			table.appendChild(generateFilterItem(list[i]));
		}
		for(var i in list.wild)
		{
			table.appendChild(generateFilterItem(list.wild[i]));
		}
	}

	function generateFilterItem(f){
		var row = b.trackedTemplate.cloneNode(true);
		row.removeAttribute('id');
		row.className = "filter" + f.filter;
		row.from.value = f.from;
		row.fromWild.checked = f.fromWild;
		row.to.value = f.to;
		row.toWild.checked = f.toWild;
		if(f.filter == "block")
			row.filter[0].selected = true;
		if(f.filter == "pass")
			row.filter[1].selected = true;
		if(f.filter == "clear")
			row.filter[2].selected = true;
		row.add.value = "delete";
		//Disable all but delete button
		row.from.disabled = true;
		row.fromWild.disabled = true;
		row.to.disabled = true;
		row.toWild.disabled = true;
		row.filter.disabled = true;
		row.onsubmit = function(){deleteFilter(row.fromWild.checked, row.from.value, row.toWild.checked, row.to.value);};
		return row;
	}

	function fillTrackedTable(table)
	{
		insertTrackedRow(table, "", "");
		
		for(var i in b.TrackedRequests)
		{
			var r = b.TrackedRequests[i];
			if(domain != null && r.from != domain)
				continue;
				
			insertTrackedRow(table, r.from, r.to);
		}
	}

	function insertTrackedRow(table, from, to)
	{
		if(from == undefined)
			from = "";
		var row = b.trackedTemplate.cloneNode(true);
		row.removeAttribute('id');
		row.from.value = from;
		row.to.value = to;
		row.onsubmit=function(){addFilter(row);};
		
		table.appendChild(row);
	}

	function endsWith(str, suffix) {
		if(str == undefined)
			return false;
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
