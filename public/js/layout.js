let signOutButton = document.querySelector("#signOutButton");
let searchUsersInput = document.querySelector("#searchUsersInput");
let searchUsersButton = document.querySelector("#searchUsersButton");
let active = true;

searchUsersInput.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
        searchUser();
    }
});
searchUsersButton.addEventListener("click", searchUser);
signOutButton.addEventListener("click", signOut);
sendActivityRequest();

document.addEventListener("scroll", () => (active = true));
document.addEventListener("mouseover", () => (active = true));
setInterval(sendActivityRequest, 5 * 60 * 1000);

function sendActivityRequest() {
    if (active) {
        let request = new XMLHttpRequest();
        request.open("PUT", "/setOnline");
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send();
        active = false;
    }
}

function searchUser() {
    let username = searchUsersInput.value;
    let request = new XMLHttpRequest();
    request.addEventListener("load", searchResponse);
    request.open("GET", `/search?username=${username}`);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send();
    searchUsersInput.value = "";
}

function searchResponse() {
    let response = this.response;
    if (this.status == 200) {
        window.location = `/users/${response}`;
    } else {
        alert(response);
    }
}

function signOut() {
    let request = new XMLHttpRequest();
    request.addEventListener("load", signOutResponse);
    request.open("POST", "/signout");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send();
}

function signOutResponse() {
    let response = this.response;
    if (response == "Cannot sign out because you are not logged in.") {
        alert(response);
    } else if (response == "OK") {
        window.location = `/`;
    }
}
