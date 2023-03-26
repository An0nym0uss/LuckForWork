import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';


// -------------------- global variables --------------------

let start = 0;

// -------------------- helper --------------------

const swapPage = (currPage, newPage) => {
    document.getElementById(currPage).classList.add('hide');
    document.getElementById(newPage).classList.remove('hide');
}

const showPage = (newPage) => {
    swapPage('account-page', newPage);
    swapPage('profile-page', newPage);
    swapPage('logged-in', newPage);
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

const popup = (content) => {
    const popupPage = document.createElement('div');
    popupPage.classList.add('popup-page');

    const container = document.createElement('div');
    container.classList.add('popup-container');

    content.style.marginTop = '20px';
    container.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "close";
    closeBtn.classList.add('popup-close-btn');

    closeBtn.addEventListener('click', () => {
        popupPage.parentNode.removeChild(popupPage);
    });
    container.appendChild(closeBtn);

    popupPage.appendChild(container);

    return popupPage;
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
    localStorage.setItem('currPage', 'register-page');
    localStorage.setItem('prevPage', 'login-page');
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
    localStorage.setItem('currPage', 'login-page');
    localStorage.setItem('prevPage', 'register-page');
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
    start = 0;

    swapPage('logged-in', 'logged-out');
    localStorage.setItem('currPage', 'logged-out');
    localStorage.setItem('prevPage', 'logged-in');
})

document.getElementById('profile-button').addEventListener('click', () => {
    const myid = localStorage.getItem('userId');
    myProfile(myid);
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

document.getElementById('load-jobs-btn').addEventListener('click', () => {
    feedJobs();
});

let shouldLoad = true;
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        if (shouldLoad) {
            const loadMsg = document.getElementById('load-message');
            while (loadMsg.firstChild) {
                loadMsg.removeChild(loadMsg.lastChild);
            }
            const loading = document.createElement('h2');
            loading.innerText = 'Loading...';
            loadMsg.appendChild(loading);

            shouldLoad = false;
            setTimeout(() => {
                feedJobs();
                loadMsg.removeChild(loading);
                shouldLoad = true;
            }, 500);
        }
    }
});

const feedJobs = () => {

    serviceCall(`/job/feed?start=${start}`, {}, 'GET')
        .then(jobs => {
            if (jobs.length === 0) {
                const loadMsg = document.getElementById('load-message');
                const reachesEnd = document.createElement('h2');
                reachesEnd.innerText = 'You have reached the end.';
                loadMsg.appendChild(reachesEnd);
                window.scrollBy(0, -50);
            }
            start += jobs.length;
            localStorage.setItem('currPage', 'logged-in');
            for (const job of jobs) {
                console.log(job);
                serviceCall(`/user?userId=${job.creatorId}`, {}, 'GET')
                    .then(creator => {
                        document.getElementById('jobs').appendChild(jobBlock(job, creator.name));
                    });
            }
        });
}

// construct an individual job block
const jobBlock = (job, user) => {
    const jobDiv = document.createElement('div');
    jobDiv.classList.add('job-container');

    // Update post
    if (job.creatorId == localStorage.getItem('userId')) {

        const updateDiv= document.createElement('div');
        updateDiv.appendChild(updatePost(job));
        updateDiv.appendChild(deletePost(job));
        jobDiv.appendChild(updateDiv);
    }

    // image
    const img = document.createElement('img');
    img.src = job.image;
    img.alt = "job image";
    jobDiv.appendChild(img);

    // title of job
    const title = document.createElement('span');
    title.innerText = `${job.title}\n`;
    title.style.marginLeft = '10px';
    jobDiv.appendChild(title);

    // name of creator and time posted
    const creatorInfo = document.createElement('div');
    creatorInfo.style.color = 'grey';
    creatorInfo.innerText = `created by `;

    let createrName = document.createElement('span');
    createrName.style.color = 'grey';
    createrName.style.textDecoration = 'underline';
    createrName.innerText = `${user} `;
    createrName.id = `user-profile`;
    createrName.classList.add('link');
    accessProfile(createrName, job.creatorId);
    creatorInfo.appendChild(createrName);
    
    const creatorTime = document.createElement('span');
    creatorTime.style.color = 'grey';
    creatorTime.innerText = `${timeCreated(job.createdAt)}`;
    creatorInfo.appendChild(creatorTime);

    jobDiv.appendChild(creatorInfo);

    // time started
    const startTime = document.createElement('div');
    startTime.innerText = `started from ${timeToStr(job.start)}`;
    jobDiv.appendChild(startTime);

    // discription
    const description = document.createElement('div');
    description.innerText = job.description;
    jobDiv.appendChild(description);

    // likes
    jobDiv.appendChild(likeJobBtn(job.id, job.likes));

    const numLikes = document.createElement('span');
    numLikes.innerText = ` ${job.likes.length} `;
    
    const likesDiv = document.createElement('div');
    likesDiv.id = `likes-${job.id}`;
    likesDiv.style.display = 'inline-block';
    numLikes.appendChild(likesDiv);
    numLikes.appendChild(showLikes(likesDiv.id, job.likes));
    jobDiv.appendChild(numLikes);

    // comments
    const numComments = document.createElement('span');
    numComments.innerText = `${job.comments.length} `;
    
    const commentsDiv = document.createElement('div');
    commentsDiv.id = `comments-${job.id}`;
    commentsDiv.style.display = 'inline-block';
    numComments.appendChild(commentsDiv);
    numComments.appendChild(showComments(commentsDiv.id, job.comments, job.id));
    
    numComments.style.position = 'absolute';
    numComments.style.right = '10px';
    jobDiv.appendChild(numComments);

    return jobDiv;
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
    likesSpan.classList.add('openPopup');

    likesSpan.addEventListener('click', () => {
        const likesDiv = document.getElementById(id);

        const likesList = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = 'Liked users:';
        likesList.appendChild(title);
        for (const user of likes) {
            const userDiv = document.createElement('div');
            userDiv.innerText = user.userName;
            userDiv.classList.add('link');
            accessProfile(userDiv, user.userId);
            likesList.appendChild(userDiv);
        }

        likesDiv.appendChild(popup(likesList));
    });

    return likesSpan;
}

