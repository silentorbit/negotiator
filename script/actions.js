
var actions = {};

loadActions();

function loadActions()
{
	try
	{
		actions = JSON.parse(localStorage.getItem("actions"));
		return;
	}
	catch(error)
	{
		logError(error);
	}

	//Load default actions
	actions = {};
	
	actions.pass = {
		color: "#4f4",
		block: "false"
	}

	actions.clear = {
		color: "#8ce",
		block: "false",
		agent: "pass",
		referer: "remove",
		cookie: "remove",
		accept: "pass",
		acceptlanguage: "pass",
		acceptencoding: "pass",
		acceptcharset: "pass"
	}

	actions.block = {
		color: "#f64",
		block: "true"
	}
	saveActions();
}

function saveActions()
{
	localStorage.actions = JSON.stringify(actions, null, '\t');
}

