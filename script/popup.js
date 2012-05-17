
	//load options page in a new tab
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

window.onload = function() {
	chrome.tabs.getSelected(null,
		function(tab){
			//Get tab domain
			domain = b.getDomain(tab.url);

			//Update list of filters for domain
			updateFilters();

			//Tracked requests
			fillTrackedTable(document.getElementById('trackedTable'));
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

function clearTrackedClose()
{
		clearTrackedRequests();
		window.close();
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#showFilters').addEventListener('click', showFilters);
  document.querySelector('#showTracked').addEventListener('click', showTracked);
  document.querySelector('#showOptions').addEventListener('click', showOptions);
  document.querySelector('#clearButton').addEventListener('click', clearTrackedClose);
});
