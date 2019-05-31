/*global updateTitle*/
/*global hideElement*/
/*global transitionToPage*/
window.pages["initialChoice"] = function () {
    var container = document.createElement("div");
    container.id = "choiceContainer";

    window.filesToUpload = [];

    updateTitle("How will you share?");
    hideElement("backButton");
    hideElement("institutionSearchForm");

    var pdfDiv = document.createElement("div"),
        onlineDiv = document.createElement("div"),
        title = document.createElement("h4");

    onlineDiv.className = "onlineChoice";
    onlineDiv.innerHTML = "<h4>Bank Connect <span>FASTEST</span></h4>Securely retrieve financial data directly from your bank";
    onlineDiv.onclick = transitionToPage.bind(null, "institutionSelection", "online");

    pdfDiv.className = "pdfChoice";
    pdfDiv.innerHTML = "<h4>Upload Bank Statements</h4>Easily upload and share your bank statements.";
    pdfDiv.onclick = transitionToPage.bind(null, "institutionSelection", "pdf");

    title.className = "title";
    title.innerHTML = "Select how you would like to share your financial data.";
    container.appendChild(title);
    container.appendChild(onlineDiv);
    container.appendChild(pdfDiv);
    return container;
};