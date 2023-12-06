// Setup materialize components
document.addEventListener("DOMContentLoaded", function () {
  // Modals
  var modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  // Side Navigation
  const sideNav = document.querySelectorAll(".sidenav");
  M.Sidenav.init(sideNav, { edge: "left" });

  // Collapsible items
  var items = document.querySelectorAll(".collapsible");
  M.Collapsible.init(items);

  // IndexedDB Setup
  const dbPromise = idb.openDB("TaskManagerDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tasks")) {
        const tasksStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        tasksStore.createIndex("title", "title", { unique: false });
        tasksStore.createIndex("description", "description", { unique: false });
      }
    },
  });

  // Left Side Nav
  const leftSideNavs = document.querySelectorAll(".sidenav");
  M.Sidenav.init(leftSideNavs, { edge: "left" });

  // Right Side Nav
  const rightSideNavs = document.querySelectorAll(".side-menu");
  M.Sidenav.init(rightSideNavs, { edge: "right" });

  // Authentication and UI elements
  const tasks = document.querySelector(".tasks");
  const loggedOutLinks = document.querySelectorAll(".logged-out");
  const loggedInLinks = document.querySelectorAll(".logged-in");
  const signupForm = document.querySelector("#signup-form");
  const loginForm = document.querySelector("#login-form");
  const logout = document.querySelector("#logout");

  // Sign Up
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = signupForm["signup-email"].value;
    const password = signupForm["signup-password"].value;

    auth.createUserWithEmailAndPassword(email, password).then((cred) => {
      console.log("User signed up:", cred.user);
      signupForm.reset();
    });
  });

  // Sign In
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm["login-email"].value;
    const password = loginForm["login-password"].value;

    auth.signInWithEmailAndPassword(email, password).then((cred) => {
      console.log("User logged in:", cred.user);
      loginForm.reset();
    });
  });

  // Sign Out
  logout.addEventListener("click", (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
      console.log("User signed out");
    });
  });

  // Auth state change listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user);
      setupUI(user);
      fetchTasksFromIndexedDB(); // Fetch tasks when the user is signed in
    } else {
      // User is signed out
      console.log("User is signed out");
      setupUI();
    }
  });

  // Nav Menu and Side Forms
  const menus = document.querySelectorAll(".side-menu");
  M.Sidenav.init(menus, { edge: "right" });

  const forms = document.querySelectorAll(".side-form");
  M.Sidenav.init(forms, { edge: "left" });
});

// IndexedDB functions
const fetchTasksFromIndexedDB = async () => {
  const db = await dbPromise;
  const tx = db.transaction("tasks", "readonly");
  const store = tx.objectStore("tasks");

  const tasks = await store.getAll();
  setupTasks(tasks);
};

const saveTaskToIndexedDB = async (task) => {
  const db = await dbPromise;
  const tx = db.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");

  store.add(task);
};

// UI setup function
const setupUI = (user) => {
  if (user) {
    // Toggle UI elements for signed-in user
    loggedInLinks.forEach((item) => (item.style.display = "block"));
    loggedOutLinks.forEach((item) => (item.style.display = "none"));
  } else {
    // Toggle UI elements for signed-out user
    loggedInLinks.forEach((item) => (item.style.display = "none"));
    loggedOutLinks.forEach((item) => (item.style.display = "block"));
  }
};

// Populate data
const setupTasks = (data) => {
  let html = "";
  data.forEach((doc) => {
    const task = doc.data();
    const li = `
    <div class="card-panel task white row" data-id="${task.id}">
      <img src="/img/task.png" class="responsive-img materialboxed" alt="">
      <div class="task-detail">
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.description}</div>
      </div>
      <div class="task-delete">
        <i class="material-icons" data-id="${task.id}">delete_outline</i>
      </div>
    </div>`;
    html += li;
  });

  tasks.innerHTML = html;
};

const renderTask = (data, id) => {
  const html = `
    <div class="card-panel task white row" data-id="${id}">
      <img src="/img/task.png" class="responsive-img materialboxed" alt="">
      <div class="task-detail">
        <div class="task-title">${data.title}</div>
        <div class="task-description">${data.description}</div>
      </div>
      <div class="task-delete">
        <i class="material-icons" data-id="${id}">delete_outline</i>
      </div>
    </div>`;

  tasks.innerHTML += html;
};

// Remove task from DOM
const removeTask = (id) => {
  const task = document.querySelector(`.task[data-id="${id}"]`);
  task.remove();
};
// Check for support of the Notifications API
if ('Notification' in window) {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      // User has granted permission
      subscribeToNotifications();
    }
  });
}

function subscribeToNotifications() {
  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_PUBLIC_KEY_FROM_FIREBASE',
      });
    })
    .then((subscription) => {
      // Send the subscription information to your server
      sendSubscriptionToServer(subscription);
    })
    .catch((error) => {
      console.error('Error during subscription:', error);
    });
}

function sendSubscriptionToServer(subscription) {
  // Send the subscription details (endpoint, keys) to your server
  // Your server should store these details for sending push notifications
  fetch('/subscribe', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      subscription: subscription,
    }),
  });
}