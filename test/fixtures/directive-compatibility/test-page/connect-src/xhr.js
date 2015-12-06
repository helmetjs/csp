$(function () {

    $.ajax({
        url: '/hello',
        success: function (res) {
            $('#connect-src-xhr').text(res);
            $('#connect-src-xhr-result').text('OK');
        },
        error: function () {
            $('#connect-src-xhr').text('FAILED');
            $('#connect-src-xhr-result').text('FAILED');
        }
    });

    $.ajax({
        url: 'http://echo.jsontest.com/should/not_show_up',
        success: function (res) {
            $('#connect-src-blocked-xhr').text(JSON.stringify(res));
            $('#connect-src-blocked-xhr-result').text('FAILED');
        },
        error: function () {
            $('#connect-src-blocked-xhr').text('xhr not executed');
            $('#connect-src-blocked-xhr-result').text('OK');
        }
    });

});
