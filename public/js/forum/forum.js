let topicsList = document.querySelector("#topicsList");
let threadsDiv = document.querySelector("#threadsDiv");
let sortOptions = document.querySelectorAll(".sortOption");
let searchInput = document.querySelector("#searchInput");
let searchButton = document.querySelector("#searchButton");
let page = 0;
let pageCount = 0;
let topic = "";
let sort = "recent";
let searchText = "";

getThreadsFromQueryString();
searchButton.addEventListener("click", search);
searchInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        search();
    }
});
topicsList.addEventListener("change", selectTopic);
sortOptions.forEach((sortOption) => {
    sortOption.addEventListener("click", sortBy);
});

function search() {
    searchText = searchInput.value;
    displayThreads();
    updateUrl();
}

function viewThread() {
    let threadId = this.parentElement.parentElement.dataset.topicid;
    let request = new XMLHttpRequest();
    request.open("PATCH", `/viewThread?id=${threadId}`);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send();
}

function updateUrl() {
    let queryString = "";
    if (sort != "recent") {
        queryString += `?sort=${sort}`;
    }
    if (topic != "") {
        if (sort != "recent") {
            queryString += "&";
        } else {
            queryString += "?";
        }
        queryString += `topic=${topic}`;
    }
    if (page > 0) {
        if (sort != "recent" || topic != "") {
            queryString += "&";
        } else {
            queryString += "?";
        }
        queryString += `page=${page}`;
    }
    if (searchText != "") {
        queryString += `&search=${searchText}`;
    }
    addToHistory(queryString);
}

function getThreadsFromQueryString() {
    let sortParam = getQueryStringParam("sort");
    let pageParam = getQueryStringParam("page");
    let topicParam = decodeURI(getQueryStringParam("topic"));
    let searchParam = getQueryStringParam("search");
    if (sortParam !== null) {
        let sorts = ["recent", "trending", "mythreads", "deleted"];
        let id = sorts.indexOf(sortParam);
        let element = sortOptions[id];
        sort = sortParam;
        document.querySelector(".selected").classList.remove("selected");
        element.classList.add("selected");
    }
    if (pageParam !== null) {
        page = parseInt(pageParam);
    }
    if (topicParam !== null && topicParam != "null") {
        topicParam = topicParam.replaceAll("+", " ");
        document.querySelector("option").removeAttribute("selected");
        let newTopic = document.querySelector(`option[value='${topicParam}']`);
        if (newTopic != undefined) {
            newTopic.setAttribute("selected", "");
        }
        topic = topicParam;
    }
    if (searchParam != null) {
        searchText = searchParam;
        searchText = searchText.replaceAll("+", " ");
    }
    if (topic != "" || page != 0 || searchText != "" || sort != "recentThreads") {
      displayThreads();
    }
}

function sortBy() {
    document.querySelector(".selected").classList.remove("selected");
    this.classList.add("selected");
    sort = ["recent", "trending", "mythreads", "deleted"][this.id];
    updateUrl();
    if (topic != undefined && topic != "") {
        displayThreads();
    }
}

function displayThreads() {
    if (topic != "") {
        let request = new XMLHttpRequest();
        request.addEventListener("load", showThreads);
        request.open(
            "GET",
            `/getThreads?page=${page}&topic=${topic.replaceAll(
                " ",
                "+"
            )}&sort=${sort}&search=${searchText}`
        );
        request.send();
    }
}

function getQueryStringParam(param) {
    let queryString = location.search.substring(1);
    let parameters = queryString.split("&");
    for (let parameter of parameters) {
        let parameterParts = parameter.split("=");
        if (parameterParts[0] == param) {
            return parameterParts[1];
        }
    }
    return null;
}

function showPage(previousNext) {
    if (page + previousNext >= 0 && page + previousNext <= pageCount) {
        page += previousNext;
        updateUrl();
        displayThreads();
    }
}

function selectTopic() {
    topic = this.value;
    page = 0;
    updateUrl();
    if (topic != "") {
        displayThreads();
    } else {
        if (document.querySelector("#threadsHolder") != null)
            document.querySelector("#threadsHolder").remove();
        if (document.querySelector("#navigator") != null)
            document.querySelector("#navigator").remove();
    }
}

function addToHistory(queryString) {
    if (history.pushState) {
        queryString = queryString.replaceAll(" ", "+");
        let url = `${location.protocol}//${location.host}${location.pathname.substring(
            0,
            6
        )}${queryString}`;
        history.pushState(null, null, url);
    }
}

function showThreads() {
    let response = this.response;
    if (document.querySelector("#threadsHolder") != null) {
        document.querySelector("#threadsHolder").remove();
    }
    if (document.querySelector("#noThreadsMessage") != null) {
        document.querySelector("#noThreadsMessage").remove();
    }
    if (document.querySelector("#navigator") != null) {
        document.querySelector("#navigator").remove();
    }
    threadsDiv.insertAdjacentHTML("beforeend", response);
    if (document.querySelector("#noThreadsMessage") == null) {
        document.querySelectorAll(".thread a").forEach((thread) => {
            thread.addEventListener("click", viewThread);
        });
    }
    if (document.querySelector("#navigator") != null) {
        let navigator = document.querySelector("#navigator");
        let previousButton = navigator.querySelector("#previousButton");
        let nextButton = navigator.querySelector("#nextButton");
        let display = navigator.querySelector("#display");
        page = parseInt(navigator.dataset["page"]);
        pageCount = parseInt(navigator.dataset["pagecount"]) - 1;
        previousButton.addEventListener("click", () => {
            showPage(-1);
        });
        nextButton.addEventListener("click", () => {
            showPage(1);
        });
    }
}
