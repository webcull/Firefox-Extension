async function getCookies(domain, name) {
	var cookie = await browser.cookies.get({"url": domain, "name": name});
	return cookie ? cookie.value : null;
}
var arrDefaultParams = {
	
};
async function sessionPost(arrParams) {
	var session_hash = await getCookies("https://webcull.com", "__DbSessionNamespaces");
	if(!session_hash)
	{
		var request = new Request("https://webcull.com/api/load", {
			method: 'POST',
			//credentials : 'omit',
			cache : 'no-store',
			headers: {
				"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
			},
			body: {}
		});

		request = await fetch(request);
	}
	if (!session_hash) {
		throw new Error("No cookie was found");
	}
	if (arrDefaultParams)
		$.extend(arrParams.post, arrDefaultParams);
	$.extend(arrParams.post, {
		__DbSessionNamespaces : decodeURIComponent(session_hash)
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
	var data = await response.text();
	var mixedData = JSON.parse(data);
	return mixedData;
}

async function sessionPostWithRetries(arrParams, retries = 0, delayMs = 50) {
	var promise = sessionPost(arrParams);
	// for each requested retry
	for(var i = 0; i < retries; i++) {
		// tack on an error handler that delays then just tries again
		promise = promise.catch(function(err) {
			// pass on a promise that rejects delayMs later
			return new Promise((resolve, reject) => {
				setTimeout(reject.bind(null, err), delayMs);
			});
		}).catch(function(err) {
			// if we reach here, delayMs has passed and we run it again
			return sessionPost(arrParams);
		});
	}
	return promise;
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
function isFunction(obj) {
	return !!(obj && obj.constructor && obj.call && obj.apply);
}
