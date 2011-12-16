
function getDomain(url){
	if(url === undefined)
		return "";
	var domain = url.split("://")[1].split("/")[0];
	var pos = domain.indexOf("@");
	if(pos != -1) domain = domain.substr(pos + 1);
	pos = domain.indexOf(":");
	if(pos != -1) domain = domain.substr(0, pos);
	return domain;
}


function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
