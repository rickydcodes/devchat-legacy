let editButton = document.querySelector("#editButton");
let editDiv = document.querySelector("#editDiv");
let editInput = document.querySelector("#editInput");
let cancelButton = document.querySelector("#cancelButton");
let saveButton = document.querySelector("#saveButton");
let statusParagraph = document.querySelector("#statusParagraph");
let followButton = document.querySelector("#followButton");
let makeAdminButton = document.querySelector("#makeAdminButton");

if (makeAdminButton) {
    function setAdminResponse() {
        if (this.status == 200) {
            makeAdminButton.innerHTML = this.response;
        } else {
            alert(this.response);
        }
    }
    makeAdminButton.addEventListener("click", () => {
        let text = location.pathname.split("/");
        let request = new XMLHttpRequest();
        request.open("PUT", `/admin/setAdmin?userId=${text[text.length-1]}`);
        request.addEventListener("load", setAdminResponse);
        request.send();
    });
}
document.querySelectorAll("td a").forEach((item) => item.addEventListener("click", viewThread));
if (followButton != undefined) {
    followButton.addEventListener("click", follow);
}

function follow() {
    let profileId = parseInt(document.querySelector("#main").dataset.profileid);
    let request = new XMLHttpRequest();
    request.open("PATCH", `/follow?id=${profileId}`);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.addEventListener("load", followResponse);
    request.send();
}

function followResponse() {
    let response = this.response;
    if (response == "OK") {
        if (followButton.innerText == "Follow") {
            console.log("Test");
            followButton.innerText = "Unfollow";
            let followers = document.querySelector("#followers a");
            followers.innerText = parseInt(followers.innerText) + 1;
        } else {
            followButton.innerText = "Follow";
            let followers = document.querySelector("#followers a");
            if (parseInt(followers.innerText) > 0) {
                followers.innerText = parseInt(followers.innerText) - 1;
            }
        }
    } else {
        alert(response);
    }
}

function viewThread() {
    let threadId = this.parentElement.parentElement.dataset.topicid;
    let request = new XMLHttpRequest();
    request.open("PATCH", `/viewThread?id=${threadId}`);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send();
}

if (editButton != undefined) {
    editButton.addEventListener("click", () => {
        statusParagraph.style.display = "none";
        editDiv.style.display = "block";
    });

    cancelButton.addEventListener("click", () => {
        editDiv.style.display = "none";
        statusParagraph.style.display = "block";
    });

    saveButton.addEventListener("click", () => {
        let status = editInput.value;
        let request = new XMLHttpRequest();
        request.addEventListener("load", changeStatusResponse);
        request.open("PUT", "/changeStatus");
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(`status=${status}`);
        searchUsersInput.value = "";
    });

    function changeStatusResponse() {
        let response = this.response;
        if (response == "OK") {
            statusParagraph.innerText = editInput.value;
            statusParagraph.style.display = "block";
            editDiv.style.display = "none";
        } else {
            alert(response);
        }
    }
}
