
window.addEventListener("load", loadTrackedPage, false);

function loadTrackedPage()
{
	//Tracked Requests
	var table = document.getElementById("trackedTable");
	table.appendChild(b.filterHeader.cloneNode(true));//Add headers
	for(var i in b.TrackedRequests)
	{
		var r = b.TrackedRequests[i];
			
		insertTrackedRow(table, r, function (row) {
			var filter = getFilterFromForm(row);
			b.addFilter(filter);
			b.syncUpdateFilter(filter);
			table.removeChild(row);
		});
	}

	var button = document.querySelector("#clearTrackedReload");
	if(button) button.addEventListener("click", function(){
		clearTrackedRequests();
		location.reload();
	});
}