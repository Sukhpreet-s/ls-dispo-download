import { urls, extractHostname, extractSurveyId } from "./helper.js";
import { downloadFiles } from './fetch-ls.js';
const filter = {
    urls: urls,
};
browser.pageAction.onClicked.addListener(function (tab) {
    if (!tab.id)
        return; // This should not happen since the page_action should only be available if applicable tab is open.
    const serverName = extractHostname(tab.url);
    const surveyId = extractSurveyId(tab.url);
    downloadFiles(serverName, surveyId);
});
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    // console.log("tab updated event", tab.id);
    browser.pageAction.show(tab.id);
}, filter);
