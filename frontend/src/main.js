import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let userId;

// -------------------- helper --------------------
const swapPage = (currPage, newPage) => {
    document.getElementById(currPage).classList.add('hide');
    document.getElementById(newPage).classList.remove('hide');
}

const displayHomePage = () => {
    swapPage('logged-out', 'logged-in');
    feedJobs();
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
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    errPopup(data.error);
                } else {
                    resolve(data);
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

// -------------------- login page --------------------

document.getElementById('login-button').addEventListener('click', () => {
    let data = {
        email: document.getElementById('email-login').value,
        password: document.getElementById('password-login').value
    }

    serviceCall('/auth/login', data, 'POST')
        .then(res => {
            localStorage.setItem('token', res.token);
            userId = res.userId;

            displayHomePage();
        })
});

document.getElementById('to-register-page').addEventListener('click', () => {
    swapPage('login-page', 'register-page');
});

// -------------------- register page --------------------

document.getElementById('register-button').addEventListener('click', () => {
    let data = {
        email: document.getElementById('email-register').value,
        password: document.getElementById('password-register').value,
        name: document.getElementById('name-register').value
    }

    if (!data.email) {
        errPopup("email cannot be empty.");
        return;
    } else if (!data.name) {
        errPopup("Name cannot be empty.");
        return;
    } else if (!data.password) {
        errPopup("Password cannot be empty.");
        return;
    } else if (data.password !== document.getElementById('confirm-password').value) {
        errPopup("Passwords do not match.");
        return;
    } else if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(data.email)) {
        errPopup("Email format is not valid.");
        return;
    }

    serviceCall('/auth/register', data, 'POST')
        .then(res => {
            localStorage.setItem('token', res.token);
            userId = res.userId;

            displayHomePage();
        })
});

document.getElementById('to-login-page').addEventListener('click', () => {
    swapPage('register-page', 'login-page');
});

// -------------------- home page --------------------

document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token');
    userId = 0;
    // reset jobs div
    const jobsDiv = document.getElementById('jobs');
    while (jobsDiv.firstChild) {
        jobsDiv.removeChild(jobsDiv.lastChild);
    }

    swapPage('logged-in', 'logged-out');
})

// -------------------- job --------------------

const timeToStr = (datetime) => {
    const time = new Date(datetime);
    return `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear()}`;
}

const timeCreated = (datetime) => {
    const time = new Date(datetime);
    const diffMinutes = (Date.now - time) / 1000 / 60;
    if (diffMinutes <= 60 * 24) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = Math.floor(diff - hours * 60);
        return `${hours} hours and ${minutes} minutes ago`;
    } else {
        return timeToStr(datetime);
    }
}

const feedJobs = () => {
    serviceCall('/job/feed?start=0', {}, 'GET')
        .then(jobs => {
            for (const job of jobs) {
                serviceCall(`/user?userId=${job.creatorId}`, {}, 'GET')
                    .then(creator => {

                        const jobDiv = document.createElement('div');
                        jobDiv.style.width = '300px';
                        jobDiv.style.border = '1px solid blue';
                        jobDiv.style.margin = '20px';
                        jobDiv.style.padding = '10px';

                        const img = document.createElement('img');
                        img.src = job.image;
                        jobDiv.appendChild(img);

                        const title = document.createElement('span');
                        title.innerText = `${job.title}\n`;
                        title.style.marginLeft = '10px';
                        jobDiv.appendChild(title);


                        const creatorInfo = document.createElement('div');
                        creatorInfo.style.color = 'grey';
                        creatorInfo.innerText = `created by ${creator.name} ${timeCreated(job.createdAt)}`;
                        jobDiv.appendChild(creatorInfo);

                        const startTime = document.createElement('div');
                        startTime.innerText = `started from ${timeToStr(job.start)}`;
                        jobDiv.appendChild(startTime);

                        const description = document.createElement('div');
                        description.innerText = job.description;
                        jobDiv.appendChild(description);

                        const likes = document.createElement('span');
                        likes.innerText = `${job.likes.length} likes`;
                        jobDiv.appendChild(likes);

                        const comments = document.createElement('span');
                        comments.innerText = `${job.comments.length} comments`;
                        comments.style.marginLeft = '100px';
                        jobDiv.appendChild(comments);

                        document.getElementById('jobs').appendChild(jobDiv);
                    });
            }
        });
}

// -------------------- Main --------------------
// Must be at the bottom
if (localStorage.getItem('token')) {
    displayHomePage();
}
