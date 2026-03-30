const API = "https://forum-backend-t92d.onrender.com";
const socket = io("https://forum-backend-t92d.onrender.com");

let currentUser = localStorage.getItem("user") || "anon";

// ================= TIME =================
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s/60)+"m ago";
  if (s < 86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}

// ================= LOAD THREADS =================
async function loadThreads() {
  const res = await fetch(API + "/threads");
  const data = await res.json();

  const el = document.getElementById("threads");
  el.innerHTML = "";

  data.forEach(t => {
    const d = document.createElement("div");
    d.className = "thread";

    d.innerHTML = `
      <div class="thread-box">
        <b>${t.title}</b> 🔥 ${t.score}
        <div>👍 ${t.upvotes} • ${timeAgo(t.createdAt)}</div>
        <button onclick="upvote('${t._id}')">Upvote</button>
        <div id="comments-${t._id}"></div>

        <input placeholder="Write a comment..." id="comment-${t._id}" />
        <button onclick="sendComment('${t._id}')">Comment</button>
      </div>
    `;

    el.appendChild(d);

    renderComments(t, t.comments || [], d.querySelector(`#comments-${t._id}`));
  });
}

// ================= RENDER COMMENTS (RECURSIVE) =================
function renderComments(thread, comments, parentEl, depth = 0) {
  comments.forEach(c => {
    const div = document.createElement("div");
    div.style.marginLeft = depth * 15 + "px";

    div.innerHTML = `
      <p><b>${c.user}</b>: ${c.text}</p>
      <small>${timeAgo(c.createdAt)} • 👍 ${c.upvotes}</small><br/>
      <button onclick="showReplyBox('${thread._id}', '${c._id}', this)">Reply</button>
      <div id="replies-${c._id}"></div>
    `;

    parentEl.appendChild(div);

    // Render nested replies
    if (c.replies && c.replies.length > 0) {
      renderComments(thread, c.replies, div.querySelector(`#replies-${c._id}`), depth + 1);
    }
  });
}

// ================= CREATE THREAD =================
async function createThread() {
  const title = document.getElementById("threadInput").value;

  await fetch(API + "/threads", {
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
    body: JSON.stringify({ username: currentUser })
  }).then(loadThreads);
}

// ================= COMMENT =================
function sendComment(threadId) {
  const input = document.getElementById(`comment-${threadId}`);
  const text = input.value;

  socket.emit("comment", {
    threadId,
    user: currentUser,
    text
  });

  input.value = "";
}

// ================= REPLY =================
function showReplyBox(threadId, commentId, btn) {
  const box = document.createElement("div");

  box.innerHTML = `
    <input type="text" id="reply-${commentId}" placeholder="Reply..." />
    <button onclick="submitReply('${threadId}', '${commentId}')">Send</button>
  `;

  btn.parentElement.appendChild(box);
}

function submitReply(threadId, commentId) {
  const input = document.getElementById(`reply-${commentId}`);
  const text = input.value;

  socket.emit("reply", {
    threadId,
    parentId: commentId,
    user: currentUser,
    text
  });
}

// ================= SOCKET LISTENERS =================
socket.on("newComment", () => loadThreads());
socket.on("newReply", () => loadThreads());
socket.on("commentUpvoted", () => loadThreads());

// ================= DARK MODE =================
function toggleDark() {
  document.body.classList.toggle("dark");
}

// ================= INIT =================
loadThreads();
