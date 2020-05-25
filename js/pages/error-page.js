pages['error-page'] = function ($self) {
    getTab(function (tab) {
        $("html,body").removeClass('is-init');
        $("body").removeClass('is-loaded');
    });
};

$(function(){
    $("#error-page-retry").click(function(){
        console.log("error-page");
        paging("bookmark-page");
    });
});
