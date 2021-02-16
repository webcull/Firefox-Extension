browser.runtime.connect();

var background = browser.extension.getBackgroundPage();
if (!background) {
	getTab(function (tab) {
		var strURL = tab.url;
		browser.tabs.create({
			url: "https://webcull.com/" + strURL 
		});
	});
	
} else {
	var app = background.app,
	netWorkFlag = false,
	switchAccounts = function (event) {
		event.preventDefault()
		window.hideAccountSwitcher(event);
		var email = event.target.dataset["email"]
		if (!email) return false
		app.is_loading();
		app.backgroundPost({ url: "https://webcull.com/api/switch", post: { "email": email } }, 1)
			.then(function (response) {
				paging('bookmark-page');
			})
			.catch(function (error) {
				console.log(error)
			})
	},
	loadAccounts = function (arrUserAccounts) {
		var $userAccountList = $("#accountsList"),
			markUp = `<a class="userRow captureFocus" href="#">
				<div class="userIcon" style="background-image: url(../images/account.png);"></div>
				<div class="userText">
					<div class="userName"><div class="userLoading hidden">
							<div class="radial-loader"></div>
						</div>
					</div>
				</div>
			</a>`;
		$userAccountList.html('')
		if (!arrUserAccounts.length) return
		var boolAdded = false;
		for (let index = 0; index < arrUserAccounts.length; index++) {
			if (app.data.user && (app.data.user.name === arrUserAccounts[index].name)) 
				continue;
			var 
			user = arrUserAccounts[index], 
			$user = $(markUp), 
			username = user.name, 
			icon = user.icon, 
			email = user.email;
			if (icon) $user.find('.userIcon').css({ 'background-image': 'url("https://webcull.com/repository/images/users/avatar/' + icon + '")' });
			$user.find('.userIcon').attr('data-email', email)
			$user.find('.userName').html(username).attr('data-email', email)
			$user.attr('data-email', email)
			$user.attr('id', email)
			$user.appendTo($userAccountList)
			boolAdded = true;
		}
		$userAccountList.find('.userRow').each(function () {
			$(this).click(switchAccounts)
		})
		if (!boolAdded) {
			$userAccountList.html('<div class="no-account">No other accounts</div>');
		}
	};


	app.autoSaveLink = function (strURL, tab) {
		if (1 == 0 && !strURL.match(/http(s)?:\/\//i)) {
			//paging("loading-page");
			// not http or https so just take user to webcull
			browser.tabs.create({
				url: "https://webcull.com"
			});
		} else {
			$("html,body").removeClass('is-init');
			/* Try to save the current URL as a bookmark */
			// Get the current URL
			$("body").removeClass('is-loaded');
			var $progressBar = $("#progress-bar");
			$.delay(1, function () {
				$progressBar.addClass('loading-started');
			});
			
			app.urls[strURL] = 1;
			app.alterIcon(tab);
			// get the current session id
			app.is_loading();
			app.backgroundPost({
				url: "https://webcull.com/api/autosavelink",
				post: {
					url: dblEncode(strURL)
				}
			}, 1).then(function (arrData) {
				if (arrData.no_user) {
					paging("accounts-page");
					// browser.tabs.update({
					// 		url: "https://webcull.com/accounts"
					// });
					// window.close();
					return;
				}
				try {
					app.data = arrData;
					app.processURLs();
					app.initCrumbs();
					$progressBar.addClass('response-recieved');
					$progressBar.addClass('assets-loaded');
					$("#account-user").html(arrData.user.name);
					if (arrData.user.icon) {
						var css = {
							'background-image': "url('https://webcull.com" + arrData.user.icon + "')"
						};
						if (arrData.user.icon == "/static/images/icons/general/temp5.png") {
							css.filter = 'brightness(1000%)';
						} else {
							css.filter = '';
						}
						$("#account-icon").addClass('custom').css(css);
					}
					var
						$bookmarkStatus = $("#bookmark-status"),
						objBookmark = app.getBookmark();
					if (objBookmark.user) {
						$bookmarkStatus.html("<u>Bookmark saved </u><a href='#' class='bookmark-status-link red' id='removeBookmark'>Undo</a>");
					} else {
						var intBookmarksFound = arrData.bookmarks_found.length;
						$bookmarkStatus.html("<u>Already saved in " + intBookmarksFound + " location" + (intBookmarksFound == 1 ? '' : 's') + "</u> <a href='#' class='bookmark-status-link red' id='removeBookmark'>Remove</a>");
					}
					var removeFlag = false;
					$bookmarkStatus.find("#removeBookmark").click(function () {
						if (!removeFlag) {
							//if (arrData.bookmarks_found && arrData.bookmarks_found.length) {
							delete app.urls[strURL];
							app.alterIcon(tab);
							//}

							app.backgroundPost({
								url: "https://webcull.com/api/remove",
								post: {
									stack_id: objBookmark.stack_id
								}
							});

							$('.placeholder-input').attr("disabled", "disabled");
							$bookmarkStatus.find('u').text("Removal success");
							$(this).text("Re-add");
							removeFlag = true;
						} else {
							$bookmarkStatus.find('u').text("Bookmark re-add");
							$(this).text("Undo");
							$('.placeholder-input').removeAttr("disabled");
							removeFlag = false;
							app.autoSaveLink(strURL, tab);
							/*app.backgroundPost({
								url: "https://webcull.com/api/autosavelink",
								post: {
									url: dblEncode(strURL)
								}
							});*/
						}
					});
					$('.placeholder-input').removeAttr("disabled");
					if (objBookmark.nickname)
						$("#bookmark-title-input").val(objBookmark.nickname).trigger('update');
					if (objBookmark.value)
						$("#bookmark-url-input").val(objBookmark.value).trigger('update');
					if (objBookmark.tags)
						$("#bookmark-tags-input").val(objBookmark.tags).trigger('update');
					if (objBookmark.notes)
						$("#bookmark-notes-input").val(objBookmark.notes).trigger('update');
					if (objBookmark.icon)
						$("#bookmark-icon").css({
							'background-image': 'url("https://webcull.com/repository/images/websites/icons/' + objBookmark.icon + '")'
						});
					$("body,html").addClass('is-loaded');
					/*$("body,html").css({
						minHeight: 445
					});*/
					$progressBar.addClass('complete');
					app.loaded();
					if (!objBookmark.parse_date || objBookmark.parse_date == "") {
						$("#bookmark-icon").addClass("loading");
						//return;
						app.backgroundPost({
							url: "https://webcull.com/api/process",
							post: {
								web_data_id: objBookmark.web_data_id
							}
						}).then(function (objResponse) {
							$("#bookmark-icon").removeClass("loading");
							if (objResponse.icon)
								$("#bookmark-icon").css({
									'background-image': 'url("https://webcull.com/repository/images/websites/icons/' + objResponse.icon + '")'
								});
							if (objResponse.nickname)
								$("#bookmark-title-input").val(objResponse.nickname).trigger('update');
						});
					}
					$progressBar.removeClass('complete')
						.removeClass('assets-loaded')
						.removeClass('response-recieved')
						.removeClass('loading-started')
					sessionPostWithRetries({ url: "https://webcull.com/api/accounts", post: {}, }, 1)
						.then((response) => {
							loadAccounts(response.users);
						})
						.catch(error => console.log(error))

				} catch (error) {
					console.log(error)
				}
			}).catch(function (err) {
				console.log(err);
				if (err.message == "No cookie was found") {
					paging("accounts-page");
					return;
				}

				if (!netWorkFlag) {
					setTimeout(retring, 2000);
					netWorkFlag = true;
				}
				paging("error-page");
			});
		}
	};

	/* init process */
	pages['bookmark-page'] = function ($self) {
		getTab(function (tab) {
			$("#progress-bar-text").html('Loading...');
			var strURL = tab.url;
			app.autoSaveLink(strURL, tab);
		});
	};

	function retring() {
		paging("bookmark-page");
	}

	/* modules and binders */
	$(function () {
		/* webcull action */
		$("#webcull-action").click(function () {
			browser.tabs.create({
				url: "https://webcull.com/bookmarks/"
			});
			window.close();
		})

		$("#bookmark-logout").click(function () {
			browser.tabs.create({
				url: "https://webcull.com/logout/index/acc/" + app.data.user.hash + "/"
			});
			window.close();
		});

		/* auto update text-box binder */
		$(".initStackUpdate").each(function () {
			$(this).stackUpdate();
		});

		/* bookmark location breadcrumbs binder */
		(function () {
			// init breadcrumbs
			var $input = $("#save-location-input"),
			boolMenuDropped = false,
			intOpenMunuIndex = 0, // the index in the hierarchy of stacks
			$saveLocationDrop = $("<div id='save-location-drop'></div>");
			intMenuItem = 0,
			intSelectedCrumb = 0,
			$empty = null,
			// a list of ids that have been created
			// stacks should be removed if they were created here but are no longer part of the list
			arrTempStacks = {};

			$input.trigger('update')
			// work backwards to build the bread crumbs
			app.initCrumbs = initCrumbs;
			app.loadedPromises.push(app.initCrumbs);
			function initCrumbs() {
				app.arrCrumbs = app.newParentArray(0);
				app.arrCrumbsValues = app.newParentArray("");
				app.arrLastCrumbs = app.arrCrumbs;
				app.arrLastCrumbsValues = app.arrCrumbsValues;
				//$("#save-location-input").val('/');
				var 
				arrCrumbsFound = [],
				objBookmark = app.getBookmark(),
				objStackIdLookup = {};
				if (objBookmark) {
					// for speed create an index of all stack ids so that we can look up parent id
					for (var intParent in app.data.stacks) {
						for (var intItr in app.data.stacks[intParent]) {
							objStackIdLookup[app.data.stacks[intParent][intItr].stack_id] = app.data.stacks[intParent][intItr];
						}
					}
					// reconstruct crumbs from data
					// check if bookmark is in root if not do nothing
					var intParent = objBookmark.parent_id;
					if (intParent != 0) {
						// if not then reconstruct the crumbs from parent and stack id
						app.arrCrumbs = app.newParentArray(null);
						var intParentFinds = 0;
						while (intParentFinds++ < 1000) {
							var objStack = objStackIdLookup[intParent];
							if (!objStack)
								break;
							intParent = objStack.parent_id * 1;
							app.arrCrumbs.unshift(objStack.stack_id * 1);
							app.arrCrumbsValues.unshift(objStack.nickname);
						};
						app.arrCrumbs.unshift(0);
						app.arrCrumbsValues.unshift("");
						$("#save-location-input").val(app.arrCrumbsValues.join("/"));
					} else {
						$("#save-location-input").val('/');
					}
				}
				// if there was crumbs returned duplicate them so they are the same as last values
				app.arrLastCrumbs = app.arrCrumbs.slice(0);
				app.arrLastCrumbsValues = app.arrCrumbsValues.slice(0);
			}
			// loop through crumbs to see if temp crumbs are no longer in use
			// if they are, initialize a the deletion of them
			function cleanUpTempStacks() {
				var intCrumbs = app.arrCrumbs.length,
					arrDeleteItems = [];
				for (var intStack in arrTempStacks) {
					var boolFound = false;
					for (var intItr = 0; intItr != intCrumbs; ++intItr) {
						var intCrumb = app.arrCrumbs[intItr];
						if (intStack == intCrumb) {
							boolFound = true;
							break;
						}
					}
					if (!boolFound) {
						var intParent = arrTempStacks[intStack];
						if (!app.data.stacks[intParent])
							continue;
						arrDeleteItems.push(intStack);
						var intCurrent = app.data.stacks[intParent].length;
						if (intCurrent == 1) {
							delete app.data.stacks[intParent];
						} else {
							for (var intItr = 0; intItr != intCurrent; ++intItr) {
								var objStack = app.data.stacks[intParent][intItr];
								if (!objStack)
									continue;
								if (objStack.stack_id == intStack)
									delete app.data.stacks[intParent][intItr];
							}
						}
						delete arrTempStacks[intStack];
					}
				}
				if (arrDeleteItems.length)
					app.backgroundPost({
						url: "https://webcull.com/api/remove",
						post: {
							stack_id: arrDeleteItems
						},
						success: function () {

						}
					});
			}
			function didCrumbsChange() {
				var strCrumbsString = app.arrCrumbsValues.join("\t").replace(/\t+$/, ''),
					strLastCrumbsString = app.arrLastCrumbsValues.join("\t").replace(/\t+$/, '');
				if (strCrumbsString != strLastCrumbsString)
					return true;
				strCrumbsString = app.arrCrumbs.join("\t").replace(/\t+$/, '');
				strLastCrumbsString = app.arrLastCrumbs.join("\t").replace(/\t+$/, '');
				if (strCrumbsString != strLastCrumbsString)
					return true;
			}
			app.saveCrumbs = saveChanges;
			function saveChanges() {
				if (!didCrumbsChange()) {
					return;
				}
				var objBookmark = app.getBookmark();
				app.backgroundPost({
					url: "https://webcull.com/api/savelocation",
					post: {
						arrCrumbs: app.arrCrumbs,
						arrCrumbsValues: app.arrCrumbsValues,
						stack_id: objBookmark.stack_id
					}
				}).then(function (data) {
					var intNewStacks = data.new_stack_ids.length;
					if (intNewStacks) {
						for (var intItr = 0; intItr != intNewStacks; ++intItr) {
							app.arrCrumbs.pop(); // take the nulls off the end
						}
						var
							intCrumbs = app.arrCrumbs.length,
							intParent = app.arrCrumbs[intCrumbs - 1] * 1;
						for (var intItr = 0; intItr != intNewStacks; ++intItr) {
							var intStack = data.new_stack_ids[intItr] * 1;
							app.arrCrumbs.push(intStack);
							if (!app.data.stacks[intParent])
								app.data.stacks[intParent] = [];
							var objNewStack = {
								stack_id: intStack,
								parent_id: intParent,
								is_url: 0,
								nickname: app.arrCrumbsValues[intItr + intCrumbs],
								value: "",
								order_id: app.data.stacks[intParent].length + 1
							};
							arrTempStacks[intStack] = intParent;
							app.data.stacks[intParent].push(objNewStack);
							intParent = intStack;
						}
						app.arrLastCrumbs = app.arrCrumbs.slice(0);
						app.arrLastCrumbsValues = app.arrCrumbsValues.slice(0);
					}
					cleanUpTempStacks();
				}
				);
				app.arrLastCrumbs = app.arrCrumbs.slice(0);
				app.arrLastCrumbsValues = app.arrCrumbsValues.slice(0);
			}
			function displayNoStacks() {
				var intMenuItems = $(".save-location-drop-item:not(.hidden)").length;
				// find new stacks
				var arrMissingNicknames = [];
				var intCrumbs = app.arrCrumbs.length;
				for (var intItr = 0; intItr != intCrumbs; ++intItr) {
					var intCrumb = app.arrCrumbs[intItr];
					if (intCrumb === null) {
						var strCrumbValue = app.arrCrumbsValues[intItr];
						if (strCrumbValue.length)
							arrMissingNicknames.push(strCrumbValue);
					}
				}
				if (intMenuItems == 0) {
					if (!$saveLocationDrop.find(".save-location-drop-message").length)
						$empty = $("<div class='save-location-drop-message'>No stacks</div>").appendTo($saveLocationDrop);
					if (arrMissingNicknames.length) {
						$empty.html("Create stack: <b>" + arrMissingNicknames.join("/") + "</b>");
					} else {
						$empty.html("No stacks");
					}
				} else {
					if ($empty) {
						$empty.remove();
					}
				}
			}
			// draw menu
			function drawMenu(intParent) {
				$saveLocationDrop[0].scrollTop = 0;
				intMenuItem = intParent;
				$saveLocationDrop.html('');
				var
					arrStacks = app.data.stacks[intParent],
					arrBuffer = [];
				if (arrStacks) {
					for (var intStack in arrStacks) {
						var objStack = arrStacks[intStack];
						if (objStack.is_url == 0)
							arrBuffer.push(objStack);
					}
					arrBuffer.sort(function (a, b) {
						return a.order_id - b.order_id;
					});
					var intItr2 = 0;
					for (var intItr in arrBuffer) {
						var objStack = arrBuffer[intItr];
						if (objStack.is_url == 1) {
							continue;
						}
						var $item = $("<div class='save-location-drop-item' id='save-location-drop-" + objStack.stack_id + "'>")
						.click((function (objStack) {
							return function () {
								var strVal = $input.val(),
									arrVals = strVal.split(/\//);
								app.arrCrumbs[intOpenMunuIndex + 1] = objStack.stack_id * 1;
								app.arrCrumbsValues[intOpenMunuIndex + 1] = objStack.nickname;
								arrVals[intOpenMunuIndex + 1] = objStack.nickname;
								if (intOpenMunuIndex != app.arrCrumbs.length - 2) {
									arrVals.length = intOpenMunuIndex + 2;
									app.arrCrumbs.length = intOpenMunuIndex + 2;
									app.arrCrumbsValues.length = intOpenMunuIndex + 2;
								}
								arrVals.push("");
								$input.val(arrVals.join("/"));
								processLocationText();
							};
						})(objStack))
						.text(objStack.nickname)
						.appendTo($saveLocationDrop)
						.if(intItr2++ == 0)
						.addClass('selected');
					}
					highlightSelected(intSelectedCrumb);
				}
			}
			// look for any changes in the text and caret location
			app.processLocationText = processLocationText;
			function processLocationText() {
				// take the input val, split it
				var
				strVal = $input.val(),
				arrVals = strVal.split(/\//),
				intVals = arrVals.length,
				strLastVal = arrVals[intVals - 1],
				intCaretPos = $input[0].selectionStart,
				intCaretItem,
				intValCharPast = 0,
				strNewKeyword = null;
				if (
					arrVals.length < 2
					|| arrVals[0] != ""
				) {
					$input.val("/" + strVal);
					return processLocationText();
				}
				if (strVal.match(/\/\//)) {
					$input.val(strVal.replace(/\/\//, '/'));
					return processLocationText();
				}
				// keep the crumb buffer in sync with whats in the text
				// whats in the buffer is always the top priority unless it's undefined and theres a match
				// text matching must be done through id when possible because duplicate names is a thing
				for (var intItr = 1; intItr != intVals; intItr++) {
					var
					strTextCrumb = arrVals[intItr], // from text
					intCrumb = app.arrCrumbs[intItr], // from mem
					intParentCrumb = app.arrCrumbs[intItr - 1],
					strCrumb = app.arrCrumbsValues[intItr]; // from mem
					// if the parent doesnt exist theres nothing to search which means its always new
					if (intParentCrumb === null && app.arrCrumbs.length > 2) { // no parent
						app.arrCrumbs[intItr] = null; // set as new folder
						app.arrCrumbsValues[intItr] = strTextCrumb;
						// if theres not crumb id do a text
					} else {//} else if (strTextCrumb != strCrumb) { 
						// optimize process when nothings there
						if (strTextCrumb == "") {
							app.arrCrumbs[intItr] = null;
							app.arrCrumbsValues[intItr] = "";
							continue;
						}
						
						// didnt match. modify whats in the buffer if it differs from what in the text
						// text that doesnt match must be considered a change of folder or new folder if it doesnt exist
						// load the child folders to see if there's something else that does match
						var
						arrStacks = app.data.stacks[intParentCrumb],
						arrBuffer = [];
						if (!arrStacks) {
							app.arrCrumbs[intItr] = null;
							app.arrCrumbsValues[intItr] = strTextCrumb;
							continue;
						}
						for (var intStack in arrStacks) {
							var objStack = arrStacks[intStack];
							if (objStack.is_url == 0)
								arrBuffer.push(objStack);
						}
						arrBuffer.sort(function (a, b) {
							return a.order_id - b.order_id;
						});
						// search for an id or text mismatch
						var boolTextSearch = false;
						textSearch: while (1) {
							boolTextSearch = false;
							for (var intBuffer in arrBuffer) {
								var objStack = arrBuffer[intBuffer];
								if (intCrumb != null) { // we have id. always prioritize id over a text search
									if (objStack.stack_id == intCrumb) {
										// verify if the text matches the stack
										if (objStack.nickname != strTextCrumb) {
											// it doesn't anymore. which means the text was changed
											// kill the association and resart the search
											intCrumb = null;
											continue textSearch;
										} else {
											boolTextSearch = true;
											break;
										}
									}
								} else { // we don't have an id
									// when theres no id in the buffer a text can be matched using a text search
									if (strTextCrumb == objStack.nickname) { // text matches
										boolTextSearch = true;
										app.arrCrumbs[intItr] = objStack.stack_id * 1; // set as new folder	
										app.arrCrumbsValues[intItr] = strTextCrumb;
										break;
									}
								}
							}
							break;
						}
						// add blanks at end
						if (!boolTextSearch) {
							app.arrCrumbs[intItr] = null; // set as new folder
							app.arrCrumbsValues[intItr] = strTextCrumb;
							//displayNoStacks();
						}
					}
				}
				// remove an items from the end that are no longer in the text
				app.arrCrumbs.length = intItr;
				app.arrCrumbsValues.length = intItr;

				// find the item the caret is on an item
				for (var intItr = 0; intItr != intVals; intItr++) {
					var strCurrentVal = arrVals[intItr],
					intCurrentVal = strCurrentVal.length;
					if (
						intCaretPos >= intValCharPast
						&& intCaretPos <= intValCharPast + intCurrentVal
					) {
						intCaretItem = intItr;
						break;
					}
					intValCharPast += intCurrentVal + 1;
				}
				/// wtf is going on here
				if (!intCaretItem)
					intCaretItem++;
				intCaretItem--;
				intSelectedCrumb = app.arrCrumbs[intCaretItem + 1];
				intOpenMunuIndex = intCaretItem;
				var boolLastCrumb = intCaretItem == intVals - 2;
				var intCrumb = !intCaretItem ? 0 : app.arrCrumbs[intCaretItem];
				if (intMenuItem != intCrumb || (intSelectedCrumb == null && !boolLastCrumb)) {
					drawMenu(intCrumb);
				}
				if (
					intMenuItem == null
					|| boolLastCrumb
					|| (
						intSelectedCrumb == null
					)
				) {
					narrowMenuList(app.arrCrumbsValues[intCaretItem + 1]);
				}
				displayNoStacks();
			}
			function highlightSelected(intCrumb) {
				$saveLocationDrop.find('.save-location-drop-item').removeClass('selected');
				$("#save-location-drop-" + intCrumb).addClass('selected');
				keepSelectionInView();
			}
			function narrowMenuList(strSearch) {
				var intSearch = !strSearch ? 0 : strSearch.length,
					boolMenuChanged = false;
				$saveLocationDrop.find(".save-location-drop-item").each(function () {
					var $this = $(this),
						strVal = $this.html(),
						strSubVal = strVal.substr(0, intSearch);
					if ((!intSearch || strSubVal.toLowerCase() === strSearch.toLowerCase())) {
						if ($this.hasClass('hidden')) {
							$this.removeClass('hidden');
							boolMenuChanged = true;
						}
					} else if (intSearch) {
						if (!$this.hasClass('hidden')) {
							$this.addClass('hidden');
							boolMenuChanged = true;
						}
					}
				});
				if (boolMenuChanged) {
					$saveLocationDrop.find('.selected').removeClass('selected');
					var $nonHiddenItems = $saveLocationDrop.find(".save-location-drop-item:not(.hidden)");
					if ($nonHiddenItems.length) {
						if ($empty) {
							$empty.remove();
							$empty = null;
						}
						$nonHiddenItems.become(0).addClass('selected');
					} else {
						displayNoStacks();
					}
				}
			}
			function bindKeyboard() {
				$input.bind('keydown', function (e) {
					var
						boolNavigateUp = e.key == 'ArrowUp',
						boolNavigateDown = e.key == 'ArrowDown';
					if (boolNavigateUp || boolNavigateDown) {
						e.preventDefault();
					}
					if (boolNavigateUp) {
						var
							$selected = $saveLocationDrop.find(".selected:not(.hidden)");
						if (!$selected.length) {
							$selected = $saveLocationDrop.find(".save-location-drop-item:not(.hidden)").become(-1).addClass('selected');
						} else {
							var
								$next = $selected.prev('.save-location-drop-item:not(.hidden)');
							$selected.removeClass('selected');
							if ($next.length) {
								$next.addClass('selected');
							} else {
								$selected.removeClass("selected");
							}
						}
						keepSelectionInView();
					} else if (boolNavigateDown) {
						var
							$selected = $saveLocationDrop.find(".selected:not(.hidden)");
						if (!$selected.length) {
							$selected = $saveLocationDrop.find(".save-location-drop-item:not(.hidden)").become(0).addClass('selected');
						} else {
							var
								$next = $selected.next('.save-location-drop-item:not(.hidden)');
							$selected.removeClass('selected');
							if ($next.length) {
								$next.addClass('selected');
							} else {
								$selected.removeClass("selected");
								$saveLocationDrop[0].scrollTop = 0;
							}
						}
						keepSelectionInView();
					} else if (e.key == "Enter") {
						$saveLocationDrop.find(".save-location-drop-item.selected").trigger('click');
					} else {
						processLocationText();
					}
				});
			}
			function keepSelectionInView() {
				var
					$selected = $saveLocationDrop.find('.selected');
				if ($selected.length) {
					intSelectedHeight = $selected.height(),
						intDropTop = $saveLocationDrop[0].scrollTop,
						intDropHeight = $saveLocationDrop.height(),
						intDropBottom = intDropHeight + intDropTop,
						intSelectedOffset = $selected.offset().top,
						intSelectedTop = intSelectedOffset + intDropTop,
						intSelectedBottom = intSelectedTop + intSelectedHeight;
					if (intSelectedBottom > intDropBottom) {
						// too low
						$saveLocationDrop[0].scrollTop = intSelectedTop;
					} else if (intSelectedOffset < 0) {
						// too low
						$saveLocationDrop[0].scrollTop = Math.max(0, intSelectedTop - intDropHeight + intSelectedHeight);
					}
				}
			}
			function dropMenu() {
				$("#save-location .placeholder").append($saveLocationDrop);
				boolMenuDropped = true;
			}
			function activateLoaf() {
				// intialize drop menu
				if (!boolMenuDropped) {
					var
					intCrumbs = app.arrCrumbs.length,
					intParent = !app.arrCrumbs.length ? 0 : app.arrCrumbs[intCrumbs - 1];
					dropMenu();
					intOpenMunuIndex = 0; // autocomplete always starts from root
					drawMenu(intParent); 
				}
				processLocationText();
			}
			app.deactivateLoaf = deactivateLoaf;
			function deactivateLoaf() {
				boolMenuDropped = false;
				$saveLocationDrop.remove();
				app.saveCrumbs();
			}
			var refDeactivationTimeout,
			refAutosaveLocation;
			bindKeyboard();
			$("#save-location-input").on("focus keyup keydown keypress click change", function () {
				if (refDeactivationTimeout)
					$.clear(refDeactivationTimeout);
				if (refAutosaveLocation)
					$.clear(refAutosaveLocation);
				refAutosaveLocation = $.delay(200, app.saveCrumbs);
				activateLoaf();
			});
			$("#save-location-input").on("blur", function () {
				refDeactivationTimeout = $.delay(200, app.deactivateLoaf);
			});
		})();

		/** Tags input suggestion drop down  */
		(function () {
			var $tagsInput = $("#bookmark-tags-input"), tagsHideTimeout;
			$tagsInput.on("focus keyup keydown keypress click change", function () {
				if (tagsHideTimeout) $.clear(tagsHideTimeout);
				return true
			});
			$tagsInput.on("blur", function () {
				tagsHideTimeout = $.delay(200, function () {
					$tagsInput[0].inputAutocomplete 
					&& $tagsInput[0].inputAutocomplete.hide();
					return true
				});
			});

			var tags = new InputAutocomplete({
				selector: '#tags',
				minCharactersForSuggestion: 1,
				suggestionCallback: function (input) {
					var arrTags = String(input).replace(/\s+/g, ',').split(',').filter(tag => tag.length > 0),
						input,
						arrTagObjects = [];
					if (!arrTags.length) return arrTagObjects;
					input = arrTags[arrTags.length - 1];
					arrTagObjects = Object.entries(app.objTags)
						.filter(arrKeyValue => arrTags.indexOf(arrKeyValue[0]) === -1)
						.filter(arrKeyValue => input.localeCompare(arrKeyValue[0].slice(0, input.length), undefined, { sensitivity: 'base' }) === 0)
						.map((arrKeyValue) => {
							return {
								value: arrKeyValue[0],
								text: arrKeyValue[0],
								description: `Used in ${arrKeyValue[1]} locations`
							}
						})
					return arrTagObjects
				},
				onSelect: function (selected) {
					var arrTags = String($tagsInput.val())
						.replace(/\s+/g, ',')
						.split(',')
						.filter(tag => tag.length > 0)
					arrTags.pop()
					arrTags.push(selected.text)
					$tagsInput.val(arrTags.join(",")).trigger('update');
				}
			});
		})();

		/*  Account switching */
		(function () {
			var $account_switcher = $("#account-switcher"),
			$bookmarkMainView = $("#bookmark-main-view"),
			$switchBtn = $("#bookmark-switch-user"),
			$switchBackBtn = $("#bookmark-switch-back");
			function showAccountSwitcher(e) {
				$account_switcher.addClass("animate-in")
				$bookmarkMainView.addClass("animate-out")
				$switchBtn.removeClass("show").addClass("hidden")
				$switchBackBtn.removeClass("hidden").addClass("show")
			}
			function hideAccountSwitcher(e) {
				$account_switcher.removeClass("animate-in")
				$bookmarkMainView.removeClass("animate-out")
				$switchBtn.removeClass("hidden").addClass("show")
				$switchBackBtn.removeClass("show").addClass("hidden")

			}
			window.hideAccountSwitcher = hideAccountSwitcher;
			$("#bookmark-switch-user").click(function (e) {
				showAccountSwitcher(e)
			});
			$("#bookmark-switch-back").click(function (e) {
				hideAccountSwitcher(e)
			});
		})();
	});
	app.is_loading = function () {
		$('body').addClass('is-loading-override');
	};
	function is_loaded() {
		$('body').removeClass('is-loading-override');
	}
}