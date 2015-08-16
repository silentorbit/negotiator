
window.addEventListener("load", loadOptionsPage, false);

//Called at the end of the options page load
function loadOptionsPage()
{
	//Count unfiltered
	var www = document.getElementById("counterIndicator");
	www.checked = b.settings.countIndicator == "unfiltered";
	www.addEventListener("click", function(){
		b.settings.countIndicator = this.checked ? "unfiltered" : "";
		b.syncUpdateSettings();
	});

	//Filter Storage
	var useChromeSync = document.getElementById("useChromeSync");
	useChromeSync.checked = b.useChromeSync;
	useChromeSync.addEventListener("click", function(){
		b.setUseChromeSync(useChromeSync.checked);
	});
	
	//Default Actions
	fillActionSelect(document.getElementById("defaultAction"), b.settings.defaultAction, function(){
		b.settings.defaultAction = this.value;
		b.syncUpdateSettings();
	});
	fillActionSelect(document.getElementById("defaultLocalAction"), b.settings.defaultLocalAction, function(){
		b.settings.defaultLocalAction = this.value;
		b.syncUpdateSettings();
	});
	fillActionSelect(document.getElementById("defaultLocalTLDAction"), b.settings.defaultLocalTLDAction, function(){
		b.settings.defaultLocalTLDAction = this.value;
		b.syncUpdateSettings();
	});
	fillActionSelect(document.getElementById("defaultNewFilterAction"),	b.settings.defaultNewFilterAction, function(){
		b.settings.defaultNewFilterAction = this.value;
		b.syncUpdateSettings();
	});

	//Ignore WWW
	var www = document.getElementById("ignoreWWW");
	www.checked = b.settings.ignoreWWW;
	www.addEventListener("click", function(){
		b.settings.ignoreWWW = this.checked;
		b.syncUpdateSettings();
	});

	//Experimental, pass same
	var passSame = document.getElementById("alwaysPassSame");
	passSame.checked = b.settings.alwaysPassSame;
	passSame.addEventListener("click", function(){
		b.settings.alwaysPassSame = this.checked;
		b.syncUpdateSettings();
	});
	
	//Action List
	updateActions();
	//New action
	document.querySelector("#addActionForm").addEventListener("submit", function(evt){
		event.preventDefault();

		var name = document.getElementById("actionName");

		addAction(name.value);

		name.value = "";
		return false;
	});

	//Help examples:
	document.querySelector("#examplePass").innerHTML = navigator.userAgent;
	document.querySelector("#exampleRandom").innerHTML = b.getRandomUserAgent();
	document.querySelector("#exampleSimple").innerHTML = b.userAgent;
}


//Populate Actions list
function updateActions()
{
	for(var i in b.actions)
		addActionRow(i);
}

function updateEnabled(row)
{
	var isBlocked = row.block.value == "true";
	var vis = isBlocked ? "hidden" : "visible";
	row.request.style.visibility = vis;
	row.response.style.visibility = vis;
}

function addActionRow(a)
{
	var row = document.getElementById("actionTemplate").cloneNode(true);
	var action = b.actions[a];

	row.removeAttribute("id");
	row.style.background = action.color;

	row.actionName.value = a;
	row.actionName.disabled = true;

	row.color.value = action.color;
	
	setSelected(row.block, action.block);	//Block request

	row.request.value = formatActionFilters(action.request);
	row.response.value = formatActionFilters(action.response);

	updateEnabled(row);

	//Automatically save settings when changed
	var save = function(event){
		event.preventDefault();

		action.color = row.color.value;
		action.block = row.block.value;
		action.request = parseActionFilters(row.request.value);
		action.response = parseActionFilters(row.response.value);
		//Debug
		row.querySelector("#requestParsed").textContent = JSON.stringify(action.request);
		row.querySelector("#responseParsed").textContent = JSON.stringify(action.response);
		b.syncUpdateAction(a, action);
		
		row.style.backgroundColor = row.color.value;

		updateEnabled(row);
	};
	row.color.oninput = save;
	row.block.onchange = save;
	row.request.oninput = save;
	row.response.oninput = save;

	var table = document.getElementById("actions");
	
	row.delete.onclick = function(event){
		event.preventDefault();

		delete b.actions[a];
		b.syncDeleteAction(a)
		table.removeChild(row);
	}

	table.appendChild(row);
}

function formatActionFilters(headerFilter)
{
	if(headerFilter == null)
		return "";
	var text = "";
	for(var k in headerFilter)
	{
		text += k + ": " + headerFilter[k] + "\n";
	}
	return text;
}
function parseActionFilters(text)
{
	var headerFilter = {};
	var lines = text.replace("\r", "\n").split("\n");
	for(var l in lines)
	{
		var line = lines[l].trim();
		if(line == "")
			continue;
		var sep = line.indexOf(":")
		if(sep < 0)
			headerFilter[line] = "";
		else
			headerFilter[line.substring(0, sep).toLowerCase()] = line.substring(sep + 1).trim();
	}
	return headerFilter;
}

function addAction(a)
{
	if(b.actions[a] != null)
	{
		alert(a + " already exists");
		return;
	}

	var action = {color: "green", block: "false"};
	b.actions[a] = action;
	b.syncUpdateAction(a, action)

	addActionRow(a);
}
