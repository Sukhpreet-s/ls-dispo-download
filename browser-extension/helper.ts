export const urls = [
    "https://training.vri-research.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://training.vri-research.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://opinion-insight.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://opinion-insight.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://research-opinions.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://research-opinions.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://opinions-survey.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://opinions-survey.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://insight-polls.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://insight-polls.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://viewpointpoll.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://viewpointpoll.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://p.vri-research.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://p.vri-research.com/index.php/admin/responses/sa/*/surveyid/*",

    "https://m.vri-research.com/index.php/admin/edispnew/sa/index/surveyid/*",
    "https://m.vri-research.com/index.php/admin/responses/sa/*/surveyid/*",
];


export async function getCookies(): Promise<string | undefined> {
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
/*
 * Retreive cookie value of csrf token
 */
export async function getYIITokenFromCookies(): Promise<string | undefined> {
    return await getCookies();
}

export function getStaticPayloadValues(): string {
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


export function encodeArray(key: string, values: string[]): string {
    return values.map((currentVal: string) => {
        return `${key}%5B%5D=${currentVal}`;
    }).join('&');
}

/*
 * Retrieve survey id from the current page's url.
 */
export function extractSurveyId (url: string): string {
    const startIdx = url.lastIndexOf('/') + 1;
    return url.substring(startIdx);
}

/**
 * Retrieve the server name from URL.
 */
export function extractHostname(url: string): string | null {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (error) {
        // console.error("Invalid URL:", error);
        return null;
    }
}

/*
 * This function is currently not being used.
 * Retreive cookie value of csrf token in the context of content script.
 */
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
