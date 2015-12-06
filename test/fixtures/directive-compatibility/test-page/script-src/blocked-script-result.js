$(function () {
    if ($('#script-src-blocked-js-file').text() !== 'script executed') {
        $('#script-src-blocked-js-file').text('script not executed');
        $('#script-src-blocked-js-file-result').text('OK');
    }
});
