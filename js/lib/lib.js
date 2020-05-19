
async function getCookies(domain, name) {
	var cookie = await browser.cookies.get({"url": domain, "name": name});
	return cookie ? cookie.value : null;
}
var arrDefaultParams = {
	
};
async function sessionPost(arrParams) {
	var session_hash = await getCookies("https://webcull.com", "__DbSessionNamespaces");
	if (!session_hash) {
		throw new Error("No cookie was found");
	}
	console.log('session_hash', session_hash);
	if (arrDefaultParams)
		$.extend(arrParams.post, arrDefaultParams);
	$.extend(arrParams.post, {
		__DbSessionNamespaces : session_hash
	});
	// process the save
	var request = new Request(arrParams.url, {
		method: 'POST',
		//credentials : 'omit',
		cache : 'no-store',
		headers: {
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		},
		body: $.queryString(arrParams.post)
	});
	var response = await fetch(request);
	console.log('response', response);
	var data = await response.text();
	var mixedData = JSON.parse(data);
	return mixedData;
}

function callOnActiveTab(callback) {
    browser.tabs.query({currentWindow: true}).then((tabs) => {
      for (var tab of tabs) {
        if (tab.active) {
          callback(tab, tabs);
        }
      }
    });
}

function getTab (fnCallback) {
	callOnActiveTab(function (tab) {
		fnCallback(tab);
	});
	/*
	browser.tabs
	.getCurrent()
	.then(
		function(tab) {
			console.log('tab', tab);
			fnCallback(tab);
		},
		function () {
			console.log('no tab');
		});*/
}
function dblEncode(val) {
	return encodeURIComponent(encodeURIComponent(val));
}
function backlog(strVal) {
	browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
		browser.tabs.executeScript(
			tabs[0].id,
			{code: 'console.log(unescape("' + escape(strVal) + '"));'}
		);
	});
}
