// === Selectors ===
const chatbot = document.querySelector(".chatbot");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");
const uploadBtn = document.querySelector("#upload-btn");
const fileInput = document.querySelector("#fileInput");
const voiceBtn = document.querySelector("#voice-btn");

// store the initial height of the textarea once
const inputInitHeight = chatInput.scrollHeight;

let chatHistory = [];
const MAX_HISTORY = 2;

// Avatar images
const USER_AVATAR = "user.png";
const AI_AVATAR = "robot.png";

// API config
const API_KEY = "AIzaSyA9mouxHU23TZtioHm67Zh7ybgMBZYLYm0";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Get current time
const getCurrentTime = () => {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// === COPY FUNCTION ===
function copyMessage(btn) {
  const text = btn.closest(".ai-message").querySelector("p").innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = "📋"), 2000);
  });
}

// === REFRESH FUNCTION ===
function refreshMessage(btn) {
  const msgBox = btn.closest(".ai-message");
  const chatLi = msgBox.closest("li");
  const messageElement = msgBox.querySelector("p");
  const userIndex = chatLi.dataset.userIndex;

  if (userIndex === undefined) {
    messageElement.textContent = "❌ Original message not found!";
    btn.textContent = "🔄";
    return;
  }

  const userMsgObj = chatHistory[userIndex];
  messageElement.textContent = "⏳ Regenerating...";
  btn.textContent = "⏳";

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [userMsgObj] }),
  })
    .then((res) => res.json())
    .then((data) => {
      const aiText = data.candidates[0].content.parts[0].text;
      messageElement.textContent = aiText;
      btn.textContent = "🔄";
      chatHistory.push({ role: "model", parts: [{ text: aiText }] });
    })
    .catch(() => {
      messageElement.textContent = "❌ Error getting response!";
      btn.textContent = "🔄";
    });
}

// === CHAT MESSAGE CREATION ===
const createChatLi = (message, className, isImage = false) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);

  const timeHTML = `<br><small style="font-size:0.7em;">${getCurrentTime()}</small>`;

  if (className === "outgoing") {
    chatLi.innerHTML = `
      <img src="${USER_AVATAR}" alt="User" class="chat-avatar">
      <p>${isImage ? `<img src="${message}" class="chat-image">` : message}${timeHTML}</p>
    `;
  } else {
    chatLi.innerHTML = `
      <img src="${AI_AVATAR}" alt="AI" class="chat-avatar">
      <div class="ai-message">
        <p>${message}${timeHTML}</p>
        <div class="ai-actions">
          <span class="copy-btn" onclick="copyMessage(this)">📋</span>
          <span class="refresh-btn" onclick="refreshMessage(this)">🔄</span>
        </div>
      </div>
    `;
  }
  return chatLi;
};

// === GENERATE RESPONSE ===
// === GENERATE RESPONSE (extended with backend) ===
const generateResponse = async (chatElement, originalQuestion, imageData = null) => {
  const messageElement = chatElement.querySelector("p");

  if (chatHistory.length > MAX_HISTORY * 2) {
    chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
  }

  try {
    // --- Step 1: Try backend (Redis + Qdrant) ---
    const backendRes = await fetch("http://localhost:4000/chat/query/session1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: originalQuestion }),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      const aiText = data.answer;

      chatHistory.push({ role: "model", parts: [{ text: aiText }] });
      messageElement.innerHTML = aiText + `<br><small style="font-size:0.7em;">${getCurrentTime()}</small>`;
      chatbox.scrollTo(0, chatbox.scrollHeight);
      return; // ✅ stop here if backend worked
    }

    // --- Step 2: Fallback to Gemini API if backend fails ---
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const aiText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1");
    chatHistory.push({ role: "model", parts: [{ text: aiText }] });
    messageElement.innerHTML = aiText + `<br><small style="font-size:0.7em;">${getCurrentTime()}</small>`;

  } catch (error) {
    messageElement.classList.add("error");
    messageElement.textContent = error.message;
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};


// Escape special characters for safe code rendering
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Copy XML code
function copyCode(btn) {
  const codeText = btn.closest(".code-block").querySelector("code").innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = "📋"), 2000);
  });
}

