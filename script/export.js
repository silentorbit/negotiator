var filterFromToSeparator = " > ";

function importJson(json)
{
	var list = JSON.parse(json);
	importFilters(list);
}

function exportJson()
{
	return JSON.stringify(exportFilters(), null, '\t');
}

function importFilters(list)
{
	for(var k in list)
	{
		var f = list[k];
		var sep = k.indexOf(filterFromToSeparator);
		if(sep < 0)
			continue;
		f.from = k.substring(0, sep);
		f.to = k.substring(sep + filterFromToSeparator.length);
		addFilter(f);
	}
	prepareFilters();
}

function exportFilters()
{
	//Scan all filters and generate a single list
	var list = {};

	for(var f in filters)
	{
		if(f == "wild")
			continue;
		exportFiltersTo(f, filters[f], list);
	}
	var fw = filters.wild;
	for(var f in fw)
	{
		exportFiltersTo("*" + f, fw[f], list);
	}

	return list;
}
function exportFiltersTo(from, filters, list)
{
	if(filters == null)
		return;

	for(var f in filters)
	{
		if(f == "wild")
			continue;
		var filter = filters[f];
		if(filter == null)
			continue;
		list[from + filterFromToSeparator + f] = generateExportItem(filter);
	}
	var fw = filters.wild;
	for(var f in fw)
	{
		var filter = fw[f];
		if(filter == null)
			continue;
		list[from + filterFromToSeparator + "*" + f] = generateExportItem(filter);
	}
}
function generateExportItem(f)
{
	var i = {
		filter: f.filter,
	};
	if(f.track)
		i.track = true;
	return i;
}

