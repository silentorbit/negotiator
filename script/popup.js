
window.onload = function() {

	document.querySelector('#showFilters').addEventListener('click', showFilters);
	document.querySelector('#showTracked').addEventListener('click', showTracked);
	document.querySelector('#showOptions').addEventListener('click', showOptions);
	document.querySelector('#clearButton').addEventListener('click', clearTrackedClose);

	chrome.tabs.getSelected(null,
		function(tab){
			//Get tab domain
			domain = b.getDomain(tab.url);

			//Update list of filters for domain
			var tabFilterArray = b.tabFilters[tab.id];
			if(tabFilterArray){
				var table = document.getElementById('filters');
				var added = [];
				for(var i in tabFilterArray){
					var filter = tabFilterArray[i];
					if(added.indexOf(filter) < 0)
					{
						table.appendChild(generateFilterItem(filter));
						added.push(filter);
					}
				}
			}

			//Tracked requests
			var trackedArray = b.tabRequests[tab.id];
			var table = document.getElementById('trackedTable');
			insertTrackedRow(table, domain, domain);
			if(trackedArray)
			{
				for(var i in trackedArray)
				{
					var t = trackedArray[i];
					insertTrackedRow(table, t.from, t.to);
				}
			}
		}
	);
}

function showFilters()
{
	showOptionsPage('filters.html');
}

function showTracked()
{
	showOptionsPage('tracked.html');
}

function showOptions()
{
	showOptionsPage('options.html');
}


//load options page in a new tab, or go to existing tab
function showOptionsPage(path){
	var optionsUrl = chrome.extension.getURL(path);

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

function clearTrackedClose()
{
	clearTrackedRequests();
	window.close();
}
