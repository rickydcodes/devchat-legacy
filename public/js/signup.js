let usernameInput = document.querySelector("#usernameInput");
let passwordInput = document.querySelector("#passwordInput");
let signupButton = document.querySelector("#signupButton");

usernameInput.focus();
signupButton.addEventListener("click", signup);
usernameInput.addEventListener("keydown", keydown);
passwordInput.addEventListener("keydown", keydown);

function keydown(e) {
    if (e.keyCode == 13) {
        signup();
    }
}

async function signup() {
    let username = usernameInput.value;
    let password = passwordInput.value;
    if (username != "" && password != "") {
        if (password.length > 6 || password.length < 20) {
            if (username.match("^[a-zA-Z0-9_]*$") != null) {
                try {
                    let request = new XMLHttpRequest();
                    request.open("POST", "/signup");
                    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    request.addEventListener("load", function () {
                        let response = this.response;
                        passwordInput.value = "";
                        if (response == "OK") {
                            window.location.href = "/home";
                        } else {
                            alert(response);
                        }
                    });
                    request.send(`username=${username}&password=${password}`);
                } catch (err) {
                    console.log(err);
                }
            } else {
                alert("Username must be alphanumeric.");
            }
        } else {
            alert("Password cannot be less than 6 characters or more than 12");
        }
    } else {
        alert("Username and Password fields cannot be blank.");
    }
}
