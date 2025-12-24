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
  window.location.href = "login.html";
}

function saveToStorage(users) {
  localStorage.setItem("user", users);
}

function login() {
  let inEmail = document.getElementById("email");
  let inPassword = document.getElementById("password");
  let users = JSON.parse(localStorage.getItem("user"));

  for (let i = 0; i < users.length; i++) {
    if (
      users[i].email === inEmail.value &&
      users[i].password === inPassword.value
    ) {
      alert("Login Berhasil");
      window.location.href = "note.html";
    }
  }
}

let daftarCatatan = [];

function tampilkanCatatan() {
  let wadah = document.getElementById("wadah");
  for (let i = 0; i < 1; i++) {
    wadah.innerHTML += `
    <div class="note">
      <div class="note-top">
        <div class="note-left">
          <h3>${daftarCatatan[i].title}</h3>
          <label>${daftarCatatan[i].tgl}</label>
        </div>
        <div class="note-right">
          <i class="hgi hgi-stroke hgi-edit-02"></i>
          <i class="hgi hgi-stroke hgi-delete-03"></i>
        </div>
      </div>
      <div class="note-text">
        <p>
          ${daftarCatatan[i].note}
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

  let noteObj = {
    title: title,
    tgl: tanggal,
    note: note,
  };
  daftarCatatan.push(noteObj);
  tampilkanCatatan();
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
