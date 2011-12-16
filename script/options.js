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

	function loadPopup(){
		chrome.tabs.query({'active': true}, function(tabs){

			var domain = b.getDomain(tabs[0].url);
			var f = b.getDomainFilter(domain);

			if(f != null)
				document.getElementById('filterReport').innerHTML = "Filtered: " + f.filter + generateFilterItem('div', f);
			
			
			fillTrackedTable(
				domain,
				document.getElementById('trackedTable')
			);
		});
	}
	
	function loadOptions(){
		document.getElementById('blocked').innerText = b.blocked + '';
		
		updateFilters();
	
		fillTrackedTable(null, document.getElementById('trackedTable'));
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

	function updateFilters(){
		var html = "<h3>From anywhere</h3>";
		html += generateFilterList(b.filters[""]);
		for(var i in b.filters)
		{
			if(i == "" || i == "wild")
				continue;
			html += "<h3>From " + i +
			" <small><a href=\"javascript:deleteFilterFrom(false, '" + i + "');\">delete</a></small>" +
			"</h3>" + generateFilterList(b.filters[i]);
			
			
		}
		for(var i in b.filters.wild)
		{
			html += "<h3>From " + i +
			" <small><a href=\"javascript:deleteFilterFrom(false, '" + i + "');\">delete</a></small>" +
			"</h3>" + generateFilterList(b.filters.wild[i]);
		}
		document.getElementById('filters').innerHTML = html;
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
		if(f.toWild)
			html += "* ";
		html += f.to;
		html += " <small><a href=\"javascript:deleteFilter(" + f.fromWild + ", '" + f.from + "', " + f.toWild + ", '" + f.to + "');\">delete</a></small>";
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

