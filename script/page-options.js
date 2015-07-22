
window.addEventListener("load", loadOptionsPage, false);

//Called at the end of the options page load
function loadOptionsPage()
{
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
	document.querySelector("#exampleMinimal").innerHTML = "Mozilla/5.0";
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
	row.agent.style.visibility = vis;
	row.referer.style.visibility = vis;
	row.cookie.style.visibility = vis;
	row.accept.style.visibility = vis;
	row.acceptlanguage.style.visibility = vis;
	row.acceptencoding.style.visibility = vis;
	row.acceptcharset.style.visibility = vis;
	row.csp.style.visibility = vis;
	row.customcsp.style.visibility = (isBlocked || row.csp.value != "custom") ? "collapse":"visible";
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
	setSelected(row.agent, action.agent);	//User-Agent
	setSelected(row.referer, action.referer);	//Referer
	setSelected(row.cookie, action.cookie);	//Cookie, Cookie-Set
	setSelected(row.accept, action.accept);	//Accept
	setSelected(row.acceptlanguage, action.acceptlanguage);	//Accept-Language
	setSelected(row.acceptencoding, action.acceptencoding);	//Accept-Encoding
	setSelected(row.acceptcharset, action.acceptcharset);	//Accept-Charset
	setSelected(row.csp, action.csp);	//CSP
	if(action.customcsp != null)
		row.customcsp.value = action.customcsp;

	updateEnabled(row);

	//Automatically save settings when changed
	var save = function(event){
		event.preventDefault();

		action.color = row.color.value;
		action.block = row.block.value;
		action.agent = row.agent.value;
		action.referer = row.referer.value;
		action.cookie = row.cookie.value;
		action.accept = row.accept.value;
		action.acceptlanguage = row.acceptlanguage.value;
		action.acceptencoding = row.acceptencoding.value;
		action.acceptcharset = row.acceptcharset.value;
		action.csp = row.csp.value;
		action.customcsp = row.customcsp.value;
		b.syncUpdateAction(a, action);
		
		row.style.backgroundColor = row.color.value;

		updateEnabled(row);
	};
	row.color.oninput = save;
	row.block.onchange = save;
	row.agent.onchange = save;
	row.referer.onchange = save;
	row.cookie.onchange = save;
	row.accept.onchange = save;
	row.acceptlanguage.onchange = save;
	row.acceptencoding.onchange = save;
	row.acceptcharset.onchange = save;
	row.csp.onchange = save;
	row.customcsp.onchange = save;

	var table = document.getElementById("actions");
	
	row.delete.onclick = function(event){
		event.preventDefault();

		delete b.actions[a];
		b.syncDeleteAction(a)
		table.removeChild(row);
	}

	table.appendChild(row);
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
