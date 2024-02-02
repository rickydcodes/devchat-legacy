let auditLogDiv = document.querySelector("#auditLogDiv");
let sortOptions = document.querySelectorAll(".sortOption");
let sort = "recentActions";
if (auditLogDiv != undefined) {
    getSortFromQueryString();
    sortOptions.forEach((sortOption) => {
        sortOption.addEventListener("click", sortBy);
    });
    getAuditLog();
}

function getSortFromQueryString() {
    let queryString = location.search.substring(1);
    let parameters = queryString.split("&");
    for (let parameter of parameters) {
        let parameterParts = parameter.split("=");
        if (parameterParts[0] == "sort") {
            sort = parameterParts[1];
        }
    }
    let sorts = ["recentActions", "myActions"];
    let id = sorts.indexOf(sort);
    let element = sortOptions[id];
    document.querySelector(".selected").classList.remove("selected");
    element.classList.add("selected");
    getAuditLog();
}

function sortBy() {
    document.querySelector(".selected").classList.remove("selected");
    this.classList.add("selected");
    sort = ["recentActions", "myActions"][this.id];
    addToHistory(`?sort=${sort}`);
    getAuditLog();
}

function getAuditLog() {
    let request = new XMLHttpRequest();
    request.addEventListener("load", showLogs);
    request.open("GET", `/getAuditLog?sort=${sort}`);
    request.send();
}

function addToHistory(queryString) {
    if (history.pushState) {
        let url = `${location.protocol}//${location.host}${location.pathname.substring(
            0,
            12
        )}${queryString}`;
        history.pushState(null, null, url);
    }
}

function showLogs() {
    let response = this.response;
    document.querySelector("#logs").innerHTML = response;
}
