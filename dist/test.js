browser.runtime.onMessage.addListener(function (message) {
    if (message === "initiateDownload") {
        console.log("This message is initiated by page action click and then background script");
        downloadFiles();
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
/*
 * Retrieve survey id from the current page's url.
 */
function getSurveyIdFromURL() {
    if (!location)
        return;
    const startIdx = location.pathname.lastIndexOf('/') + 1;
    return location.pathname.substring(startIdx);
}
/**
 * Retrieve the server name from URL.
 */
function getServerNameFromURL() {
    if (!location)
        return;
    return location.hostname;
    // const startIdxInclusive = location.pathname.indexOf('//') + 2;
    // const endIdxExclusive = location.pathname.indexOf('/', startIdxInclusive);
    // return location.pathname.substring(startIdxInclusive, endIdxExclusive);
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
/*
 * Download the terms file from enhanced disposition page
 */
async function downloadTermsCSV(surveyId, server) {
    const url = `https://${server}/index.php/admin/edispnew/sa/downloadCompleted/surveyid/${surveyId}/quotaId/all/quotaMode/all/quotaType/all`;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        // console.log("Blob here: ", blob);
        const blobURL = URL.createObjectURL(blob);
        const aTag = document.createElement('a');
        aTag.href = blobURL;
        aTag.download = `results-survey${surveyId}-terms.csv`;
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();
        URL.revokeObjectURL(blobURL);
    }
    catch (error) {
        console.error("Error while downloading terms file: ", error);
    }
}
/*
 * 1. Fetch the export results page
 * 2. Crawl through the page to find necessary values
 * Returns: string of multiple request payload options.
 * Request Payload Options:
    "YII_CSRF_TOKEN": "",
    "type": "csv",
    "export_from": "1",
    "export_to": "2", 9
    "completionstate": "complete",
    "exportlang": "en",
    "headstyle": "code",
    "headspacetounderscores": "0",
    "abbreviatedtext": "0",
    "abbreviatedtextto": "15",
    "emcode": "0",
    "codetextseparator": ".+",
    "answers": "short",
    "converty": "Y",
    "convertyto": "1",
    "convertnto": "2",
    "sid": "463994",
    "colselect[]": [
    "rotation1[]": [
    "rotation2[]": [
    "rotation3[]": [
    "rotation4[]": [
    "close-after-save": "false"
 */
async function getRequestPayload(surveyId, server) {
    const exportResultPageURL = `https://${server}/index.php/admin/export/sa/exportresults/surveyid/` + surveyId;
    try {
        const res = await fetch(exportResultPageURL);
        const pageHTML = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(pageHTML, 'text/html');
        let requestBodyString = '';
        // Extract colselect data
        const c = doc.querySelectorAll('select#colselect > option[selected="selected"');
        if (c.length > 0) {
            const colselectOptions = Array.from(c).map((el) => el.value);
            // console.log(colselectOptions);
            requestBodyString += encodeArray('colselect', colselectOptions);
        }
        // Extract rotation data
        const r = doc.querySelectorAll('div.tab-content > div');
        if (r.length > 0) {
            /*
             * [
             *  {rotation1: ["Q1", "Q2"]},
             *  ...
             *  ]
             */
            const rotationData = Array.from(r).map((el) => {
                const options = Array.from(el.querySelectorAll('option'))
                    // Filter only the 'selected' options
                    .filter((optionEl) => optionEl.selected)
                    // Only return the 'value' string for each options
                    .map((optionEl) => optionEl.value);
                return { [el.id]: options };
            });
            for (let rot of rotationData) {
                // Convert { "rot1": ["x", "y"] } => [ "rot1", ["x", "y"] ]
                // console.log("Rot: ", rot);
                const [keyName, value] = Object.entries(rot)[0];
                // console.log(keyName, value);
                requestBodyString += '&' + encodeArray(keyName, value);
            }
        }
        // Extract export_from & export_to values
        const exportFromInputEl = doc.getElementById('export_from');
        requestBodyString += '&' + 'export_from=' + exportFromInputEl.value;
        const exportToInputEl = doc.getElementById('export_to');
        requestBodyString += '&' + 'export_to=' + exportToInputEl.value;
        const csrfToken = getYIITokenFromCookies();
        const TOKEN_NAME = 'YII_CSRF_TOKEN';
        // TODO: Throw error if no token found
        csrfToken && (requestBodyString += '&' + `${TOKEN_NAME}=${csrfToken}`);
        requestBodyString += '&' + getStaticPayloadValues();
        // console.log(requestBodyString);
        return requestBodyString;
    }
    catch (error) {
        console.error("Huhahaha!, Boogie Man here!\n", error);
    }
}
/*
 * Download the all completes result file with options in the request body.
 */
async function downloadResultsOfType(surveyId, server, csvType, commonRequestPayload) {
    const exportResultURL = `https://${server}/index.php/admin/export/sa/exportresults/surveyid/` + surveyId;
    const requestHeaders = {
        "User-Agent": navigator.userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-CA,en-US;q=0.7,en;q=0.3",
        "Content-Type": "application/x-www-form-urlencoded",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document", // Verify if this is needed. It seems to get overriden in the browser network tab.
        "Sec-Fetch-Mode": "navigate", // Why is this set to 'cors' before sending the request by browser, check browser network tab.
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
    };
    try {
        let requestBody = commonRequestPayload;
        requestBody += '&' + `type=${csvType}`;
        requestBody += '&' + `sid=${surveyId}`;
        console.log("Request body: ", requestBody);
        const res = await fetch(exportResultURL, {
            "credentials": "include", // This must be present to include cookies in the request headers.
            "headers": requestHeaders,
            "body": requestBody,
            "method": "POST",
            "mode": "cors"
        });
        console.log("Response here: ", res);
        if (!res.ok) {
            console.error("Response: ", res);
            throw new Error("Bad response");
        }
        // TODO: Create a loading bar for downloading.
        const blob = await res.blob();
        // console.log("Blob here: ", blob);
        const blobURL = URL.createObjectURL(blob);
        const aTag = document.createElement('a');
        aTag.href = blobURL;
        aTag.download = `${csvType}-${surveyId}.csv`;
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();
        // Do you forget to breathe? No, right! So don't forget to revokeObjectURL :)
        URL.revokeObjectURL(blobURL);
    }
    catch (error) {
        console.error("Error while downloading\n", error);
    }
}
async function downloadFiles() {
    console.log("Hulululululuululu from Boogie Man!");
    // run code here
    let CSV_Types;
    (function (CSV_Types) {
        CSV_Types["CSV"] = "csv";
        CSV_Types["CSV_ERO"] = "export-rotation-orders";
        CSV_Types["CSV_EROO"] = "export-rotation-orders-options";
        CSV_Types["CSV_Tracker"] = "export-rotation-orders-tracker";
        CSV_Types["CSV_HM"] = "export-heatmap-text";
        CSV_Types["CSV_MCV"] = "export-multichice-encoded";
    })(CSV_Types || (CSV_Types = {}));
    const server = getServerNameFromURL();
    console.log("Server id: ", server);
    if (!server) {
        console.error("Cannot resolve server name");
        return;
    }
    const surveyId = getSurveyIdFromURL();
    if (!surveyId) {
        console.error("Cannot find survey id");
        return;
    }
    let commonRequestPayload = await getRequestPayload(surveyId, server);
    console.log("Download started!");
    await downloadResultsOfType(surveyId, server, CSV_Types.CSV.valueOf(), commonRequestPayload);
    await downloadResultsOfType(surveyId, server, CSV_Types.CSV_ERO.valueOf(), commonRequestPayload);
    await downloadResultsOfType(surveyId, server, CSV_Types.CSV_EROO.valueOf(), commonRequestPayload);
    await downloadResultsOfType(surveyId, server, CSV_Types.CSV_Tracker.valueOf(), commonRequestPayload);
    await downloadResultsOfType(surveyId, server, CSV_Types.CSV_HM.valueOf(), commonRequestPayload);
    await downloadResultsOfType(surveyId, server, CSV_Types.CSV_MCV.valueOf(), commonRequestPayload);
    await downloadTermsCSV(surveyId, server);
    console.log("Download ended!");
}
