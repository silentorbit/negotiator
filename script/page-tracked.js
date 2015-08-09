
window.addEventListener("load", loadTrackedPage, false);

function loadTrackedPage()
{
	//Tracked Requests
	var table = document.getElementById("trackedTable");
	table.appendChild(b.filterHeader.cloneNode(true));//Add headers
	for(var i in b.TrackedRequests)
	{
		var r = b.TrackedRequests[i];
			
		insertTrackedRow(table, r, null);
	}

	var button = document.querySelector("#clearTrackedReload");
	if(button) button.addEventListener("click", function(){
		clearTrackedRequests();
		location.reload();
	});
}