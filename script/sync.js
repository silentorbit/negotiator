
chrome.storage.onChanged.addListener(function(changed, namespace)
{
	if(namespace != "sync")
		return;
	if(!useChromeSync)
		return;

	for(var k in changed)
	{
		var c = changed[k];
		var sep = k.indexOf(filterFromToSeparator);
		if(sep < 0)
			continue;
		var from = k.substring(0, sep);
		var to = k.substring(sep + filterFromToSeparator.length);
		if(c.oldValue)
		{
			deleteFilter(from, to);
		}
		if(c.newValue)
		{
			var f = c.newValue;
			f.from = from;
			f.to = to;
			addFilter(f);
		}
	}
});

//Delete single filter item from sync storage
function syncDelete(from, to)
{
	if(!useChromeSync)
		return; //Local storage is saved in one JSON blob

	//console.log("Sync: delete: " + from + filterFromToSeparator + to);
	chrome.storage.sync.remove(from + filterFromToSeparator + to, syncError);
}

function syncUpdate(filter)
{
	if(!useChromeSync)
		return; //Local storage is saved in one JSON blob

	var i = {};
	i[filter.from + filterFromToSeparator + filter.to] = generateExportItem(filter);
	//console.log("Sync: Saving single filter", i);
	chrome.storage.sync.set(i, function()
	{
		if(chrome.runtime.lastError)
		{
			logError(chrome.runtime.lastError);
		}
	});
}

