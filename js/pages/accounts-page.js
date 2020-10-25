pages['accounts-page'] = function ($self) {
	getTab(function (tab) {
        $("html,body").removeClass('is-init');
        $("body").removeClass('is-loaded');
	});
};

$(function(){
    $("#account-page-sign-in,#addAccount").click(function(){
        browser.tabs.create({
            url: "https://webcull.com/accounts"
        });
       window.close();
    });
});