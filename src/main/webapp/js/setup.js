$(document).bind("mobileinit", function(){

    $.extend($.mobile,{
        defaultPageTransition: 'slidefade', //or slide?
        defaultDialogTransition: 'pop'
    });


    $.mobile.page.prototype.options.addBackBtn = true;
    $.mobile.page.prototype.options.backBtnText = "Tilbake";


    // Listviews
    $.mobile.listview.prototype.options.headerTheme  = "b";  // Header for nested lists
    $.mobile.listview.prototype.options.theme        = "b";  // List items / content
    $.mobile.listview.prototype.options.dividerTheme = "b";  // List divider
    $.mobile.listview.prototype.options.splitTheme   = "b";
    $.mobile.listview.prototype.options.countTheme   = "b";
    $.mobile.listview.prototype.options.filterTheme  = "b";


    // Intercept calls to changePage() and fill pages with data from server
    $(document).bind("pagebeforechange", function(e, data) {
        var url = getURL(data);

        switch (getPage(data)) {
          case "frontpage":
            populateCompanies();
            break;

          case "agreement-list":
            $.mobile.showPageLoadingMsg();
            e.preventDefault();
            populateAgreements(url, data, $('#agreement-list-page'));
            break;

          case "agreement":
            $.mobile.showPageLoadingMsg();
            e.preventDefault();
            populateAgreementPage(url, data.options, $('#agreement-page'));
            break;

          default:
            break;
        }
    });

    function populateCompanies(data, page) {
        var list = $('#company-list');

        getData('companies', function(data) {
            list.empty();

            for(var i = 0; i<data.length; i++) {
                var company = data[i];
                list.append('<li data-companyid="' + company.id + '" data-companyname="' + company.name + '" data-swipeurl="companies/' + company.id + '">' +
                        '<a href="#agreement-list-page?companyid=' + company.id + '">' + company.name + '</a></li>');
            }

            list.listview('refresh');
        });
    }

    function populateAgreements(urlObj, options, page) {
        var companyId = getURLParameter("companyid", urlObj.href);
        var list = $('#agreement-list');
        var markup = "";

        getData('companies/' + companyId + '/agreements', function(data) {
            list.empty();

            for(var i = 0; i<data.length; i++)
            {
                var agreement = data[i];

                markup += ('<li data-agreementid="' + agreement.id + '" ' +
                        'data-agreementname="' + agreement.agreementNumber + '" ' +
                        'data-companyid="' + companyId + '" ' +
                        'data-swipeurl="companies/' + companyId + '/agreements/' + agreement.id + '">' +
                        '<a href="#agreement-page?agreementid=' + agreement.id + '&companyid=' + companyId + '">' + agreement.agreementNumber + '</a></li>');
            }

            list.append(markup);

            page.page();

            list.listview('refresh');

            attachSwipeDeleteListener();

            options.dataUrl = urlObj.href;

            $.mobile.changePage(page, options);
            $.mobile.hidePageLoadingMsg();
        });
    }


    function populateAgreementPage(urlObj, options, page) {
        var agreementId = getURLParameter("agreementid", urlObj.href);
        var companyId = getURLParameter("companyid", urlObj.href);
        $content = $(page).children(":jqmData(role=content)");

        getData('companies/' + companyId + '/agreements/' + agreementId, function(agreement) {
            var markup = '';
            markup += '<h4>Avtaledetaljer for ' + agreement.name + '</h4>';
            markup += '<p>Avtalenummer: ' + agreement.id + '</p>';
            markup += '<p>Medlemmer: ' +  agreement.members.join() + '</p>';
            markup += '<a href="#members-page?companyid' + companyId + '=&agreementid=' + agreementId + '" data-role="button">Vis medlemmer</a>';

            $content.html(markup);

            page.page();

            options.dataUrl = urlObj.href;

            $.mobile.changePage(page, options);
            $.mobile.hidePageLoadingMsg();
        });
    }

    function attachSwipeDeleteListener() {
        $('#agreement-list li').swipeDelete({
            btnTheme: 'e',
            btnLabel: 'Slett',
            btnClass: 'aSwipeButton',
            click: function(e) {
                e.preventDefault();
                e.stopPropagation();
                var url = $(e.target).closest('a.aSwipeButton').attr('href');
                $(this).parents('li').slideUp();
                $.ajax({
                    url: 'rest/' + url,
                    type: 'POST',
                    success:function(data) {
                        return false;
                    }
                });
            }
        });
    }

    function getURL(data) {
        var url = $.mobile.path.parseUrl(data.toPage);
        return url;
    }

    function getURLParameter(name, hash) {
        var parameter = RegExp(name + '=(.+?)(&|$)').exec(hash);
        if (parameter) {
          return decodeURI(parameter[1]);
        } else {
          return null;
        }
    }

    function getPage(data) {
      if (typeof data.toPage === "string") {
            var url = getURL(data);

            if (url.hash.search(/^#agreement-page/) !== -1) {
              return "agreement";
            } else if (url.hash.search(/^#agreement-list-page/) !== -1) {
              return "agreement-list";
            }
        } else if ($(data.toPage)[0]==$('#welcome-page')[0]) {
            return "frontpage";
        }
    }

    function getData(url, callback) {
        $.ajax({
            url: 'rest/' + url,
            dataType: "jsonp",
            success : callback
        });
    }
});
