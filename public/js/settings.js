let oldPasswordInput = document.querySelector("#oldPasswordInput");
let newPasswordInput = document.querySelector("#newPasswordInput");
let confirmPasswordInput = document.querySelector("#confirmPasswordInput");
let changePasswordBtn = document.querySelector("#changePasswordBtn");

document.querySelector("#showRecentActivity").addEventListener("input", recentActivityPreference);
document
    .querySelector("#disableNotifFromFollowing")
    .addEventListener("input", disableNotifFromFollowing);
document.querySelector("#notifyMyFollowers").addEventListener("input", notifyMyFollowers);
document
    .querySelector("#onlyFriendRequestsFromFollowers")
    .addEventListener("input", onlyFriendRequestsFromFollowers);

function recentActivityPreference() {
    let request = new XMLHttpRequest();
    request.open("PUT", `/settings/showRecentActivity?show=${this.checked}`);
    request.send();
}

function disableNotifFromFollowing() {
    let request = new XMLHttpRequest();
    request.open("PUT", `/settings/disableNotifFromFollowing?show=${this.checked}`);
    request.send();
}

function notifyMyFollowers() {
    let request = new XMLHttpRequest();
    request.open("PUT", `/settings/notifyMyFollowers?show=${this.checked}`);
    request.send();
}

function onlyFriendRequestsFromFollowers() {
    let request = new XMLHttpRequest();
    request.open("PUT", `/settings/onlyFriendRequestsFromFollowers?show=${this.checked}`);
    request.send();
}

changePasswordBtn.addEventListener("click", function () {
    let oldpass = oldPasswordInput.value;
    let newpass = newPasswordInput.value;
    let confpass = confirmPasswordInput.value;

    showErrors();

    if (oldpass != "" && newpass != "" && confpass != "" && newpass == confpass) {
        let request = new XMLHttpRequest();
        request.open(
            "PUT",
            `/changePassword?password=${oldpass}&newPassword=${newpass}&confirmedPassword=${confpass}`
        );
        request.addEventListener("load", function () {
            alert(this.response);
        });
        request.send();
    }
});

function showErrors() {
    let oldpass = oldPasswordInput.value;
    let newpass = newPasswordInput.value;
    let confpass = confirmPasswordInput.value;
    if (oldpass == "") {
        oldPasswordInput.style.animation = "0.2s elementError";
    }
    if (newpass == "") {
        newPasswordInput.style.animation = "0.2s elementError";
    }
    if (confpass == "") {
        confirmPasswordInput.style.animation = "0.2s elementError";
    }
    if (newpass != "" && confpass != "" && confpass != newpass) {
        newPasswordInput.style.animation = "0.2s elementError";
        confirmPasswordInput.style.animation = "0.2s elementError";
    }
    setTimeout(() => {
        oldPasswordInput.style.animation = "";
        newPasswordInput.style.animation = "";
        confirmPasswordInput.style.animation = "";
    }, 200);
}
