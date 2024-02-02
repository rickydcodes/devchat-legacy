let likeButtons;
let dislikeButtons;
let replyButtons;
let deleteButtons;
let cancelButtons;
let saveButtons;
let editButtons;

let mainContent = document.querySelector("#mainContent");
let main;
let replyDiv;
let replyInput;
let replyToText;
let submitReplyBtn;

let parameterString = "/threads/";
let threadId = location.href.substring(location.href.indexOf("/threads/") + parameterString.length);

if (window.location.hash != "") {
    threadId = threadId.slice(0, threadId.length - window.location.hash.length);
}

window.addEventListener("hashchange", hashHandler, false);

init();
hashHandler();

function init() {
    likeButtons = document.querySelectorAll(".likeButton");
    dislikeButtons = document.querySelectorAll(".dislikeButton");
    replyButtons = document.querySelectorAll(".replyButton");
    deleteButtons = document.querySelectorAll(".deleteButton");
    cancelButtons = document.querySelectorAll(".cancelButton");
    saveButtons = document.querySelectorAll(".saveButton");
    editButtons = document.querySelectorAll(".editButton");
    main = document.querySelector("#main");
    replyDiv = document.querySelector("#replyDiv");
    replyInput = document.querySelector("#replyBodyInput");
    replyToText = document.querySelector("#replyToText");
    submitReplyBtn = document.querySelector("#submitReplyBtn");
    likeButtons.forEach((btn) => btn.addEventListener("click", like));
    dislikeButtons.forEach((btn) => btn.addEventListener("click", dislike));
    replyButtons.forEach((btn) => btn.addEventListener("click", reply));
    deleteButtons.forEach((btn) => btn.addEventListener("click", deleteReply));
    cancelButtons.forEach((btn) => btn.addEventListener("click", cancelEdit));
    saveButtons.forEach((btn) => btn.addEventListener("click", saveEdit));
    editButtons.forEach((btn) => btn.addEventListener("click", openEdit));
    document.querySelectorAll(".postBody").forEach((item) => {
        item.innerHTML = marked.parse(item.innerHTML);
    });
    document.querySelector("#backButton").addEventListener("click", function () {
        replyDiv.style.display = "none";
    });

    submitReplyBtn.addEventListener("click", submitReply);
}

function openEdit() {
    let postTextHolder =
        this.parentElement.parentElement.parentElement.parentElement.querySelector(
            ".postTextHolder"
        );
    postTextHolder.querySelector(".postBody").style.display = "none";
    postTextHolder.querySelector(".editingDiv").style.display = "inline";
}

function cancelEdit() {
    let postTextHolder = this.parentElement.parentElement.parentElement.parentElement;
    postTextHolder.querySelector(".postBody").style.display = "block";
    postTextHolder.querySelector(".editingDiv").style.display = "none";
}

function saveEdit() {
    let message = this.parentElement.parentElement.parentElement.parentElement;
    let messageid = message.dataset.messageid;
    let request = new XMLHttpRequest();
    request.open("PUT", `/editReply?threadId=${threadId}&messageId=${messageid}`);
    request.addEventListener("load", function () {
        replyResponse.bind(this, parseInt(messageid))();
    });
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send(`body=${message.querySelector(".editBox").value}`);
}

function hashHandler() {
    let messageid = location.hash.substring(1);
    let message = main.querySelector(`div[data-messageid="${messageid}"]`);
    if (message != null) {
        message.scrollIntoView(true);
        message.style.animationDuration = "2s";
        message.style.animationIterationCount = "1";
        message.style.animationName = "highlightElement";
        setTimeout(() => {
            message.style.animation = "";
        }, 2000);
    }
}

function like() {
    let messageId = this.parentElement.dataset.messageid;
    let btn = this;
    let likes = this.parentElement.querySelector(".likes");
    let dislikes = this.parentElement.querySelector(".dislikes");

    let request = new XMLHttpRequest();
    request.open("PATCH", `/like?threadId=${threadId}&messageId=${messageId}`);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.addEventListener("load", function () {
        likeDislikeResponse.bind(this, likes, dislikes, btn)();
    });
    request.send();
}

function dislike() {
    let messageId = this.parentElement.dataset.messageid;
    let btn = this;
    let likes = this.parentElement.querySelector(".likes");
    let dislikes = this.parentElement.querySelector(".dislikes");

    let request = new XMLHttpRequest();
    request.open("PATCH", `/dislike?threadId=${threadId}&messageId=${messageId}`);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.addEventListener("load", function () {
        likeDislikeResponse.bind(this, likes, dislikes, btn)();
    });
    request.send();
}

function likeDislikeResponse(likes, dislikes, btn) {
    if (this.status == 200) {
        let response = JSON.parse(this.response);
        likes.innerHTML = response.likes;
        dislikes.innerHTML = response.dislikes;
        select.bind(btn)();
    } else {
        alert(this.response);
    }
}

function reply() {
    replyDiv.style.display = "inline-block";

    let messageId = this.parentElement.parentElement.dataset.messageid;
    let username =
        this.parentElement.parentElement.parentElement.querySelector(".usernameTitle a").innerText;

    replyToText.innerHTML = `Replying to <a href="#${messageId}">${username}</a>`;
    replyDiv.dataset.replyTo = messageId;
}

function deleteReply() {
    let messageId = this.parentElement.parentElement.dataset.messageid;

    if (messageId > 0) {
        let request = new XMLHttpRequest();
        request.open("DELETE", `/deleteReply?threadId=${threadId}&replyId=${messageId}`);
        request.addEventListener("load", deleteReplyResponse);
        request.send();
    }
}

function deleteReplyResponse() {
    let response = this.response;
    if (this.status == 200) {
        mainContent.innerHTML = response;
        init();
        alert("Deleted successfully");
    } else {
        alert(response);
    }
}

function select() {
    let selectedElement = this.parentElement.querySelector(".selected");
    if (selectedElement == this || selectedElement == undefined) {
        this.classList.toggle("selected");
    } else {
        selectedElement.classList.remove("selected");
        this.classList.add("selected");
    }
}

function submitReply() {
    if (replyInput.value != "" && replyDiv.dataset.replyTo != undefined) {
        let messageid = replyDiv.dataset.replyTo;
        let request = new XMLHttpRequest();
        request.open("POST", `/reply?threadId=${threadId}&replyTo=${messageid}`);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.addEventListener("load", function () {
            replyResponse.bind(this, parseInt(messageid))();
        });
        request.send(`replyBody=${replyInput.value}`);
    }
}

function replyResponse(messageid) {
    let response = this.response;
    if (this.status == 200) {
        mainContent.innerHTML = response;
        location.hash = `#${messageid}`;
        init();
    } else {
        alert(response);
    }
}
