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

		b.addFilter(f);
		updateFilters();

		//Remove tracked requests matching filter
		for(var i in b.TrackedRequests){
			var t = b.TrackedRequests[i];

			if(f.from != undefined && f.from != ""){
				if(f.fromWild){
					if(b.endsWith(t.from, f.from) == false)
						continue;
				}else{
					if(f.from != t.from)
						continue;
				}
			}
			if(f.to != undefined && f.to != ""){
				if(f.toWild){
					if(b.endsWith(t.to, f.to) == false)
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
		fillTrackedTable(displayDomain, document.getElementById('trackedTable'));
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

	var displayDomain;

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

	function updateFilters(){
		var filterTag = document.getElementById('filters');
		if(filterTag == null)
			return;
			
		var html = "<h3>From anywhere</h3>";
		html += generateFilterList(b.filters[""]);
		for(var i in b.filters)
		{
			if(i == "" || i == "wild")
				continue;
			html += "<h3>"+
				"<small><a href=\"javascript:deleteFilterFrom(false, '" + i + "');\">delete</a></small>" +
				"From " + i +
				"</h3>" + generateFilterList(b.filters[i]);
		}
		for(var i in b.filters.wild)
		{
			html += "<h3><small><a href=\"javascript:deleteFilterFrom(true, '" + i + "');\">delete</a></small>" +
			"From * " + i +
			"</h3>" + generateFilterList(b.filters.wild[i]);
		}
		filterTag.innerHTML = html;
	}

	function generateFilterList(list){
		var html = "";
		for(var i in list)
		{
			if(i == "wild")
				continue;
			var f = list[i];
			html += generateFilterItem('li', f);
		}
		for(var i in list.wild)
		{
			var f = list.wild[i];
			html += generateFilterItem('li', f);
		}
		return "<ul>" + html + "</ul>";
	}

	function generateFilterItem(tag, f){
		var html = "<"+tag+" class=\"filter"+f.filter+"\">";
		html += "<small><a href=\"javascript:deleteFilter(" + f.fromWild + ", '" + f.from + "', " + f.toWild + ", '" + f.to + "');\">delete</a></small>";
		if(f.toWild)
			html += "* ";
		if(f.to == "")
			html += "anywhere";
		else
			html += f.to;
		html += "</"+tag+">";
		return html;
	}

	function fillTrackedTable(domain, table)
	{
		for(var i in b.TrackedRequests)
		{
			var r = b.TrackedRequests[i];
			if(domain != undefined && r.from != domain)
				continue;
				
			insertTrackedRow(table, r.from, r.to);
		}
	}

	function insertTrackedRow(table, from, to)
	{
		if(from == undefined)
			from = "";
		var row = document.getElementById('trackedTemplate').cloneNode(true);
		row.from.value = from;
		row.to.value = to;
		table.appendChild(row);
	}

