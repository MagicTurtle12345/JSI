import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCISk54t_1O9IJh9EiV06Jha2G8Rxu2w4c",
  authDomain: "mycalendar-c7e21.firebaseapp.com",
  projectId: "mycalendar-c7e21",
  storageBucket: "mycalendar-c7e21.firebasestorage.app",
  messagingSenderId: "584205292158",
  appId: "1:584205292158:web:7ff34d63dc91f648273e2f",
  measurementId: "G-XXFHVW46DD",
};
// Khởi tạo
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Xuất ra window để các file khác (calendar.js, report.js) dùng chung
window.firebaseAuth = auth;
window.db = db;

// --- HÀM ĐĂNG KÝ ---
window.handleRegister = async (e) => {
  e.preventDefault();
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  if (confirmPassword && password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Tạo role mặc định trong Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: "user",
      createdAt: new Date().toISOString(),
    });

    alert("Đăng ký thành công!");
    window.location.href = "calendar.html";
  } catch (error) {
    alert("Lỗi đăng ký: " + error.message);
  }
};

// --- HÀM ĐĂNG NHẬP ---
window.handleLogin = async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "calendar.html";
  } catch (error) {
    alert("Lỗi đăng nhập: " + error.message);
  }
};

// --- HÀM ĐĂNG XUẤT ---
window.logout = () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};

// --- THEO DÕI TRẠNG THÁI ---
onAuthStateChanged(auth, (user) => {
  const userLink = document.getElementById("userLink");
  if (user && userLink) {
    userLink.textContent = user.email.split("@")[0];
  }
});
