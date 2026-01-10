// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAms8wQyV4Ucj7WsqKGrZutwFV5Fc1pzpI",
  authDomain: "note-app-40dae.firebaseapp.com",
  databaseURL:
    "https://note-app-40dae-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "note-app-40dae",
  storageBucket: "note-app-40dae.firebasestorage.app",
  messagingSenderId: "141836591412",
  appId: "1:141836591412:web:3dd066e68a8181f7b74561",
  measurementId: "G-GWPB3GZC0V",
};

let daftarCatatan = [];
let indexSedangDiedit = null;

// ==================== FIREBASE INITIALIZATION ====================

async function initFirebase() {
  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
    );
    const {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signOut,
      sendPasswordResetEmail,
    } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
    );
    const {
      getFirestore,
      collection,
      addDoc,
      getDocs,
      updateDoc,
      deleteDoc,
      doc,
      query,
      where,
      orderBy,
    } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
    );

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.firebaseModules = {
      collection,
      addDoc,
      getDocs,
      updateDoc,
      deleteDoc,
      doc,
      query,
      where,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signOut,
      sendPasswordResetEmail,
    };

    console.log("Firebase initialized successfully!");
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
}

// ==================== SESSION STORAGE ====================

function getCurrentUser() {
  const userStr = sessionStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("token");
}

function getToken() {
  return sessionStorage.getItem("token");
}

function setToken(token) {
  sessionStorage.setItem("token", token);
}

function requireAuth() {
  const user = getCurrentUser();
  const token = getToken();
  return !!(user && token);
}

// ==================== MARKDOWN RENDERER ====================

function renderMarkdown(text) {
  if (!text) return "";

  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<u>$1</u>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.+?)_/g, "<em>$1</em>");
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
  text = text.replace(/`(.+?)`/g, "<code>$1</code>");
  text = text.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  text = text.replace(/^---$/gm, "<hr>");
  text = text.replace(/☐/g, '<input type="checkbox" disabled>');
  text = text.replace(/☑/g, '<input type="checkbox" checked disabled>');
  text = text.replace(/^• (.+)$/gm, "<li>$1</li>");
  text = text.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  text = text.replace(/\n/g, "<br>");

  return text;
}

// ==================== AUTH FUNCTIONS ====================

async function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Please fill in all fields!");
    return;
  }

  try {
    const { signInWithEmailAndPassword } = window.firebaseModules;
    const userCredential = await signInWithEmailAndPassword(
      window.firebaseAuth,
      email,
      password
    );
    const user = userCredential.user;

    setCurrentUser({ id: user.uid, email: user.email });
    setToken(user.uid);

    alert("Login successful!");
    navigateTo("main");
    await loadNotesFromFirestore();
  } catch (error) {
    console.error("Login error:", error);
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password"
    ) {
      alert("Invalid email or password!");
    } else if (error.code === "auth/user-not-found") {
      alert("User not found!");
    } else {
      alert("Login failed! " + error.message);
    }
  }
}

async function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const confirmPassword = document
    .getElementById("confirm-password")
    .value.trim();

  if (!email || !password || !confirmPassword) {
    alert("Please fill in all fields!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters!");
    return;
  }

  try {
    const { createUserWithEmailAndPassword } = window.firebaseModules;
    const userCredential = await createUserWithEmailAndPassword(
      window.firebaseAuth,
      email,
      password
    );
    const user = userCredential.user;

    setCurrentUser({ id: user.uid, email: user.email });
    setToken(user.uid);

    alert("Registration successful!");
    navigateTo("main");
    await loadNotesFromFirestore();
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === "auth/email-already-in-use") {
      alert("Email already in use!");
    } else if (error.code === "auth/weak-password") {
      alert("Password is too weak!");
    } else {
      alert("Registration failed: " + error.message);
    }
  }
}

// ==================== FIRESTORE NOTES FUNCTIONS ====================

async function loadNotesFromFirestore() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const { collection, getDocs, query, where } = window.firebaseModules;
    const notesRef = collection(window.firebaseDb, "notes");
    const q = query(notesRef, where("userId", "==", user.id));
    const querySnapshot = await getDocs(q);

    daftarCatatan = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      daftarCatatan.push({
        id: docSnapshot.id,
        title: data.title,
        note: data.content,
        tgl: new Date(data.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        createdAt: data.createdAt,
      });
    });

    // Sort by date descending (newest first)
    daftarCatatan.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    tampilkanCatatan();
    console.log(`Loaded ${daftarCatatan.length} notes`);
  } catch (error) {
    console.error("Failed to load notes:", error);

    // Check if it's a permission error
    if (error.code === "permission-denied") {
      alert(
        "Permission denied. Please set up Firestore rules in Firebase Console.\n\nGo to: Firebase Console > Firestore Database > Rules\n\nSet rules to allow read/write for authenticated users."
      );
    } else {
      alert("Failed to load notes. Please try again.");
    }

    // Show empty state
    tampilkanCatatan();
  }
}

