const API = "https://forum-backend-t92d.onrender.com";
const socket = io(API);

const params = new URLSearchParams(window.location.search);
const threadId = params.get("id");

let user = localStorage.getItem("user");

// ================= LOAD THREAD =================
async function loadThread() {
  const res = await fetch(API + "/threads");
  const threads = await res.json();

  const t = threads.find(x => x._id === threadId);

  document.getElementById("title").innerText = t.title;

  const el = document.getElementById("comments");
  el.innerHTML = "";

  renderComments(t.comments || [], el);

  socket.emit("joinThread", threadId);

  // ✅ CHECK IF USER ALREADY COMMENTED
  const alreadyCommented = (t.comments || []).some(
    c => c.user === user
  );

  const input = document.getElementById("commentInput");
  const btn = document.querySelector("button[onclick='sendComment()']");

  if (alreadyCommented) {
    input.style.display = "none";
    btn.style.display = "none";
  } else {
    input.style.display = "block";
    btn.style.display = "block";
  }
}

// ================= COMMENTS =================
function renderComments(comments, parent, depth = 0) {
  comments.forEach(c => {
    const div = document.createElement("div");
    div.style.marginLeft = depth * 15 + "px";

    div.innerHTML = `
      <p><b>${c.user}</b>: ${c.text}</p>
      <button onclick="showReplyBox('${c._id}', this)">Reply</button>
      <div id="replies-${c._id}"></div>
    `;

    parent.appendChild(div);

    if (c.replies) {
      renderComments(c.replies, div.querySelector(`#replies-${c._id}`), depth + 1);
    }
  });
}

// ================= COMMENT =================
function sendComment() {
  const input = document.getElementById("commentInput");

  socket.emit("comment", {
    threadId,
    user,
    text: input.value
  });

  input.value = "";

  // ✅ Hide immediately (no reload wait)
  input.style.display = "none";
  document.querySelector("button[onclick='sendComment()']").style.display = "none";
}

// ================= REPLY =================
function showReplyBox(commentId, btn) {
  const box = document.createElement("div");

  box.innerHTML = `
    <input id="reply-${commentId}" placeholder="Reply..." />
    <button onclick="submitReply('${commentId}')">Send</button>
  `;

  btn.parentElement.appendChild(box);
}

function submitReply(commentId) {
  const input = document.getElementById(`reply-${commentId}`);

  socket.emit("reply", {
    threadId,
    parentId: commentId,
    user,
    text: input.value
  });
}

// ================= SOCKET =================
socket.on("newComment", loadThread);
socket.on("newReply", loadThread);

// ================= INIT =================
loadThread();