const showComments = (id, comments, jobId) => {
    const commentsSpan = document.createElement('span');
    commentsSpan.innerText = `comments`;
    commentsSpan.classList.add('openPopup');

    commentsSpan.addEventListener('click', () => {
        const commentsDiv = document.getElementById(id);

        const commentsList = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = 'Comments:';
        commentsList.appendChild(title);
        commentsList.classList.add("commentComments");
        for (const comment of comments) {
            serviceCall(`/user?userId=${comment.userId}`, {}, 'GET')
            .then(user => {
                const commentDiv = document.createElement('div');
                const commentName =  document.createElement('span')
                commentName.innerText = `${user.name}`;
                commentName.classList.add('link');
                accessProfile(commentName, user.id);
                const commentComment =  document.createElement('span')
                commentComment.innerText = `: ${comment.comment}`;
                commentDiv.appendChild(commentName);
                commentDiv.appendChild(commentComment);
                commentsList.appendChild(commentDiv);
            });
        }
        const newComment = document.createElement('textarea');
        newComment.id = "commentArea";
        newComment.classList.add('comment-box');
        commentsList.appendChild(newComment);

        const newCommentButton = document.createElement('button');
        newCommentButton.innerText = "Add comment"
        newCommentButton.classList.add("commentButton")
        commentsList.appendChild(newCommentButton);

        newCommentButton.addEventListener('click', () => {
            let data = {
                id: jobId,
                comment: document.getElementById('commentArea').value
            }
            serviceCall(`/job/comment`, data, 'POST');
            alert("Comment posted!")
        })

        commentsDiv.appendChild(popup(commentsList));
    });

    return commentsSpan;
}
// -------------------- user --------------------
// Check if the profile page the user attempting to access belong to themselves
const accessProfile = (element, id) => {
    element.addEventListener('click', () => {
        if (localStorage.getItem('userId') == id) {
            myProfile(id);
        } else {
            userProfile(id);
        }
    })
}

