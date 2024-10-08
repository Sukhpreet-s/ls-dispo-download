// When extension button is clicked, execute the download process 
browser.action.onClicked.addListener(async function (tab: browser.tabs.Tab) {
    if (!tab.id) return; // This should not happen since the page_action should only be available if applicable tab is open.
    // Check if on the right tab to execute the process.
    const serverName: string = extractHostname(tab.url);
    const surveyId: string = extractSurveyId(tab.url);
    const validServerNames = browser.runtime.getManifest().host_permissions
        .map(url => extractHostname(url));

    if (!serverName || !surveyId || !validServerNames.some(name => name===serverName) ) {
        console.error("Wrong tab or you're the fastest in the west since you changed tabs so fast!");
        return;
    }

    try {
        let commonRequestPayload: string = await getRequestPayload(surveyId, serverName);
        console.log("Download started!");
        const CSV_Types: string[] = [
            'csv',
            'export-rotation-orders',
            'export-rotation-orders-options',
            'export-rotation-orders-tracker',
            'export-heatmap-text',
            'export-multichice-encoded',
        ];
        for (let csvType of CSV_Types) {
            await downloadResultsOfType(surveyId, serverName, csvType, commonRequestPayload);
        }
        await downloadTermsCSV(surveyId, serverName);
        console.log("Download ended!");
    } catch (error) {
        console.error("File download interrupted!");
    }
});