async function tambahCatatan() {
  if (!requireAuth()) {
    alert("Please login first!");
    navigateTo("login");
    return;
  }

  const title = document.getElementById("title").value.trim();
  const note = document.getElementById("note").value.trim();
  const user = getCurrentUser();

  if (!title || !note) {
    alert("All fields must be filled!");
    return;
  }

  try {
    const { collection, addDoc } = window.firebaseModules;
    const docRef = await addDoc(collection(window.firebaseDb, "notes"), {
      title: title,
      content: note,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });

    const newNote = {
      id: docRef.id,
      title: title,
      note: note,
      tgl: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      createdAt: new Date().toISOString(),
    };

    daftarCatatan.unshift(newNote);
    tampilkanCatatan();

    document.getElementById("title").value = "";
    document.getElementById("note").value = "";

    alert("Note added successfully!");
  } catch (error) {
    console.error("Add note error:", error);
    alert("Failed to add note. Please try again.");
  }
}

window.simpanEdit = async function () {
  if (!requireAuth()) {
    alert("Please login first!");
    return;
  }

  if (indexSedangDiedit === null) return;

  const editTitle = document.getElementById("editTitle").value.trim();
  const editNote = document.getElementById("editNote").value.trim();
  const note = daftarCatatan[indexSedangDiedit];

  if (!editTitle || !editNote) {
    alert("All fields must be filled!");
    return;
  }

  try {
    const { doc, updateDoc } = window.firebaseModules;
    const noteRef = doc(window.firebaseDb, "notes", note.id);

    await updateDoc(noteRef, {
      title: editTitle,
      content: editNote,
      createdAt: new Date().toISOString(),
    });

    daftarCatatan[indexSedangDiedit].title = editTitle;
    daftarCatatan[indexSedangDiedit].note = editNote;
    daftarCatatan[indexSedangDiedit].tgl = new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

    tampilkanCatatan();
    closeEditModal();
    alert("Note updated successfully!");
  } catch (error) {
    console.error("Update note error:", error);
    alert("Failed to update note. Please try again.");
  }
};

window.hapusCatatan = async function (index) {
  if (!requireAuth()) {
    alert("Please login first!");
    return;
  }

  if (confirm("Are you sure you want to delete this note?")) {
    const note = daftarCatatan[index];

    try {
      const { doc, deleteDoc } = window.firebaseModules;
      const noteRef = doc(window.firebaseDb, "notes", note.id);
      await deleteDoc(noteRef);

      daftarCatatan.splice(index, 1);
      tampilkanCatatan();
      alert("Note deleted successfully!");
    } catch (error) {
      console.error("Delete note error:", error);
      alert("Failed to delete note. Please try again.");
    }
  }
};

// ==================== UI HANDLERS ====================

window.handleLogin = function () {
  login();
};

window.handleRegister = function () {
  register();
};

window.handleLogout = async function () {
  if (confirm("Are you sure you want to logout?")) {
    try {
      const { signOut } = window.firebaseModules;
      await signOut(window.firebaseAuth);
      clearCurrentUser();
      daftarCatatan = [];
      navigateTo("login");
      alert("Logged out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
      clearCurrentUser();
      daftarCatatan = [];
      navigateTo("login");
    }
  }
};

window.handleForgotPassword = async function () {
  const email = document.getElementById("forgot-email").value.trim();

  if (!email) {
    alert("Please enter your email!");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address!");
    return;
  }

  try {
    const { sendPasswordResetEmail } = window.firebaseModules;
    await sendPasswordResetEmail(window.firebaseAuth, email);

    alert(
      `Password reset email has been sent to ${email}. Please check your inbox and spam folder.`
    );

    // Clear input and navigate to login
    document.getElementById("forgot-email").value = "";
    navigateTo("login");
  } catch (error) {
    console.error("Password reset error:", error);

    if (error.code === "auth/user-not-found") {
      alert("No account found with this email address.");
    } else if (error.code === "auth/invalid-email") {
      alert("Invalid email address.");
    } else if (error.code === "auth/too-many-requests") {
      alert("Too many requests. Please try again later.");
    } else {
      alert("Failed to send reset email. Please try again.");
    }
  }
};

window.handleAddNote = function () {
  tambahCatatan();
};

window.navigateTo = function (page) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.classList.add("exit");
  });

  const targetPage = document.getElementById(`${page}-page`);
  if (targetPage) {
    targetPage.classList.remove("exit");
    targetPage.classList.add("active");
  }

  if (page === "main") {
    const user = getCurrentUser();
    const emailElement = document.querySelector(".dashboard-email");
    if (emailElement && user && user.email) {
      emailElement.textContent = user.email;
    }
  }
};