// Navigate to and construct a profile page of a user
const userProfile = (id) => {

    swapPage(localStorage.getItem('currPage'), 'profile-page');
    localStorage.setItem('prevPage', localStorage.getItem('currPage'));
    localStorage.setItem('currPage', 'profile-page');
    const emptydiv = document.getElementById('userInfo');
    while (emptydiv.firstChild) {
        emptydiv.removeChild(emptydiv.lastChild);
    }

    serviceCall(`/user?userId=${id}`, {}, 'GET').then(user => {
        const userDiv = document.createElement('div');
        userDiv.classList.add('infoBox');

        const profileTitle = document.createElement('h1');
        profileTitle.innerText = `${user.name}'s profile`
        userDiv.appendChild(profileTitle);

        const backButton = document.createElement('button');
        backButton.innerText = "Go back";
        userDiv.appendChild(backButton);
        backButton.addEventListener('click', () => {
            swapPage('profile-page', 'logged-in');
            localStorage.setItem('prevPage', 'profile-page');
            localStorage.setItem('currPage', 'logged-in');
        })

        let data;
        const mail = user.email;
        const watchButton = document.createElement('button');
        
        let toggle = false;
        for (let i=0; i<user.watcheeUserIds.length; i++) {
            if (user.watcheeUserIds[i] == localStorage.getItem('userId')) {
                toggle = true;
            }
        }
        if (toggle) {
            watchButton.innerText = "Unwatch";
            data = {email: mail, turnon: false};
        } else {
            watchButton.innerText = "Watch";
            data = {email: mail, turnon: true};
        }
        watchButton.addEventListener('click', ()=> {
            console.log(data);
            serviceCall(`/user/watch`, data, 'PUT');
        })
        userDiv.appendChild(watchButton);

        const profilePicture = document.createElement('img');
        profilePicture.src = user.image;
        profilePicture.src = "profile image";
        profilePicture.classList.add('profile-picture');
        userDiv.appendChild(profilePicture);

        const basicInfoDiv = document.createElement('div');
        basicInfoDiv.classList.add("basicInfoBox");
            const userName = document.createElement('div');
            userName.innerText = `Name: ${user.name}`;
            const userEmail = document.createElement('div');
            userEmail.innerText = `Email: ${user.email}`;
            basicInfoDiv.appendChild(userName);
            basicInfoDiv.appendChild(userEmail);
            basicInfoDiv.appendChild(document.createElement('br'));

            const text1 = document.createElement('div');
            text1.innerText = `${user.name}'s job post:`;
            basicInfoDiv.appendChild(text1);

        userDiv.appendChild(basicInfoDiv);

        for (const job of user.jobs) {
            userDiv.appendChild(jobBlock(job, user.name));
        }

        const text2 = document.createElement('div');
        text2.innerText = `${user.name} is watched by:`;
        text2.style.marginTop = '20px';
        userDiv.appendChild(text2);
        for (const watchee of user.watcheeUserIds) {
            serviceCall(`/user?userId=${watchee}`, {}, 'GET')
                .then(watchee => {
                    const watcheeName = document.createElement('div');
                    watcheeName.innerText = `${watchee.name}`;
                    watcheeName.classList.add("link")
                    accessProfile(watcheeName, watchee.id);
                    userDiv.appendChild(watcheeName);
                });
        }
        document.getElementById('userInfo').appendChild(userDiv);
    })
}

// Navigate to and construct a profile page where the profile page belong to the current user so a special profile page will be constructed
const myProfile = (id) => {
    
    swapPage(localStorage.getItem('currPage'), 'profile-page');
    localStorage.setItem('prevPage', localStorage.getItem('currPage'));
    localStorage.setItem('currPage', 'profile-page');
    const emptydiv = document.getElementById('userInfo');
    while (emptydiv.firstChild) {
        emptydiv.removeChild(emptydiv.lastChild);
    }
    

    serviceCall(`/user?userId=${id}`, {}, 'GET').then(user => {
        const userDiv = document.createElement('div');
        userDiv.classList.add('infoBox');

        const profileTitle = document.createElement('h1');
        profileTitle.innerText = `My profile`
        userDiv.appendChild(profileTitle);

        const backButton = document.createElement('button');
        backButton.innerText = "Home page";
        userDiv.appendChild(backButton);
        backButton.addEventListener('click', () => {
            swapPage('profile-page', 'logged-in');
            localStorage.setItem('prevPage', 'profile-page');
            localStorage.setItem('currPage', 'logged-in');
        })

        const modifyProfile = document.createElement('button');
        modifyProfile.innerText = "Update my information";
        modifyProfile.style.marginTop = '-1rem';
        modifyProfile.addEventListener('click', () => {
            changeInfo(user);
        })
        userDiv.appendChild(modifyProfile);


        const profilePicture = document.createElement('img');
        profilePicture.src = user.image;
        profilePicture.src = "profile image";
        profilePicture.classList.add('profile-picture');
        userDiv.appendChild(profilePicture);

        const basicInfoDiv = document.createElement('div');
        basicInfoDiv.classList.add("basicInfoBox");
            const userName = document.createElement('div');
            userName.innerText = `Name: ${user.name}`;
            const userEmail = document.createElement('div');
            userEmail.innerText = `Email: ${user.email}`;
            basicInfoDiv.appendChild(userName);
            basicInfoDiv.appendChild(userEmail);
            basicInfoDiv.appendChild(document.createElement('br'));

            const text1 = document.createElement('div');
            text1.innerText = `${user.name}'s job post:`;
            basicInfoDiv.appendChild(text1);

        userDiv.appendChild(basicInfoDiv);

        for (const job of user.jobs) {
            userDiv.appendChild(jobBlock(job, user.name));
        }

        const text2 = document.createElement('div');
        text2.innerText = `${user.name} is watched by:`;
        text2.style.marginTop = '20px';
        userDiv.appendChild(text2);
        for (const watchee of user.watcheeUserIds) {
            serviceCall(`/user?userId=${watchee}`, {}, 'GET')
                .then(watchee => {
                    const watcheeName = document.createElement('div');
                    watcheeName.innerText = `${watchee.name}`;
                    watcheeName.classList.add("link")
                    accessProfile(watcheeName, watchee.id);
                    userDiv.appendChild(watcheeName);
                });
        }
        document.getElementById('userInfo').appendChild(userDiv);
    })
}

