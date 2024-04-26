browser.pageAction.onClicked.addListener(function (tab) {
    if (!tab.id)
        return; // This should not happen since the page_action should only be available if applicable tab is open.
    browser.tabs.sendMessage(tab.id, "initiateDownload");
});
const filter = {
    urls: [
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
    ],
};
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    // console.log("tab updated event", tab.id);
    browser.pageAction.show(tab.id);
}, filter);
