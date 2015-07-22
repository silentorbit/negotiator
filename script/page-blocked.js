
window.addEventListener("load", loadBlockedPage, false);

function loadBlockedPage()
{
	chrome.tabs.getCurrent(function(tab){
		var report = document.getElementById("blockReport");
		
		var url = b.blockReport[tab.id];
		var f = b.getDomainFilter(b.getDomain(url));
		var html = '<p><a href="'+url+'">'+url+'</a></p>';
		report.innerHTML = html;
		if(f != null)
			report.appendChild(generateFilterItem(f));
	});
}