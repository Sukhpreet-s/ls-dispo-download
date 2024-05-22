import { urls, extractHostname, extractSurveyId } from "./helper.js";
import { downloadFiles } from './fetch-ls.js';

browser.action.onClicked.addListener(function (tab: browser.tabs.Tab) {
    if (!tab.id) return; // This should not happen since the page_action should only be available if applicable tab is open.

    const validServerNames = [
        "training.vri-research.com",
        "opinion-insight.com",
        "research-opinions.com",
        "opinions-survey.com",
        "insight-polls.com",
        "viewpointpoll.com",
        "p.vri-research.com",
        "m.vri-research.com",
    ];

    const serverName: string = extractHostname(tab.url);
    const surveyId: string = extractSurveyId(tab.url);
    if (!serverName || !surveyId || !validServerNames.some(name => name===serverName) ) {
        console.error("Wrong tab or switched tab too quickly!");
        return;
    }

    downloadFiles(serverName, surveyId);
});
