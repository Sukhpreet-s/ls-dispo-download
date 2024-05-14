import { encodeArray, getYIITokenFromCookies, getStaticPayloadValues } from './helper.js';

export async function downloadFiles(server: string, surveyId: string) {
    enum CSV_Types {
        CSV = 'csv',
        CSV_ERO = 'export-rotation-orders',
        CSV_EROO = 'export-rotation-orders-options',
        CSV_Tracker = 'export-rotation-orders-tracker',
        CSV_HM = 'export-heatmap-text',
        CSV_MCV = 'export-multichice-encoded'
    }

    try {
        let commonRequestPayload: string = await getRequestPayload(surveyId, server);

        console.log("Download started!");
        await downloadResultsOfType(surveyId, server, CSV_Types.CSV.valueOf(), commonRequestPayload);
        await downloadResultsOfType(surveyId, server, CSV_Types.CSV_ERO.valueOf(), commonRequestPayload);
        await downloadResultsOfType(surveyId, server, CSV_Types.CSV_EROO.valueOf(), commonRequestPayload);
        await downloadResultsOfType(surveyId, server, CSV_Types.CSV_Tracker.valueOf(), commonRequestPayload);
        await downloadResultsOfType(surveyId, server, CSV_Types.CSV_HM.valueOf(), commonRequestPayload);
        await downloadResultsOfType(surveyId, server, CSV_Types.CSV_MCV.valueOf(), commonRequestPayload);
        await downloadTermsCSV(surveyId, server);
        console.log("Download ended!");

    } catch (error) {
        console.error("File download interrupted!");
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

/*
 * Download the terms file from enhanced disposition page
 */
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

/*
 * Download the all completes result file with options in the request body.
 */
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