// Navigate to the change personal info page where user can change their information
const changeInfo = (user) => {
    swapPage('profile-page', 'account-page');
    localStorage.setItem('currPage', 'account-page');
    localStorage.setItem('prevPage', 'profile-page');


    document.getElementById('newName').value=`${user.name}`;
    document.getElementById('newEmail').value=`${user.email}`;

    const img = document.createElement('img');
    img.src = user.image;
    document.getElementById('profileSpace').appendChild(img);

    // Change personal info page confirm update name or email button
    document.getElementById('password-forward').addEventListener('click', () => {
        let dataPass = {
            email:document.getElementById('newPass').value,
        }
        serviceCall(`/user`, dataPass, 'PUT'). then(res => {
            alert("Password updated successfully!")
        });
    })

    // Change personal info page confirm update password button
    document.getElementById('account-forward').addEventListener('click', () => {
        let dataBasic = {
            email:document.getElementById('newEmail').value,
            name:document.getElementById('newName').value
        }
        serviceCall(`/user`, dataBasic, 'PUT'). then(res => {
            alert("Info updated successfully!")
        });
    })
    
    // Change personal info page confirm update profile button
    document.getElementById('profile-forward').addEventListener('click', () => {
        let dataProfile = {
            image:document.getElementById('newProfile').value,
        }
        serviceCall(`/user`, dataProfile, 'PUT'). then(res => {
            alert("Profile changed successfully!")
        });
    })

    // Change personal info page go back button
    document.getElementById('account-back').addEventListener('click', () => {
        swapPage('account-page', 'profile-page');
        localStorage.setItem('currPage', 'account-page');
        localStorage.setItem('prevPage', 'profile-page');

    })
}
// -------------------- Adding content--------------------
// Home page create a new job button
document.getElementById('add-jobs-btn').addEventListener('click', () => {
    swapPage('logged-in', 'new-post-page');
    localStorage.setItem('currPage', 'new-post-page');
    localStorage.setItem('prevPage', 'logged-in');

    // New post page submit button
    document.getElementById('post-submit-btm').addEventListener('click', () => {
    let data = {
        title:document.getElementById('title').value,
        image:document.getElementById('image').value,
        start:document.getElementById('date').value,
        description:document.getElementById('description').value
    }
    serviceCall(`/job`, data, 'POST');
    alert("Job post added successfully");
})
})

// New post page Cancel button
document.getElementById('post-back-btm').addEventListener('click', () => {
    console.log('here?');
    swapPage(localStorage.getItem('currPage'), localStorage.getItem('prevPage'));
    let curr = localStorage.getItem('prevPage')
    localStorage.setItem('prevPage', localStorage.getItem('currPage'));
    localStorage.setItem('currPage', curr);
})

const updatePost = (job) => {

    const button = document.createElement('button');
    button.classList.add("update-button");
    button.innerText = "Update";

    // Job block update button
    button.addEventListener('click', () => {
        swapPage(localStorage.getItem('currPage'), "new-post-page");
        localStorage.setItem('prevPage', localStorage.getItem('currPage'));
        localStorage.setItem('currPage', 'new-post-page');

        document.getElementById('title').value = job.title;
        document.getElementById('date').value = job.start;
        document.getElementById('description').value = job.description;
        document.getElementById('post-submit-btm').textContent = 'update';

        // Update post page update button
        document.getElementById('post-submit-btm').addEventListener('click', () => {
            let data = {
                id: job.id,
                title:document.getElementById('title').value,
                image:document.getElementById('image').value,
                start:document.getElementById('date').value,
                description:document.getElementById('description').value
            }
            serviceCall(`/job`, data, 'PUT');
            alert("Job post updated successfully");
        })
    })
    return button;
}

const deletePost = (job) => {
    const button = document.createElement('button');
    button.innerText = "Delete";
    // Job block delete button
    button.addEventListener('click', () => {
        serviceCall(`/job`, {id: job.id} , 'DELETE');
        alert("Job post deleted successfully");
    })
    return button;
}

// -------------------- Main --------------------
// Must be at the bottom
if (localStorage.getItem('token')) {
    displayHomePage();
}
localStorage.setItem('token', res.token);
