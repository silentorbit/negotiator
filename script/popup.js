
	//load options page in a new tab
	function showOptions(path){
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
