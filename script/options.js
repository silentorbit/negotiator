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
	}
	//Called at the end of the options page load
	function updateOptionsPage()
	{
		//Default Actions
		fillActionSelect(document.getElementById('defaultAction'), b.defaultAction);
		fillActionSelect(document.getElementById('defaultNewFilterAction'),	b.defaultNewFilterAction);

		//Ignore WWW
		document.getElementById('ignoreWWW').checked = b.ignoreWWW;

		//Action List
		updateActions();
	}

	function updateFiltersPage()
	{
		//Tracked Requests
		fillTrackedTable(document.getElementById('trackedTable'));

		//Filters
		updateFilters();
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

	function deleteFilter(fromWild, from, toWild, to){
		//Remove leading "* " for wildcard filters
		if(fromWild)
			from = from.substring(2);
		if(toWild)
			to = to.substring(2);
			
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
		if(tag == null)
			return;
			
		for(var i in b.actions)
		{
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
			
			tag.appendChild(row);
		}
	}

	function addAction(form){
		var n = form.actionName.value;
		if(b.actions[n] != undefined){
			alert(n + " does already exist");
			return;
		}

		b.actions[n] = {};
		b.actions[n].color = "green";
		b.actions[n].block = "false";
	}

	//Populate filters list
	function updateFilters(){
		var list;
		if(domain == null)
			list = b.filters;
		else
			list = b.listDomainFilters(domain);
			
			
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

	function generateFilterList(table, list){
		for(var i in list.wild)
			table.appendChild(generateFilterItem(list.wild[i]));
			
		for(var i in list) {
			if(i == "wild")
				continue;
			table.appendChild(generateFilterItem(list[i]));
		}
	}

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
		row.filter.options[0] = new Option(f.filter, f.filter);
		row.filter.options[0].selected = true;
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

	//Tracked requests
	function fillTrackedTable(table)
	{
		insertTrackedRow(table, domain, "");
		
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

		fillActionSelect(row.filter, b.defaultNewFilterAction);
		
		row.onsubmit=function(){addFilter(row);};
		
		table.appendChild(row);
	}

	function fillActionSelect(select, selectedAction)
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
	}

	function endsWith(str, suffix) {
		if(str == undefined)
			return false;
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
