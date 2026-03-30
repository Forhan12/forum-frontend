const API = "https://forum-backend-t92d.onrender.com";
const socket = io(API);

// ================= USER =================
let user = localStorage.getItem("user");

if (user) {
  const auth = document.getElementById("auth");
  if (auth) auth.style.display = "none";
}

// ================= TIME AGO =================
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;

  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";

  return Math.floor(s / 86400) + "d ago";
}

// ================= LOAD THREADS =================
async function loadThreads() {
  const res = await fetch(API + "/threads");
  const data = await res.json();

  const el = document.getElementById("threads");
  el.innerHTML = "";

  data.forEach(t => {
    // 🔥 join socket room for realtime
    socket.emit("joinThread", t._id);

    const d = document.createElement("div");
    d.className = "thread";

    d.innerHTML = `
      <div class="thread-card">
        <h3 class="thread-title" onclick="openThread('${t._id}')">
          ${t.title}
        </h3>

        <div class="thread-meta">
          👍 ${t.upvotes} • ${timeAgo(t.createdAt)} • 🔥 ${t.score}
        </div>

        <div class="thread-actions">
          <button onclick="upvote('${t._id}')">⬆ Upvote</button>
        </div>
      </div>
    `;

    el.appendChild(d);
  });
}

// ================= CREATE THREAD =================
async function createThread() {
  const input = document.getElementById("threadInput");
  const title = input.value.trim();

  if (!title) return alert("Enter a title");

  await fetch(API + "/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });

  input.value = "";
  loadThreads();
}

// ================= UPVOTE =================
function upvote(id) {
  if (!user) return alert("Login first");

  fetch(API + `/threads/${id}/upvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user })
  })
  .then(res => res.json())
  .then(() => loadThreads());
}

// ================= NAVIGATION =================
function openThread(id) {
  window.location.href = `thread.html?id=${id}`;
}

// ================= DARK MODE =================
function toggleDark() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
}

// Load saved theme
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

// ================= AUTH =================

// Signup
async function signup() {
  const username = document.getElementById("signupUser").value;

  if (!username) return alert("Enter username");

  const res = await fetch(API + "/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
  } else {
    alert("Your login code: " + data.code);
  }
}

// Login
async function login() {
  const username = document.getElementById("loginUser").value;
  const code = document.getElementById("loginCode").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, code })
  });

  const data = await res.json();

  if (data.error) {
    alert("Invalid login");
  } else {
    localStorage.setItem("user", username);
    alert("Logged in!");

    document.getElementById("auth").style.display = "none";
  }
}

// ================= REALTIME =================
socket.on("newComment", () => loadThreads());
socket.on("newReply", () => loadThreads());
socket.on("commentUpvoted", () => loadThreads());

// ================= INIT =================
loadThreads();
