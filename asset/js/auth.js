// Nhập các hàm cần thiết từ Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCISk54t_1O9IJh9EiV06Jha2G8Rxu2w4c",
  authDomain: "mycalendar-c7e21.firebaseapp.com",
  projectId: "mycalendar-c7e21",
  storageBucket: "mycalendar-c7e21.firebasestorage.app",
  messagingSenderId: "584205292158",
  appId: "1:584205292158:web:7ff34d63dc91f648273e2f",
  measurementId: "G-XXFHVW46DD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 2. Hàm Đăng ký
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Đăng ký thành công:", userCredential.user);
        window.location.href = "index.html";
    } catch (error) {
        alert("Lỗi đăng ký: " + error.message);
    }
}

import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function registerUser(email, password, role = "user") { // Mặc định là user
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Lưu thông tin role vào Firestore
        await setDoc(doc(window.db, "users", user.uid), {
            email: email,
            role: role // 'admin' hoặc 'user'
        });

        window.location.href = "index.html";
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
}

// 3. Hàm Đăng nhập
async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html";
    } catch (error) {
        alert("Lỗi đăng nhập: " + error.message);
    }
}

// 4. Hàm Đăng xuất
function logout() {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
}

// 5. Kiểm tra trạng thái đăng nhập (Thay cho getCurrentUser)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Người dùng đã đăng nhập
        console.log("User hiện tại:", user.email);
        // Bạn có thể lưu tạm email vào biến global để các file js khác dùng
        window.currentUser = user; 
    } else {
        // Người dùng chưa đăng nhập
        if (window.location.pathname.includes("calendar.html") || window.location.pathname.includes("report.html")) {
            window.location.href = "login.html";
        }
    }
});

// Xuất các hàm để sử dụng ở file HTML
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logout = logout;

