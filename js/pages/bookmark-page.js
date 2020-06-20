browser.runtime.connect();

var background = browser.extension.getBackgroundPage(),
	app = background.app,
	netWorkFlag = false,
	switchAccounts = function (event) {
		event.preventDefault()
		var email = event.target.dataset["email"]
		if (!email) return false
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
					<div class="userName">@chris<div class="userLoading hidden">
							<div class="radial-loader"></div>
						</div>
					</div>
				</div>
			</a>`;
		$userAccountList.html('')
		if (!arrUserAccounts.length) return
		for (let index = 0; index < arrUserAccounts.length; index++) {
			if (app.data.user && (app.data.user.name === arrUserAccounts[index].name)) continue;
			var user = arrUserAccounts[index], $user = $(markUp), username = user.name, icon = user.icon, email = user.email;
			if (icon) $user.find('.userIcon').css({ 'background-image': 'url("https://webcull.com/repository/images/users/avatar/' + icon + '")' });
			$user.find('.userIcon').attr('data-email', email)
			$user.find('.userName').html(username).attr('data-email', email)
			$user.attr('data-email', email)
			$user.attr('id', email)
			$user.appendTo($userAccountList)
		}
		$userAccountList.find('.userRow').each(function () {
			$(this).click(switchAccounts, false)
		})
	};

/* init process */
pages['bookmark-page'] = function ($self) {
	app.arrCrumbs = app.newParentArray(0);
	app.arrCrumbsValues = app.newParentArray("");
	app.arrLastCrumbs = app.arrCrumbs;
	app.arrLastCrumbsValues = app.arrCrumbsValues;
	getTab(function (tab) {
		var strURL = tab.url.replace(/ /, '+');
		if (1 == 0 && !strURL.match(/http(s)?:\/\//i)) {
			//paging("loading-page");
			// not http or https so just take user to webcull
			browser.tabs.update({
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
			var post = {
				url: "https://webcull.com/api/autosavelink",
				post: {
					url: strURL
				}
			};
			app.backgroundPost(post, 1).then(function (arrData) {
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
					$progressBar.addClass('response-recieved');
					$progressBar.addClass('assets-loaded');
					$("#account-user").html(arrData.user.name);
					if (arrData.user.icon) {
						var css = {
							'background-image': "url('https://webcull.com" + arrData.user.icon + "')"
						};
						if (arrData.user.icon == "/static/images/icons/general/temp5.png") {
							css.filter = 'invert(1)';
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
							$bookmarkStatus.find('u').text("Removal success ");
							$(this).text("Re-add");
							removeFlag = true;
						} else {
							$bookmarkStatus.find('u').text("Bookmark re-add ");
							$(this).text("Undo");
							$('.placeholder-input').removeAttr("disabled");
							removeFlag = false;

							app.backgroundPost({
								url: "https://webcull.com/api/autosavelink",
								post: {
									url: strURL
								}
							});
						}
					});
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
					$("body,html").css({
						minHeight: 445
					});
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
				// browser.tabs.update({
				// 	url: "https://webcull.com/accounts"
				// });
				// window.close();
			});
		}
	});
};

function retring() {
	paging("bookmark-page");
}

/* modules and binders */
$(function () {

	$("#bookmark-logout").click(function () {
		browser.tabs.update({
			url: "https://webcull.com/logout/index/acc/" + app.data.user.hash + "/"
		});
		window.close();
	});

	/* auto update textbox binder */
	$(".initStackUpdate").each(function () {
		$(this).stackUpdate();
	});

	/* bookmark location breadcrumbs binder */
	(function () {
		// init breadcrumbs
		var
			$input = $("#save-location-input"),
			boolMenuDropped = false,
			intOpenMunuIndex = 0,
			$saveLocationDrop = $("<div id='save-location-drop'></div>");
		$input.trigger('update'),
			intMenuItem = 0,
			intSelectedCrumb = 0,
			$empty = null,
			// a list of ids that have been created
			// stacks should be removed if they were created here but are no longer part of the list
			arrTempStacks = {};
		app.loadedPromises.push(function () {
			// work backwords to build the bread crumbs
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
				var
					intParent = objBookmark.parent_id;
				if (intParent != 0) {
					// if not then reconstruct the crumbs from parent and stack id
					app.arrCrumbs = app.newParentArray(null);
					while (1) {
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
				}
			}
			app.arrLastCrumbs = app.arrCrumbs.slice(0);
			app.arrLastCrumbsValues = app.arrCrumbsValues.slice(0);
		});
		// loop through crumbs to see if temp crumbs are no longer in use
		// if they are, initalize a the deletion of them
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
					$empty = $("<div class='save-location-drop-message'>Empty</div>").appendTo($saveLocationDrop);
				if (arrMissingNicknames.length) {
					$empty.html("Create stack: <b>" + arrMissingNicknames.join("/") + "</b>");
				} else {
					$empty.html("Empty");
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
		function processLocationText() {
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
			if (!boolMenuDropped) {
				var
					intCrumbs = app.arrCrumbs.length,
					intParent = !app.arrCrumbs.length ? 0 : app.arrCrumbs[intCrumbs - 1];
				dropMenu();
				intOpenMunuIndex = 0;
				drawMenu(intParent);
				bindKeyboard();
			}
			processLocationText();
		}
		function deactivateLoaf() {
			boolMenuDropped = false;
			$saveLocationDrop.remove();
			app.saveCrumbs();
		}
		var refDeactivationTimeout;
		$("#save-location-input").on("focus keyup keydown keypress click change", function () {
			if (refDeactivationTimeout)
				$.clear(refDeactivationTimeout);
			activateLoaf();
		});
		$("#save-location-input").on("blur", function () {
			refDeactivationTimeout = $.delay(50, deactivateLoaf);
		});
	})();

	/** Tags input suggestion drop down  */
	(function () {
		var $tagDrop = $("#save-tags-drop"),
			$tagInput = $("#bookmark-tags-input"),
			minCharactersForSuggestion = 2;
		function showTagSuggestions() {
			$tagDrop.removeClass('hidden').addClass('show')

		}
		function hideTagSuggestions() {
			$tagDrop.addClass('hidden').removeClass('show')

		}
		function clearSuggestions() {
			$tagDrop.html('')
		}
		function addSuggestion(suggestion) {
			var $item = document.createElement('div');
			$item.textContent = suggestion.value
			$item.classList.add('save-location-drop-item')
			$item.classList.add('bookmark-tags-suggestion')
			$item.setAttribute('data-value', suggestion.value)
			document.getElementById('save-tags-drop').appendChild($item)
			showTagSuggestions()
		}
		$tagInput.on('keyup', function (event) {
			hideTagSuggestions();
			clearSuggestions();
			var input = $tagInput.val() || '';
			if (!input.length) return true
			input = input.replace(/\s+/g, ',')
			var arrInput = input.split(",")
			input = arrInput[arrInput.length - 1].trim()
			if (input.length >= minCharactersForSuggestion) {
				var arrTagObjects = Object.entries(app.objTags)
					.map((arrKeyValue) => {
						return { value: arrKeyValue[0], text: arrKeyValue[0], description: `Used in ${arrKeyValue[1]} locations` }
					})
					.filter(value => input.localeCompare(value.text.slice(0, input.length), undefined, { sensitivity: 'base' }) === 0)
					.filter(value => arrInput.indexOf(value.text) === -1)

				arrTagObjects.forEach(function (suggestion) { addSuggestion(suggestion); });
			}
			// TODO @donc310
			// complete this
			$(".bookmark-tags-suggestion").each(function () {
				$(this).click(function (event) {
					var value = event.target.dataset["value"], currentTags = $tagInput.val();
					console.log(value, currentTags)

				}, false)
			})
		})
		$tagInput.on('blur', function (event) {
			hideTagSuggestions()
			clearSuggestions();
		})
	})();

	/*  Account switching */
	(function () {
		var $account_switcher = $("#account-switcher"),
			$bookmarkMainView = $("#bookmark-main-view"),
			$switchBtn = $("#bookmark-switch-user"),
			$switchBackBtn = $("#bookmark-switch-back");
		function showAccountSwitcher(e) {
			$bookmarkMainView.addClass('animate-opacity').addClass("hidden")
			$account_switcher.removeClass('hidden').addClass("animate-left")
			$switchBtn.removeClass("show").addClass("hidden")
			$switchBackBtn.removeClass("hidden").addClass("show")
		}
		function hideAccountSwitcher(e) {
			$account_switcher.addClass("animate-left").addClass("hidden")
			$bookmarkMainView.removeClass('hidden').addClass("animate-right")
			$switchBtn.removeClass("hidden").addClass("show")
			$switchBackBtn.removeClass("show").addClass("hidden")

		}
		$("#bookmark-switch-user").click(function (e) {
			showAccountSwitcher(e)
		});
		$("#bookmark-switch-back").click(function (e) {
			hideAccountSwitcher(e)
		});
	})();

	/* webcull action */
	$("#webcull-action").click(function () {
		chrome.tabs.update({
			url: "https://webcull.com/bookmarks/"
		});
		window.close();
	})
});