import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';


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

const css = (element, styles) => {
    for (const property in styles) {
        element.style[property] = styles[property];
    }
}

const popup = (content) => {
    const newDiv = document.createElement('div');
    css(newDiv, {
        display: 'block',
        position: 'fixed',
        zIndex: '1',
        left: '0',
        top: '0',
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.4)',
    });

    const container = document.createElement('div');
    css(container, {
        backgroundColor: 'white',
        margin: '25% auto',
        padding: '20px',
        border: '1px solid grey',
        borderRadius: '10px',
        width: '70%'
    });

    content.style.marginBottom = '20px';
    container.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "close";
    css(closeBtn, {
        position: 'relative',
        left: '85%'
    });
    closeBtn.addEventListener('click', () => {
        newDiv.parentNode.removeChild(newDiv);
    });
    container.appendChild(closeBtn);

    newDiv.appendChild(container);

    return newDiv;
}

const errPopup = (errMsg) => {
    const errDiv = document.getElementById('error-div');

    const err = document.createElement('div');
    err.innerText = `ERROR: ${errMsg}`;

    errDiv.appendChild(popup(err));
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
            localStorage.setItem('userId', res.userId);

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
            localStorage.setItem('userId', res.userId);

            displayHomePage();
        })
});

document.getElementById('to-login-page').addEventListener('click', () => {
    swapPage('register-page', 'login-page');
});

// -------------------- home page --------------------

document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    // reset jobs div
    const jobsDiv = document.getElementById('jobs');
    while (jobsDiv.firstChild) {
        jobsDiv.removeChild(jobsDiv.lastChild);
    }

    swapPage('logged-in', 'logged-out');
})

// -------------------- job --------------------

let start = 0;

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

document.getElementById('load-jobs-btn').addEventListener('click', () => {
    feedJobs();
});

let shouldLoad = true;
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        const jobsDiv = document.getElementById('jobs');
        if (shouldLoad) {
            const loading = document.createElement('h2');
            loading.innerText = 'Loading...';
            jobsDiv.appendChild(loading);

            const prev = start;
            shouldLoad = false;
            setTimeout(() => {
                feedJobs();
                jobsDiv.removeChild(loading);
                shouldLoad = true;
            }, 500);
        }
    }
});

const feedJobs = () => {
    serviceCall(`/job/feed?start=${start}`, {}, 'GET')
        .then(jobs => {
            start += jobs.length;
            for (const job of jobs) {
                serviceCall(`/user?userId=${job.creatorId}`, {}, 'GET')
                    .then(creator => {
                        const jobDiv = document.createElement('div');
                        jobDiv.classList.add('job-container');

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

                        jobDiv.appendChild(likeJobBtn(job.id, job.likes));

                        const numLikes = document.createElement('span');
                        numLikes.innerText = ` ${job.likes.length} `;
                        jobDiv.appendChild(numLikes);

                        const likesDiv = document.createElement('div');
                        likesDiv.id = `likes-${job.id}`;
                        likesDiv.style.display = 'inline-block';
                        jobDiv.appendChild(likesDiv);
                        jobDiv.appendChild(showLikes(likesDiv.id, job.likes));

                        const comments = document.createElement('span');
                        comments.innerText = `${job.comments.length} comments`;
                        comments.style.position = 'absolute';
                        comments.style.right = '10px';
                        jobDiv.appendChild(comments);

                        document.getElementById('jobs').appendChild(jobDiv);
                    });
            }
        });
}

const likeJobBtn = (jobId, likes) => {
    const button = document.createElement('button');
    button.style.width = '50px';

    let isLiked = false;
    for (const likedUser of likes) {
        if (likedUser.userId == localStorage.getItem('userId')) {
            isLiked = true;
            break;
        }
    }
    if (isLiked) {
        button.innerText = 'unlike';
    } else {
        button.innerText = 'like';
    }

    button.addEventListener('click', () => {
        if (button.innerText === 'like') {
            serviceCall(`/job/like`, { id: jobId, turnon: true }, 'PUT')
            button.innerText = 'unlike';
        } else {
            serviceCall(`/job/like`, { id: jobId, turnon: false }, 'PUT')
            button.innerText = 'like';
        }
    });

    return button;
}

const showLikes = (id, likes) => {
    const likesSpan = document.createElement('span');
    likesSpan.innerText = `likes`;
    css(likesSpan, {
        color: 'blue',
        textDecoration: 'underline',
        cursor: 'pointer'
    });

    likesSpan.addEventListener('mouseover', () => {
        likesSpan.style.opacity = 0.5;
    });

    likesSpan.addEventListener('mouseout', () => {
        likesSpan.style.opacity = 1;
    });

    likesSpan.addEventListener('click', () => {
        const likesDiv = document.getElementById(id);

        const likesList = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = 'Liked users:';
        likesList.appendChild(title);
        for (const user of likes) {
            const userDiv = document.createElement('div');
            userDiv.innerText = user.userName;
            likesList.appendChild(userDiv);
        }

        likesDiv.appendChild(popup(likesList));
    });

    return likesSpan;
}

// -------------------- Main --------------------
// Must be at the bottom
if (localStorage.getItem('token')) {
    displayHomePage();
}
