import { urls, getYIITokenFromCookies, getStaticPayloadValues, encodeArray2 } from "./test-helper.js";
const filter = {
    urls: urls,
}

browser.pageAction.onClicked.addListener(function(tab: browser.tabs.Tab) {
    if (!tab.id) return; // This should not happen since the page_action should only be available if applicable tab is open.
    // browser.tabs.sendMessage(tab.id, "initiateDownload");

    // getRP('463994', 'training.vri-research.com');
    downloadCSV('463994', 'training.vri-research.com');
});

function accessRequstHeaders(details: browser.webRequest._OnBeforeSendHeadersDetails): browser.webRequest.BlockingResponse {
    console.log("Request details: ", details);
    return { requestHeaders: details.requestHeaders };
}

browser.webRequest.onBeforeSendHeaders.addListener(
    accessRequstHeaders,
    { urls: [filter.urls[0], filter.urls[1]] },
    ["blocking", "requestHeaders"],
);

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    // console.log("tab updated event", tab.id);
    browser.pageAction.show(tab.id);
}, filter);

async function downloadCSV(surveyId: string, server: string, csvType: string = 'csv') {
    const exportResultURL: string = `https://${server}/index.php/admin/export/sa/exportresults/surveyid/` + surveyId;
    const requestHeaders = {
        // "User-Agent": navigator.userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        // "Accept-Language": "en-CA,en-US;q=0.7,en;q=0.3",
        "Content-Type": "application/x-www-form-urlencoded",
        // "Upgrade-Insecure-Requests": "1",
        // "Sec-Fetch-Dest": "document", // Verify if this is needed. It seems to get overriden in the browser network tab.
        // "Sec-Fetch-Mode": "navigate", // Why is this set to 'cors' before sending the request by browser, check browser network tab.
        // "Sec-Fetch-Site": "same-origin",
        // "Sec-Fetch-User": "?1",
    }

    try {
        console.log(`Sending the request with ${surveyId} ${server}`);
        let requestBody: string = await getRP(surveyId, server);
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
        console.log("Blob here: ", blob);
        // const blobURL = URL.createObjectURL(blob);
        //
        // const aTag = document.createElement('a');
        // aTag.href = blobURL;
        // aTag.download = `${csvType}-${surveyId}.csv`;
        // document.body.appendChild(aTag);
        // aTag.click();
        // aTag.remove();
        //
        // // Do you forget to breathe? No, right! So don't forget to revokeObjectURL :)
        // URL.revokeObjectURL(blobURL);
    } catch (error) {
        console.error("Error while downloading\n", error);
    }
}

async function getRP(surveyId: string, server: string): Promise<string | undefined> {
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
            // console.log(colselectOptions);
            requestBodyString += encodeArray2('colselect', colselectOptions);
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
                // console.log("Rot: ", rot);
                const [keyName, value]: [string, string[]] = Object.entries(rot)[0];
                // console.log(keyName, value);
                requestBodyString += '&' + encodeArray2(keyName, value);
            }
        }

        // Extract export_from & export_to values
        const exportFromInputEl: HTMLInputElement = doc.getElementById('export_from') as HTMLInputElement;
        requestBodyString += '&' + 'export_from=' + exportFromInputEl.value;
        const exportToInputEl: HTMLInputElement = doc.getElementById('export_to') as HTMLInputElement;
        requestBodyString += '&' + 'export_to=' + exportToInputEl.value;

        const csrfToken: string = await getYIITokenFromCookies();
        const TOKEN_NAME: string = 'YII_CSRF_TOKEN';
        if (!csrfToken) throw new Error("Invalid or CSRF token not found");
        csrfToken && (requestBodyString += '&' + `${TOKEN_NAME}=${csrfToken}`);

        requestBodyString += '&' + getStaticPayloadValues();

        // console.log(requestBodyString);
        return requestBodyString;
    } catch (error) {
        console.error("Huhahaha!, Boogie Man here!\n", error);
    }
}
