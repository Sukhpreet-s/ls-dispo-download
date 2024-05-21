import { urls, extractHostname, extractSurveyId } from "./helper.js";
import { downloadFiles } from './fetch-ls.js';
browser.pageAction.onClicked.addListener(function (tab) {
    if (!tab.id)
        return; // This should not happen since the page_action should only be available if applicable tab is open.
    const serverName = extractHostname(tab.url);
    const surveyId = extractSurveyId(tab.url);
    if (!serverName || !surveyId) {
        console.error("Wrong tab or switched tab too quickly!");
        return;
    }
    downloadFiles(serverName, surveyId);
});
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    browser.pageAction.show(tab.id);
}, {
    urls: urls,
});
