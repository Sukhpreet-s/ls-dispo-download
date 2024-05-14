import { urls, extractHostname, extractSurveyId } from "./helper.js";
import { downloadFiles } from './fetch-ls.js';
const filter = {
    urls: urls,
}

browser.pageAction.onClicked.addListener(function (tab: browser.tabs.Tab) {
    if (!tab.id) return; // This should not happen since the page_action should only be available if applicable tab is open.

    const serverName: string = extractHostname(tab.url);
    const surveyId: string = extractSurveyId(tab.url);
    if (!serverName || !surveyId) {
        console.error("Wrong tab or switched tab too quickly!");
        return;
    }

    downloadFiles(serverName, surveyId);
});

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    browser.pageAction.show(tab.id);
}, filter);
