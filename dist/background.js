browser.pageAction.onClicked.addListener(function (tab) {
    if (!tab.id)
        return; // This should not happen since the page_action should only be available if applicable tab is open.
    browser.tabs.sendMessage(tab.id, "initiateDownload");
});
const filter = {
    urls: [
        // TODO: Add all the servers 
        "https://training.vri-research.com/index.php/admin/edispnew/sa/index/surveyid/*",
        "https://training.vri-research.com/index.php/admin/responses/sa/index/surveyid/*",
    ],
};
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    // console.log("tab updated event", tab.id);
    browser.pageAction.show(tab.id);
}, filter);
