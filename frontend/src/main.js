import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let token = '';
let userId;

// -------------------- helper --------------------
const swapPage = (currPage, newPage) => {
    document.getElementById(currPage).classList.add('hide');
    document.getElementById(newPage).classList.remove('hide');
}

export const serviceCall = (path, data, type) => {
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:${BACKEND_PORT}${path}`, {
            method: type,
            headers: {
                'Content-Type': 'application/json',
            },
            body: type !== 'GET' ? JSON.stringify(data) : undefined,
        })
            .then(response => {
                if (response.ok) {
                    return response.json().then(resolve);
                } else if (response.status === 400) {
                    return response.json().then(reject);
                } else {
                    throw new Error(`${response.status} Error with API call`);
                }
            });
    });
}

// TODO: need an error popup function to replace alert() 

// -------------------- login page --------------------

document.getElementById('login-button').addEventListener('click', () => {
    const email = document.getElementById('email-login').value;
    const password = document.getElementById('password-login').value;

    serviceCall('/auth/login', { email, password }, 'POST')
        .then(res => {
            token = res['token'];
            userId = res['userId'];
            swapPage('login-page', 'home-page');
        })
        .catch(err => {
            alert(err['error'])
        });
});

document.getElementById('to-register-page').addEventListener('click', () => {
    swapPage('login-page', 'register-page');
});

// -------------------- register page --------------------



// -------------------- home page --------------------

