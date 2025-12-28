let users = [];

function tambahUser() {
  let inEmail = document.getElementById("email");
  let inPassword = document.getElementById("password");
  let inConfirmPassword = document.getElementById("confirm-password");

  console.log(inEmail.value, inPassword.value, inConfirmPassword.value);

  if (inPassword.value !== inConfirmPassword.value) {
    alert("Password tidak sesuai!");
    return;
  }

  let newUser = {
    email: inEmail.value,
    password: inPassword.value,
    confirmPassword: inConfirmPassword.value,
  };
  users.push(newUser);

  alert("Registrasi berhasil!");
  saveToStorage(JSON.stringify(users));
  window.location.href = "index.html";
}

function saveToStorage(users) {
  localStorage.setItem("user", users);
}

function login() {
  let inEmail = document.getElementById("email");
  let inPassword = document.getElementById("password");
  let users = JSON.parse(localStorage.getItem("user"));

  for (let i = 0; i < 1; i++) {
    if (
      users[i].email === inEmail.value &&
      users[i].password === inPassword.value
    ) {
      alert("Login Berhasil");
      window.location.href = "main.html";
    } else {
      alert("Login Gagal");
      window.location.href = "index.html";
    }
  }
}

let daftarCatatan = [];

function loadCatatanFromStorage() {
  let savedNotes = localStorage.getItem("daftarCatatan");
  if (savedNotes) {
    daftarCatatan = JSON.parse(savedNotes);
  }
}

function saveCatatanToStorage() {
  localStorage.setItem("daftarCatatan", JSON.stringify(daftarCatatan));
}

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

function tampilkanCatatan() {
  let wadah = document.getElementById("wadah");

  if (!wadah) return;

  wadah.innerHTML = "";

  if (daftarCatatan.length === 0) {
    wadah.innerHTML =
      '<p style="text-align: center; color: #999; padding: 40px;">There are no notes yet. Create your first note!</p>';
    return;
  }

  for (let i = 0; i < daftarCatatan.length; i++) {
    let renderedTitle = renderMarkdown(daftarCatatan[i].title);
    let renderedNote = renderMarkdown(daftarCatatan[i].note);

    wadah.innerHTML += `
    <div class="note">
      <div class="note-top">
        <div class="note-left">
          <h3>${renderedTitle}</h3>
          <label>${daftarCatatan[i].tgl}</label>
        </div>
        <div class="note-right">
          <i onclick = "editCatatan(${i})" class="hgi hgi-stroke hgi-edit-02 edit"></i>
          <i onclick = "hapusCatatan(${i})" class="hgi hgi-stroke hgi-delete-03 hapus"></i>
        </div>
      </div>
      <div class="note-text">
        <p>
          ${renderedNote}
        </p>
      </div>
    </div>
    `;
  }
}

function tambahCatatan() {
  let title = document.getElementById("title").value;
  let note = document.getElementById("note").value;
  let tgl = new Date();

  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  let tanggal = tgl.toLocaleDateString("en-US", options);

  if (title == "" || note == "") {
    alert("Semua field harus diisi!");
    return;
  }

  let noteObj = {
    title: title,
    tgl: tanggal,
    note: note,
  };

  daftarCatatan.push(noteObj);
  saveCatatanToStorage();
  tampilkanCatatan();

  document.getElementById("title").value = "";
  document.getElementById("note").value = "";

  alert("Catatan berhasil ditambahkan!");
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function hapusCatatan(index) {
  if (confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
    daftarCatatan.splice(index, 1);
    saveCatatanToStorage();
    tampilkanCatatan();
    alert("Berhasil menghapus");
  }
}

function displayUserEmail() {
  let user = JSON.parse(localStorage.getItem("user"));
  let dashboardEmail = document.querySelector(".dashboard-email");
  if (user && user[0]) {
    dashboardEmail.innerHTML = user[0].email;
  }
}

window.addEventListener("DOMContentLoaded", function () {
  displayUserEmail();
  loadCatatanFromStorage();
  tampilkanCatatan();
});

let indexSedangDiedit = null;

function editCatatan(index) {
  indexSedangDiedit = index;

  let editTitle = document.getElementById("editTitle");
  let editNote = document.getElementById("editNote");

  editTitle.value = daftarCatatan[index].title;
  editNote.value = daftarCatatan[index].note;

  openEditModal();
}

function openEditModal() {
  let modal = document.getElementById("editModal");
  modal.classList.add("active");

  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  let modal = document.getElementById("editModal");
  modal.classList.remove("active");

  document.body.style.overflow = "auto";

  indexSedangDiedit = null;
}

function simpanEdit() {
  if (indexSedangDiedit === null) return;

  let editTitle = document.getElementById("editTitle").value;
  let editNote = document.getElementById("editNote").value;

  if (editTitle === "" || editNote === "") {
    alert("Semua field harus diisi!");
    return;
  }

  daftarCatatan[indexSedangDiedit].title = editTitle;
  daftarCatatan[indexSedangDiedit].note = editNote;

  let tgl = new Date();
  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  daftarCatatan[indexSedangDiedit].tgl = tgl.toLocaleDateString(
    "en-US",
    options
  );

  saveCatatanToStorage();

  tampilkanCatatan();

  closeEditModal();

  alert("Catatan berhasil diperbarui!");
}

function formatEditText(format) {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  if (!selectedText) {
    alert("Silakan pilih teks terlebih dahulu");
    return;
  }

  let formattedText = selectedText;
  let wrapper = "";

  if (format === "bold") {
    formattedText = `**${selectedText}**`;
    wrapper = "**";
  } else if (format === "italic") {
    formattedText = `*${selectedText}*`;
    wrapper = "*";
  } else if (format === "underline") {
    formattedText = `__${selectedText}__`;
    wrapper = "__";
  } else if (format === "strikethrough") {
    formattedText = `~~${selectedText}~~`;
    wrapper = "~~";
  }

  textarea.value =
    textarea.value.substring(0, start) +
    formattedText +
    textarea.value.substring(end);

  textarea.focus();
  textarea.setSelectionRange(
    start + formattedText.length,
    start + formattedText.length
  );
}

function insertEditList() {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "• " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 2, start + 2);
}

function insertEditNumberedList() {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "1. " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 3, start + 3);
}

function insertEditCheckbox() {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "☐ " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 2, start + 2);
}

function insertEditHeading() {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;

  textarea.value =
    textarea.value.substring(0, lineStart) +
    "## " +
    textarea.value.substring(lineStart);

  textarea.focus();
  textarea.setSelectionRange(start + 3, start + 3);
}

function insertEditDivider() {
  const textarea = document.getElementById("editNote");
  const start = textarea.selectionStart;

  const divider = "\n---\n";
  textarea.value =
    textarea.value.substring(0, start) +
    divider +
    textarea.value.substring(start);

  textarea.focus();
  textarea.setSelectionRange(start + divider.length, start + divider.length);
}

function insertEditDate() {
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
}

document.addEventListener("click", function (event) {
  let modal = document.getElementById("editModal");
  if (modal && event.target === modal) {
    closeEditModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeEditModal();
  }
});
