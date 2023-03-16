import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let userId;

// -------------------- helper --------------------
const swapPage = (currPage, newPage) => {
    document.getElementById(currPage).classList.add('hide');
    document.getElementById(newPage).classList.remove('hide');
}

const serviceCall = (path, data, method) => {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: method !== 'GET' ? JSON.stringify(data) : undefined,
    }
    if (localStorage.getItem('token')) {
        options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:${BACKEND_PORT}${path}`, options)
            .then(response => {
                if (response.ok) {
                    return response.json().then(resolve);
                } else if (response.status === 400 || response.status === 403) {
                    return response.json().then(reject);
                } else {
                    throw new Error(`${response.status} Error with API call`);
                }
            });
    });
}

const errPopup = (errMsg) => {
    const errDiv = document.getElementById('error-div');
    const newDiv = document.createElement('div');
    const container = document.createElement('span');
    const err = document.createTextNode(`ERROR: ${errMsg} `);
    container.style.color = "red";
    container.appendChild(err);
    const closeBtn = document.createElement('button');
    closeBtn.innerText = "close";
    closeBtn.addEventListener('click', () => {
        errDiv.removeChild(newDiv);
    });

    newDiv.appendChild(container);
    newDiv.appendChild(closeBtn);
    errDiv.appendChild(newDiv);
}

// TODO: need an error popup function to replace alert() 

// -------------------- login page --------------------

document.getElementById('login-button').addEventListener('click', () => {
    const email = document.getElementById('email-login');
    const password = document.getElementById('password-login');

    serviceCall('/auth/login', { email: email.value, password: password.value }, 'POST')
        .then(res => {
            localStorage.setItem('token', res.token);
            userId = res.userId;

            swapPage('logged-out', 'logged-in');
        })
        .catch(err => {
            errPopup(err.error);
        });
});

document.getElementById('to-register-page').addEventListener('click', () => {
    swapPage('login-page', 'register-page');
});

// -------------------- register page --------------------

document.getElementById('register-button').addEventListener('click', () => {
    const email = document.getElementById('email-register');
    const name = document.getElementById('name-register');
    const password = document.getElementById('password-register');
    const confirmPwd = document.getElementById('confirm-password');

    if (!email.value) {
        errPopup("email cannot be empty.");
        return;
    } else if (!name.value) {
        errPopup("Name cannot be empty.");
        return;
    } else if (!password.value) {
        errPopup("Password cannot be empty.");
        return;
    } else if (password.value !== confirmPwd.value) {
        errPopup("Passwords do not match.");
        return;
    }

    serviceCall('/auth/register', { email: email.value, password: password.value, name: name.value }, 'POST')
        .then(res => {
            localStorage.setItem('token', res.token);
            userId = res.userId;

            swapPage('logged-out', 'logged-in');
        })
        .catch(err => {
            errPopup(err.error);
        });
});

document.getElementById('to-login-page').addEventListener('click', () => {
    swapPage('register-page', 'login-page');
});

// -------------------- home page --------------------
if (localStorage.getItem('token')) {
    swapPage('logged-out', 'logged-in');
}

document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token');
    userId = 0;
    swapPage('logged-in', 'logged-out');
})

// -------------------- job --------------------


