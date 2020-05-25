pages['error-page'] = function ($self) {
    getTab(function (tab) {
        $("html,body").removeClass('is-init');
        $("body").removeClass('is-loaded');
    });

    var post = {
        url : "https://webcull.com/api/load",
        post : {}
    }
    setTimeout(retring, 2000);
};

$(function(){
    $("#error-page-retry").click(function(){
        retring();
    });
});

function retring()
{
    sessionPostWithRetries({
        url : "https://webcull.com/api/load",
        post : {}
    }, 1)
        .then(function (arrData) {
        if (arrData.no_user)
        paging("accounts-page");
    });
}