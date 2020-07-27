var app = {};

app.data = {};
app.loadedPromises = [];
app.urls = {};
// crumbs
app.arrCrumbs = new Array(0);
app.arrCrumbsValues = [""];
app.arrLastCrumbs = app.arrCrumbs;
app.arrLastCrumbsValues = app.arrCrumbsValues;
// Object to hold used Bookmark tags
app.objTags = {}

// prevent dead objects by creating them here
app.newParentArray = function () {
	var arr = new Array();
	if (arguments.length)
		arr.concat(arguments);
	return arr;
};

var boolLoaded = false;
app.loaded = function () {
	for (var intItr in app.loadedPromises) {
		try {
			if (app.loadedPromises && app.loadedPromises[intItr]) app.loadedPromises[intItr]();
		} catch (error) {
			console.log(error)
		}

	}
	for (var intItr in app.loadedPromises) {
		delete app.loadedPromises[intItr];
	}
};
// prevent connections from going dead
app.backgroundPost = sessionPostWithRetries;


app.setStackUpdateTimeout = function (strVal, strName) {
	return $.delay(1000, (function (strVal, strName) {
		return function () {
			app.updateCall(strVal, strName);
		};
	})(strVal, strName));
};

function initalizeAccount() {
	sessionPostWithRetries({
		url: "https://webcull.com/api/load",
		post: {}
	}, 1)
		.then(function (arrData) {
			if (arrData.no_user)
				return;
			app.data = arrData;
			processURLs();
			boolLoaded = true;
			getTab(function (tab) {
				alterIcon(tab);
			})
		});
}

// modify fields like tags, title, notes
app.updateCall = function (strVal, strName) {
	var objBookmark = app.getBookmark();
	var arrModify = {
		proc: 'modify',
		stack_id: objBookmark.stack_id,
		name: strName,
		value: dblEncode(strVal)
	};
	console.log("=====arrModify==========");
	console.log(arrModify);
	app.backgroundPost({
		url: "https://webcull.com/api/modify",
		post: arrModify
	});
}

app.processURLs = processURLs;
function processURLs() {
	for (var intParent in app.data.stacks) {
		var intLen = app.data.stacks[intParent].length;
		for (var intItr = 0; intItr < intLen; ++intItr) {
			var objStack = app.data.stacks[intParent][intItr];
			if (objStack.is_url == 1) {
				app.urls[objStack.value] = 1;
			}
			if (objStack.tags && objStack.tags.length) {
				var arrTags = String(objStack.tags).replace(/\s+/g, ',').split(',')
				arrTags.forEach((tag) => {
					if (tag in app.objTags) {
						app.objTags[tag] += 1
					}
					app.objTags[tag] = 1
				})
			}

		}
	}
}


app.alterIcon = alterIcon;
function alterIcon(tab, url) {
	var strUrl = typeof url == "undefined" ? tab.url : url;
	if (strUrl == "" || strUrl.match(/^about:/))
		return;
	var boolExists = !boolLoaded || app.urls[strUrl];
	if (boolExists) {
		browser.pageAction.setIcon({
			path: {
				"16": "images/webcull-16x.png",
				"32": "images/webcull-32x.png",
				"48": "images/webcull-48x.png",
				"128": "images/webcull-128x.png"
			},
			tabId: tab.id
		});
	} else {
		browser.pageAction.setIcon({
			path: {
				"128": "images/logo-gray-128.png"
			},
			tabId: tab.id
		});
	}
	browser.pageAction.show(tab.id);
}

// make sure it saves on disconnect
browser.runtime.onConnect.addListener(function (externalPort) {
	externalPort.onDisconnect.addListener(function () {
		try {
			app.saveCrumbs && app.saveCrumbs()
		} catch (error) {
			
		}
	});
});

// for general navigation
browser.webNavigation.onBeforeNavigate.addListener(function (tab) {
	if (tab.frameId == 0) {
		getTab(function (selectedTab) {
			if (selectedTab.id == tab.id) {
				alterIcon(selectedTab);
			}
		});
	}
});

browser.webRequest.onCompleted.addListener(function (tab) {
	if (tab.frameId == 0) {
		getTab(function (selectedTab) {
			if (selectedTab.id == tab.id) {
				alterIcon(selectedTab);
			}
		});
	}
}, { urls: ["<all_urls>"] });

// init
app.getBookmark = function () {
	var objBookmark = null;
	if (app.data.bookmarks_found)
		objBookmark = app.data.bookmarks_found[0];
	if (!objBookmark)
		objBookmark = app.data;
	return objBookmark;
};
// for tracking forwarding
browser.webRequest.onCompleted.addListener(function (details) {
	if (details.type == "main_frame") {
		var strUrlUsed = null;
		getTab(function (selectedTab) {
			if (selectedTab.id == details.tabId) {
				strUrlUsed = details.url;
				alterIcon(selectedTab, strUrlUsed);

			}
		});
	}
}, { urls: ["<all_urls>"] });

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	alterIcon(tab, tab.url);
});

// for when the tab is switched
browser.tabs.onActivated.addListener(function (info) {
	browser.tabs.get(info.tabId, function (tab) {
		//if (tab.url != "")
		alterIcon(tab);
	});
});

initalizeAccount();