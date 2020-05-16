
function getCookies(domain, name, callback) {
    browser.cookies.get({"url": domain, "name": name}, function(cookie) {
        if(callback) {
            callback(cookie.value);
        }
    });
}
var arrDefaultParams = {
	
};
function sessionPost(arrParams) {
	getCookies("https://webcull.com", "__DbSessionNamespaces", function(session_hash) {
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
		fetch(request)
		.then(function(response) {
			console.log('response', response);
	    		return response.text();
	  	})
		.then(function (data) {
			console.log('arrParams.url', arrParams.url);
			console.log('$.queryString(arrParams.post)', $.queryString(arrParams.post));
			console.log('data', data);
			try {
				var mixedData = JSON.parse(data);
				if (arrParams.success)
					arrParams.success(mixedData);
			} catch (err) {
				
			};
		})
		.catch(function (err) {
			
		});
	});
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
