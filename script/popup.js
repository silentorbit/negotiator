
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
