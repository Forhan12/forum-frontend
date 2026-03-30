const API = "https://forum-backend-t92d.onrender.com";
const socket = io(API);

let user = localStorage.getItem("user") || "anon";

// ================= TIME =================
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s/60)+"m ago";
  if (s < 86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}

// ================= LOAD =================
async function loadThreads() {
  const res = await fetch(API+"/threads");
  const data = await res.json();

  const el = document.getElementById("threads");
  el.innerHTML = "";

  data.forEach(t => {
    socket.emit("joinThread", t._id);

    const d = document.createElement("div");
    d.className = "thread-box";

    d.innerHTML = `
      <b>${t.title}</b> 🔥 ${t.score}
      <div>👍 ${t.upvotes} • ${timeAgo(t.createdAt)}</div>
      <button onclick="upvote('${t._id}')">Upvote</button>

      <div id="comments-${t._id}"></div>

      <input id="comment-${t._id}" placeholder="Write comment..." />
      <button onclick="sendComment('${t._id}')">Comment</button>
    `;

    el.appendChild(d);

    renderComments(t, t.comments || [], d.querySelector(`#comments-${t._id}`));
  });
}

// ================= COMMENTS =================
function renderComments(thread, comments, parent, depth = 0) {
  comments.forEach(c => {
    const div = document.createElement("div");
    div.style.marginLeft = depth * 15 + "px";

    div.innerHTML = `
      <p><b>${c.user}</b>: ${c.text}</p>
      <small>${timeAgo(c.createdAt)}</small><br/>
      <button onclick="showReplyBox('${thread._id}', '${c._id}', this)">Reply</button>
      <div id="replies-${c._id}"></div>
    `;

    parent.appendChild(div);

    if (c.replies) {
      renderComments(thread, c.replies, div.querySelector(`#replies-${c._id}`), depth + 1);
    }
  });
}

// ================= THREAD =================
async function createThread() {
  const title = document.getElementById("threadInput").value;

  await fetch(API+"/threads", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ title })
  });

  loadThreads();
}

// ================= UPVOTE =================
function upvote(id) {
  fetch(`${API}/threads/${id}/upvote`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ username: user })
  }).then(loadThreads);
}

// ================= COMMENT =================
function sendComment(threadId) {
  const input = document.getElementById(`comment-${threadId}`);

  socket.emit("comment", {
    threadId,
    user,
    text: input.value
  });

  input.value = "";
}

// ================= REPLY =================
function showReplyBox(threadId, commentId, btn) {
  const box = document.createElement("div");

  box.innerHTML = `
    <input id="reply-${commentId}" placeholder="Reply..." />
    <button onclick="submitReply('${threadId}', '${commentId}')">Send</button>
  `;

  btn.parentElement.appendChild(box);
}

function submitReply(threadId, commentId) {
  const input = document.getElementById(`reply-${commentId}`);

  socket.emit("reply", {
    threadId,
    parentId: commentId,
    user,
    text: input.value
  });
}

// ================= SOCKET =================
socket.on("newComment", () => loadThreads());
socket.on("newReply", () => loadThreads());

// ================= DARK =================
function toggleDark() {
  document.body.classList.toggle("dark");
}

// ================= INIT =================
loadThreads();
