
window.addEventListener("load", loadFiltersPage, false);

function loadFiltersPage()
{
	//Filters
	updateFilters();

	//Test button
	var button = document.querySelector("#testButton");
	if(button) button.addEventListener("click", testFilter);

	document.querySelector("#exportJSON").addEventListener("click", exportJSON);
	document.querySelector("#importJSON").addEventListener("click", importJSON);
}

function testFilter()
{
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

//Filter Import/Export
function exportJSON()
{
	var textJson = document.querySelector("#filterJSON");
	textJson.value = b.exportJson();
}

function importJSON()
{
	var textJson = document.querySelector("#filterJSON");
	b.importJson(textJson.value);
	b.saveAll();
	updateFilters();
}

//Populate filters list in filter page
function updateFilters()
{
	var list = b.filters;

	var filtersBlockedTag = document.getElementById("filtersBlocked");
	var filtersTag = document.getElementById("filters");
	if(filtersTag == null || filtersBlockedTag == null)
		return;
	
	filtersTag.innerHTML = "";
	filtersBlockedTag.innerHTML = "";
	//Add headers
	filtersTag.appendChild(b.filterHeader.cloneNode(true));
	filtersBlockedTag.appendChild(b.filterHeader.cloneNode(true));

	for(var i in list.wild)
		generateFilterList(filtersBlockedTag, filtersTag, list.wild[i]);
		
	for(var i in list)
	{
		if(i == "wild")
			continue;
		generateFilterList(filtersBlockedTag, filtersTag, list[i]);
	}
}

//Fill table with html representaton of a filter list
function generateFilterList(tableBlocked, table, list)
{
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