// === HANDLE CHAT ===
function handleChat() {
  const userMessage = chatInput.value.trim();
  if (!userMessage && pastedItems.length === 0) return;

  const userParts = [];
  if (userMessage) userParts.push({ text: userMessage });
  if (pastedItems.length) userParts.push(...pastedItems);

  const outgoingLi = document.createElement("li");
  outgoingLi.classList.add("chat", "outgoing");

  const userAvatar = document.createElement("img");
  userAvatar.src = USER_AVATAR;
  userAvatar.alt = "User";
  userAvatar.classList.add("chat-avatar");
  outgoingLi.appendChild(userAvatar);

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("chat-content");

  if (pastedItems.length === 1 && userMessage) {
    const singleImg = document.createElement("img");
    singleImg.src = `data:${pastedItems[0].inline_data.mime_type};base64,${pastedItems[0].inline_data.data}`;
    singleImg.classList.add("chat-image");
    contentDiv.appendChild(singleImg);

    const msgP = document.createElement("p");
    msgP.textContent = userMessage;
    msgP.classList.add("chat-text");
    contentDiv.appendChild(msgP);

  } else if (pastedItems.length > 1) {
    const grid = document.createElement("div");
    grid.classList.add("image-grid");

    pastedItems.forEach((imgObj) => {
      const imgEl = document.createElement("img");
      imgEl.src = `data:${imgObj.inline_data.mime_type};base64,${imgObj.inline_data.data}`;
      imgEl.classList.add("chat-image");
      grid.appendChild(imgEl);
    });

    contentDiv.appendChild(grid);

    if (userMessage) {
      const msgP = document.createElement("p");
      msgP.textContent = userMessage;
      msgP.classList.add("chat-text");
      contentDiv.appendChild(msgP);
    }

  } else if (pastedItems.length === 1 && !userMessage) {
    const singleImg = document.createElement("img");
    singleImg.src = `data:${pastedItems[0].inline_data.mime_type};base64,${pastedItems[0].inline_data.data}`;
    singleImg.classList.add("chat-image");
    contentDiv.appendChild(singleImg);

  } else if (userMessage) {
    const msgP = document.createElement("p");
    msgP.textContent = userMessage;
    msgP.classList.add("chat-text");
    contentDiv.appendChild(msgP);
  }

  const timeSmall = document.createElement("small");
  timeSmall.textContent = getCurrentTime();
  timeSmall.style.fontSize = "0.7em";
  timeSmall.style.opacity = "0.75";
  timeSmall.style.display = "block";
  timeSmall.style.marginTop = "4px";
  contentDiv.appendChild(timeSmall);

  outgoingLi.appendChild(contentDiv);
  chatbox.appendChild(outgoingLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  chatHistory.push({ role: "user", parts: userParts });

  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;
  pastePreview.innerHTML = "";
  pastedItems = [];

  setTimeout(() => {
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    incomingChatLi.dataset.userIndex = chatHistory.length - 1;
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    const questionForAras = userMessage || (pastedItems.length ? "[Image uploaded]" : "");
    const imageForAras = pastedItems.length === 1 ? pastedItems[0].inline_data.data : null;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    pastePreview.innerHTML = "";
    pastedItems = [];

    generateResponse(incomingChatLi, questionForAras, imageForAras);
  }, 600);
}

// === INPUT RESIZE ===
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// === ENTER KEY ===
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChat();
  }
});
sendChatBtn.addEventListener("click", handleChat);

// === FILE UPLOAD ===
uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  chatbox.appendChild(createChatLi(`📎 File uploaded: ${file.name}`, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  const supportedTypes = ["text/plain", "application/pdf", "image/png", "image/jpeg"];

  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        const docText = result.value;

        chatHistory.push({
          role: "user",
          parts: [{ text: `Extracted text from ${file.name}:\n\n${docText}` }],
        });

        const incomingChatLi = createChatLi("Thinking...", "incoming");
        incomingChatLi.dataset.userIndex = chatHistory.length - 1;
        chatbox.appendChild(incomingChatLi);

        generateResponse(incomingChatLi, docText);
      } catch (err) {
        chatbox.appendChild(createChatLi("❌ Failed to read DOCX file", "incoming"));
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  if (supportedTypes.includes(file.type)) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64File = e.target.result.split(",")[1];
      chatHistory.push({
        role: "user",
        parts: [
          { text: `Uploaded: ${file.name}` },
          { inline_data: { mime_type: file.type, data: base64File } },
        ],
      });

      const incomingChatLi = createChatLi("Thinking...", "incoming");
      incomingChatLi.dataset.userIndex = chatHistory.length - 1;
      chatbox.appendChild(incomingChatLi);

      generateResponse(incomingChatLi, "[Images pasted]");
    };
    reader.readAsDataURL(file);
  } else {
    chatbox.appendChild(createChatLi(`❌ Unsupported file type: ${file.name}`, "incoming"));
  }

  fileInput.value = "";
});

// === MULTI-IMAGE + TEXT PASTE ===
const pastePreview = document.querySelector(".paste-preview");
let pastedItems = [];

document.addEventListener("paste", (e) => {
  const clipboardItems = Array.from(e.clipboardData.items);
  const pastedText = e.clipboardData.getData("text");
  let hasImage = false;

  if (pastedText) {
    return;
  }

  clipboardItems.forEach((item) => {
    if (item.type.startsWith("image/")) {
      hasImage = true;
      const file = item.getAsFile();
      const reader = new FileReader();

      reader.onload = (ev) => {
        const imgData = ev.target.result;

        pastedItems.push({
          inline_data: { mime_type: file.type, data: imgData.split(",")[1] },
        });

        const imgPreview = document.createElement("img");
        imgPreview.src = imgData;
        imgPreview.style.height = "50px";
        imgPreview.style.margin = "2px";
        pastePreview.appendChild(imgPreview);
      };
      reader.readAsDataURL(file);
    }
  });

  if (pastedText) {
    chatInput.value += (chatInput.value ? "\n" : "") + pastedText;
    chatInput.dispatchEvent(new Event("input"));
  }

  if (hasImage) e.preventDefault();
});

// === VOICE INPUT ===
let recognition;
let isRecording = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecording = true;
    voiceBtn.style.color = "#d33";
  };
  recognition.onend = () => {
    isRecording = false;
    voiceBtn.style.color = "#724ae8";
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    chatInput.dispatchEvent(new Event("input"));
  };
  recognition.onerror = (event) => {
    alert("Voice recognition error: " + event.error);
    isRecording = false;
    voiceBtn.style.color = "#724ae8";
  };
} else {
  voiceBtn.style.display = "none";
}

voiceBtn.addEventListener("click", () => {
  if (isRecording) recognition.stop();
  else recognition.start();
});