// ----Data fetching functions below

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
    "sid": "",
    "colselect[]": [
    "rotation1[]": [
    "rotation2[]": [
    "rotation3[]": [
    "rotation4[]": [
    "close-after-save": "false"
 */
async function getRequestPayload(surveyId: string, server: string): Promise<string | undefined> {
    const exportResultPageURL: string = `https://${server}/index.php/admin/export/sa/exportresults/surveyid/` + surveyId;
    try {
        const res = await fetch(exportResultPageURL);
        const pageHTML = await res.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(pageHTML, 'text/html');

        let requestBodyString: string = '';

        // Extract colselect data
        const c: NodeListOf<HTMLOptionElement> = doc.querySelectorAll('select#colselect > option[selected="selected"');
        if (c.length > 0) {
            const colselectOptions: string[] = Array.from(c).map((el: HTMLOptionElement) => el.value);
            requestBodyString += encodeArray('colselect', colselectOptions);
        }

        // Extract rotation data
        const r: NodeListOf<HTMLDivElement> = doc.querySelectorAll('div.tab-content > div');
        if (r.length > 0) {
            /*
             * [
             *  {rotation1: ["Q1", "Q2"]},
             *  ...
             *  ]
             */
            const rotationData: { [id: string]: string[] }[] = Array.from(r).map((el: HTMLDivElement) => {
                const options: string[] = Array.from(el.querySelectorAll('option'))
                    // Filter only the 'selected' options
                    .filter((optionEl: HTMLOptionElement) => optionEl.selected)
                    // Only return the 'value' string for each options
                    .map((optionEl: HTMLOptionElement) => optionEl.value);
                return { [el.id]: options };
            });

            for (let rot of rotationData) {
                // Convert { "rot1": ["x", "y"] } => [ "rot1", ["x", "y"] ]
                const [keyName, value]: [string, string[]] = Object.entries(rot)[0];
                requestBodyString += '&' + encodeArray(keyName, value);
            }
        }

        // Extract export_from & export_to values
        const exportFromInputEl: HTMLInputElement = doc.getElementById('export_from') as HTMLInputElement;
        requestBodyString += '&' + 'export_from=' + exportFromInputEl.value;
        const exportToInputEl: HTMLInputElement = doc.getElementById('export_to') as HTMLInputElement;
        requestBodyString += '&' + 'export_to=' + exportToInputEl.value;

        const csrfToken: string = await getYIITokenFromCookies();
        const TOKEN_NAME: string = 'YII_CSRF_TOKEN';
        // TODO: Throw error if no token found
        csrfToken && (requestBodyString += '&' + `${TOKEN_NAME}=${csrfToken}`);

        requestBodyString += '&' + getStaticPayloadValues();

        return requestBodyString;
    } catch (error) {
        throw new Error("Error while building request payload!");
    }
}

// Download the terms file from enhanced disposition page
async function downloadTermsCSV(surveyId: string, server: string): Promise<void> {
    const url: string = `https://${server}/index.php/admin/edispnew/sa/downloadCompleted/surveyid/${surveyId}/quotaId/all/quotaMode/all/quotaType/all`;
    try {

        const res = await fetch(url);
        const blob = await res.blob();
        const blobURL = URL.createObjectURL(blob);

        const aTag = document.createElement('a');
        aTag.href = blobURL;
        aTag.download = `results-survey${surveyId}-terms.csv`;
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();

        URL.revokeObjectURL(blobURL);
    } catch (error) {
        throw new Error("Error while downloading terms file");
    }
}

// Download the all completes result file with options in the request body.
async function downloadResultsOfType(surveyId: string, server: string, csvType: string, commonRequestPayload: string) {
    const exportResultURL: string = `https://${server}/index.php/admin/export/sa/exportresults/surveyid/` + surveyId;
    const requestHeaders = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    try {
        let requestBody: string = commonRequestPayload;
        requestBody += '&' + `type=${csvType}`;
        requestBody += '&' + `sid=${surveyId}`;

        const res = await fetch(exportResultURL, {
            // "credentials": "include", // This is not needed as it is automatically being set.
            "headers": requestHeaders,
            "body": requestBody,
            "method": "POST",
        });
        if (!res.ok) {
            throw new Error(`Bad response while downloading ${csvType}`);
        }

        // TODO: Create a loading bar for downloading.
        const blob = await res.blob();
        const blobURL = URL.createObjectURL(blob);

        const aTag = document.createElement('a');
        aTag.href = blobURL;
        aTag.download = `${csvType}-${surveyId}.csv`;
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();

        URL.revokeObjectURL(blobURL);
    } catch (error) {
        throw new Error(`While downloading type: ${csvType}`);
    }
}

// ----Some extra helper functions below

function getStaticPayloadValues(): string {
    let payload: string = '';
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

// Retreive cookie value of csrf token
async function getYIITokenFromCookies(): Promise<string | undefined> {
    const tab = (await browser.tabs.query({ currentWindow: true, active: true })).pop();

    const cookies = await browser.cookies.getAll({ url: tab.url });

    if (cookies.length > 0) {
        for (let cookie of cookies) {
            if (cookie.name === "YII_CSRF_TOKEN") {
                return cookie.value;
            }
        }
    }
}

// Convert an array into string with encoding required by the server.
function encodeArray(key: string, values: string[]): string {
    return values.map((currentVal: string) => {
        return `${key}%5B%5D=${currentVal}`;
    }).join('&');
}

// Retrieve survey id from the current page's url.
function extractSurveyId (url: string): string | null {
    const startIdx = url.lastIndexOf('/') + 1;
    const surveyId = url.substring(startIdx);
    if (surveyId === ""){
        return null;
    }
    return surveyId;
}

// Retrieve the server name from URL.
function extractHostname(url: string): string | null {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (error) {
        return null;
    }
}

// This function is currently not being used.
// Retreive cookie value of csrf token in the context of content script.
function OLD_getYIITokenFromCookies(): string {
    if (!document || !document.cookie) return;

    const TOKEN_NAME: string = 'YII_CSRF_TOKEN';
    const cookieList = document.cookie.split(';');

    for (let cookie of cookieList) {
        const c = cookie.trim();
        if (c.startsWith(TOKEN_NAME)) {
            const startIdx: number = c.lastIndexOf('=') + 1;
            return c.substring(startIdx);
        }
    }
}
