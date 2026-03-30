const API = "https://forum-backend-t92d.onrender.com";
const socket = io("https://forum-backend-t92d.onrender.com");

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s/60)+"m ago";
  if (s < 86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}

async function loadThreads() {
  const res = await fetch(API+"/threads");
  const data = await res.json();

  const el = document.getElementById("threads");
  el.innerHTML = "";

  data.forEach(t => {
    const d = document.createElement("div");
    d.className = "thread";

    d.innerHTML = `
      <b>${t.title}</b> 🔥 ${t.score}
      <div>👍 ${t.upvotes} • ${timeAgo(t.createdAt)}</div>
      <button onclick="upvote('${t._id}')">Upvote</button>
    `;

    el.appendChild(d);
  });
}

async function createThread() {
  const title = document.getElementById("threadInput").value;
  await fetch(API+"/threads", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ title })
  });
  loadThreads();
}

function upvote(id) {
  fetch(API+`/threads/${id}/upvote`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ username: "test" })
  }).then(loadThreads);
}

function toggleDark() {
  document.body.classList.toggle("dark");
}

loadThreads();
