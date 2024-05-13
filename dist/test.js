browser.runtime.onMessage.addListener(function (message) {
    if (message === "initiateDownload") {
        console.log("This message is initiated by page action click and then background script");
        // downloadFiles();
    }
});
/*
 * CSV type: csv
 * CSV from ExportRotationOrders type: "export-rotation-orders"
 * CSV from ExportRotationOrdersOptions type: "export-rotation-orders-options"
 * CSV with Tracker type: export-rotation-orders-tracker
 * CSV Heatmap Text type: export-heatmap-text
 * CSV with MultiChoice Combined Var type: export-multichice-encoded
 */
/*
 * Convert, colselect: ["x", "y"] => "colselect %5B%5D = x & colselect %5B%5D = y" without spaces
 * %5B => [
 * %5D => ]
 */
function encodeArray(key, values) {
    return values.map((currentVal) => {
        return `${key}%5B%5D=${currentVal}`;
    }).join('&');
}
/**
 * Retrieve the server name from URL.
 */
function getServerNameFromURL() {
    if (!location)
        return;
    return location.hostname;
}
function getStaticPayloadValues() {
    let payload = '';
    payload += '&' + 'completionstate' + '=' + 'all';
    payload += '&' + 'exportlang' + '=' + 'en';
    payload += '&' + 'headstyle' + '=' + 'code';
    payload += '&' + 'headspacetounderscores' + '=' + '0';
    payload += '&' + 'abbreviatedtext' + '=' + '0';
    payload += '&' + 'abbreviatedtextto' + '=' + '15';
    payload += '&' + 'emcode' + '=' + '0';
    payload += '&' + 'codetextseparator' + '=' + '.+';
    payload += '&' + 'answers' + '=' + 'short';
    payload += '&' + 'converty' + '=' + 'Y';
    payload += '&' + 'convertyto' + '=' + '1';
    payload += '&' + 'convertnto' + '=' + '2';
    payload += '&' + 'addmcothercol' + '=' + 'Y';
    payload += '&' + 'close-after-save' + '=' + 'false';
    return payload;
}
/*
 * Retreive cookie value of csrf token
 */
function getYIITokenFromCookies() {
    if (!document.cookie)
        return;
    const TOKEN_NAME = 'YII_CSRF_TOKEN';
    const cookieList = document.cookie.split(';');
    // console.log("cookies: ", cookieList);
    for (let cookie of cookieList) {
        const c = cookie.trim();
        // console.log('    -> ', c);
        if (c.startsWith(TOKEN_NAME)) {
            const startIdx = c.lastIndexOf('=') + 1;
            // console.log("found! startIdx: ", startIdx);
            return c.substring(startIdx);
        }
    }
}