function tampilkanCatatan() {
  const wadah = document.getElementById("wadah");

  if (!daftarCatatan || daftarCatatan.length === 0) {
    wadah.innerHTML = `
      <div class="empty-state">
        <i class="hgi hgi-stroke hgi-note-05"></i>
        <p>No notes yet. Create your first note!</p>
      </div>
    `;
    return;
  }

  wadah.innerHTML = daftarCatatan
    .map((catatan, index) => {
      let renderedTitle = renderMarkdown(catatan.title);
      let renderedNote = renderMarkdown(catatan.note);
      return `
    <div class="note">
      <div class="note-top">
        <div class="note-left">
          <h3>${renderedTitle}</h3>
          <label>${catatan.tgl}</label>
        </div>
        <div class="note-right">
          <i onclick="editCatatan(${index})" class="hgi hgi-stroke hgi-edit-02" style="cursor: pointer; margin-right: 5px;"></i>
          <i onclick="hapusCatatan(${index})" class="hgi hgi-stroke hgi-delete-03" style="cursor: pointer;"></i>
        </div>
      </div>
      <div class="note-text">
        <p>${renderedNote}</p>
      </div>
    </div>
  `;
    })
    .join("");
}

window.editCatatan = function (index) {
  if (!requireAuth()) {
    alert("Please login first!");
    navigateTo("login");
    return;
  }

  indexSedangDiedit = index;
  const catatan = daftarCatatan[index];

  document.getElementById("editTitle").value = catatan.title;
  document.getElementById("editNote").value = catatan.note;
  document.getElementById("editModal").classList.add("active");
};

window.closeEditModal = function () {
  document.getElementById("editModal").classList.remove("active");
  indexSedangDiedit = null;
};

// ==================== EDITOR FUNCTIONS ====================

window.formatEditText = function (format) {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  if (!selectedText) {
    alert("Please select text first");
    return;
  }

  let formattedText = selectedText;

  if (format === "bold") formattedText = `**${selectedText}**`;
  else if (format === "italic") formattedText = `*${selectedText}*`;
  else if (format === "underline") formattedText = `__${selectedText}__`;
  else if (format === "strikethrough") formattedText = `~~${selectedText}~~`;

  textarea.value =
    textarea.value.substring(0, start) +
    formattedText +
    textarea.value.substring(end);

  textarea.focus();
  textarea.setSelectionRange(
    start + formattedText.length,
    start + formattedText.length
  );
};

window.insertEditList = function () {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "• " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 2, start + 2);
};

window.insertEditNumberedList = function () {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "1. " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 3, start + 3);
};

window.insertEditCheckbox = function () {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "☐ " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 2, start + 2);
};

window.insertEditHeading = function () {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "## " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 3, start + 3);
};

window.insertEditDivider = function () {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;

  const divider = "\n---\n";
  textarea.value =
    textarea.value.substring(0, start) +
    divider +
    textarea.value.substring(start);

  textarea.focus();
  textarea.setSelectionRange(start + divider.length, start + divider.length);
};

window.insertEditDate = function () {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;

  const now = new Date();
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const dateString = now.toLocaleDateString("en-US", options);

  textarea.value =
    textarea.value.substring(0, start) +
    dateString +
    textarea.value.substring(start);

  textarea.focus();
  textarea.setSelectionRange(
    start + dateString.length,
    start + dateString.length
  );
};

// ==================== INITIALIZATION ====================

window.addEventListener("DOMContentLoaded", async function () {
  console.log("Initializing Note Keep with Firebase...");

  const firebaseReady = await initFirebase();

  if (!firebaseReady) {
    document.getElementById("loading").style.display = "none";
    alert(
      "Failed to connect. Please check your internet connection and refresh the page."
    );
    return;
  }

  setTimeout(() => {
    document.getElementById("loading").style.display = "none";

    const currentUser = getCurrentUser();
    const token = getToken();

    if (currentUser && token) {
      console.log("User logged in, loading notes...");
      navigateTo("main");
      loadNotesFromFirestore();
    } else {
      console.log("No active session, showing login page");
      navigateTo("login");
    }
  }, 800);
});
