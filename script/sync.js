var syncActionPrefix = "action:";

loadAll();

function loadAll()
{
	if(useChromeSync)
	{
		chrome.storage.sync.get(null, function(list){ 
			if(chrome.runtime.lastError)
			{
				syncError();
				return;
			}

			if(list.filters != null)
			{
				console.log("Filters: loaded legacy");
			
				//Legacy filters
				filters = JSON.parse(list.filters);
				prepareFilters();
				fixLegacyWildcard();
				return;
			}

			//console.log("Filters: loaded", list);
			filters = {};
			actions = {};
			importAll(list);
			fixSettings();

			//Always save locally
			saveLocalAll();
		});
	}
	else
	{
		loadLocalSettings();
		loadLocalActions();
		loadLocalFilters();
		fixSettings();
	}
}
function fixSettings()
{
	//Settings
	if(settings == null) settings = {};
	if(settings.ignoreWWW === undefined)
		settings.ignoreWWW = true;//By default new installs ignore www
	if(settings.countIndicator === undefined)
		settings.countIndicator = "unfiltered";
	if(settings.defaultAction == undefined)
		settings.defaultAction = "pass";
	if(settings.defaultLocalAction == undefined)
		settings.defaultLocalAction = "passs";
	if(settings.defaultLocalTLDAction == undefined)
		settings.defaultLocalTLDAction = "pass";
	if(settings.defaultNewFilterAction == undefined)
		settings.defaultNewFilterAction = "block";
	if(settings.alwaysPassSame == undefined)
		settings.alwaysPassSame = false;

	//Actions
	if(actions == null || Object.keys(actions).length == 0)
	{
		//Load default actions
		actions = {};
		
		actions.pass = {
			color: "#4f4",
			block: "false"
		}

		actions.clear = {
			color: "#8ce",
			block: "false",
			request: {
				"referer": "remove",
				"cookie": "remove"
			},
			response: {
				"set-cookie": "remove"
			}
		}

		actions.block = {
			color: "#f64",
			block: "true"
		}
	}
	else
	{
		//Upgrade actions
		for(var k in actions)
		{
			var a = actions[k];
			if(a.request == null)
				a.request = {};
			if(a.response == null)
				a.response = {};

			switch(a.agent)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "random":
					a.request["user-agent"] = "random";
					break;
				case "simple":
					a.request["user-agent"] = "simple";
					break;
				case "minimal":
					a.request["user-agent"] = "minimal";
					break;
				case "remove":
					a.request["user-agent"] = "remove";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.agent;

			switch(a.referer)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "dest":
					a.request["referer"] = "dest";
					break;
				case "destclean":
					a.request["referer"] = "destclean";
					break;
				case "clean":
					a.request["referer"] = "clean";
					break;
				case "remove":
					a.request["referer"] = "remove";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.referer;

			switch(a.cookie)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "remove":
					a.request["cookie"] = "remove";
					a.response["set-cookie"] = "remove";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.cookie;

			switch(a.accept)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "remove":
					a.request["accept"] = "remove";
					break;
				case "any":
					a.request["accept"] = "*/*";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.accept;

			switch(a.acceptlanguage)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "remove":
					a.request["accept-language"] = "remove";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.acceptlanguage;

			switch(a.acceptencoding)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "remove":
					a.request["accept-encoding"] = "remove";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.acceptencoding;

			switch(a.acceptcharset)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "remove":
					a.request["accept-charset"] = "remove";
					break;
				default:
					throw "Upgrade error";
			}
			delete a.acceptcharset;

			switch(a.csp)
			{
				case null:
				case undefined:
				case "pass":
					break;
				case "force":
					a.response["content-security-policy-report-only"] = "force-csp";
					break;
				case "none":
					a.response["content-security-policy-report-only"] = "remove";
					a.response["content-security-policy"] = "default-src: 'none'";
					break;
				case "self":
					a.response["content-security-policy-report-only"] = "remove";
					a.response["content-security-policy"] = "default-src: 'self'";
					break;
				case "custom":
					a.response["content-security-policy-report-only"] = "remove";
					a.response["content-security-policy"] = a.customcsp;
					break;
				default:
					throw "Upgrade error";
			}
			delete a.csp;
			delete a.customcsp;
		}
		console.log("Upgrade complete");
	}
}

function importAll(list)
{
	for(var k in list)
	{
		var c = list[k];

		//Settings
		if(k == "settings")
		{
			settings = c;
			continue;
		}
		//Actions
		if(k.indexOf(syncActionPrefix) == 0)
		{
			var action = k.substring(syncActionPrefix.length);
			actions[action] = c;
			continue;
		}

		//Filters
		var sep = k.indexOf(filterFromToSeparator);
		if(sep >= 0)
		{
			c.from = k.substring(0, sep);
			c.to = k.substring(sep + filterFromToSeparator.length);
			addFilter(c);
			continue;
		}

		//Unknown
		console.log("Error, unknown key", k, c)
	}
	prepareFilters();
}

	
chrome.storage.onChanged.addListener(function(changed, namespace)
{
	if(namespace != "sync")
		return;
	if(!useChromeSync)
		return;

	for(var k in changed)
	{
		var c = changed[k];
		if(k.indexOf(syncActionPrefix) == 0)
		{
			var action = k.substring(syncActionPrefix.length);
			if(c.oldValue)
			{
				delete actions[action];
			}
			if(c.newValue)
			{
				actions[action] = c.newValue;
			}
			continue;
		}
		var sep = k.indexOf(filterFromToSeparator);
		if(sep >= 0)
		{
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
			continue;
		}
		if(k == "settings")
		{
			if(c.newValue)
				settings = c.newValue;
			continue;
		}
		//Unknown storage key
		console.log("Error, unknown sync storage key", k, c);
	}

	saveLocalAll();
});

//Delete single filter item from sync storage
function syncDeleteFilter(from, to)
{
	syncDelete(from + filterFromToSeparator + to);
}

//Delete single action
function syncDeleteAction(action)
{
	syncDelete(syncActionPrefix + action);
}

//Delete single action
function syncDelete(key)
{
	//Always save locally
	saveLocalAll();

	if(useChromeSync)
		chrome.storage.sync.remove(key, syncError);
}

function syncUpdateFilter(filter)
{
	syncUpdate(
		filter.from + filterFromToSeparator + filter.to, 
		generateExportItem(filter));
}

function syncUpdateAction(action, config)
{
	syncUpdate(syncActionPrefix + action, config);
}

function syncUpdateSettings()
{
	syncUpdate("settings", settings);
}

function syncUpdate(key, value)
{
	//Always save locally
	saveLocalAll();

	if(useChromeSync)
	{
		var i = {};
		i[key] = value;
		chrome.storage.sync.set(i, syncError);
	}
}
