import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// BẮT BUỘC PHẢI CÓ CONFIG Ở ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyCISk54t_1O9IJh9EiV06Jha2G8Rxu2w4c",
  authDomain: "mycalendar-c7e21.firebaseapp.com",
  projectId: "mycalendar-c7e21",
  storageBucket: "mycalendar-c7e21.firebasestorage.app",
  messagingSenderId: "584205292158",
  appId: "1:584205292158:web:7ff34d63dc91f648273e2f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Kiểm tra role chính xác
            document.getElementById("userRole").value = data.role === "admin" ? "Quản trị viên" : "Người dùng";
        }
    }
});


// --- CẤU HÌNH ---
const CLOUD_NAME = "da1kzeqey"; // Thay bằng Cloud Name của bạn
const UPLOAD_PRESET = "my_preset"; // Thay bằng Unsigned Preset của bạn

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userLink = document.getElementById("userLink");
        if (userLink) userLink.textContent = user.email.split('@')[0];
        document.getElementById("userEmail").value = user.email;
        
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                document.getElementById("userPhone").value = data.phone || "";
                document.getElementById("userRole").value = data.role === "admin" ? "Quản trị viên" : "Người dùng";
                document.getElementById("avatarPreview").src = data.avatar || "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/500px-Default_pfp.svg.png";
            } else {
                console.error("Không tìm thấy document cho UID:", user.uid);
            }
        } catch (e) { console.error("Lỗi tải dữ liệu user:", e); }
    } else {
        window.location.href = "login.html";
    }
});

document.getElementById("avatarUpload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("avatarPreview");
    const oldSrc = preview.src;
    preview.style.opacity = "0.5";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        // BƯỚC 1: UPLOAD CLOUDINARY
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Cloudinary: ${errData.error.message}`);
        }

        const data = await response.json();
        const avatarUrl = data.secure_url;

        // BƯỚC 2: CẬP NHẬT FIRESTORE
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, "users", user.uid);
            
            // Kiểm tra xem document có tồn tại trước khi update không
            const checkDoc = await getDoc(userRef);
            if (!checkDoc.exists()) {
                throw new Error("Tài khoản của bạn chưa có dữ liệu trên hệ thống (Firestore). Hãy thử đăng ký lại.");
            }

            await updateDoc(userRef, { avatar: avatarUrl });
            
            // BƯỚC 3: CẬP NHẬT GIAO DIỆN
            preview.src = avatarUrl;
            preview.style.opacity = "1";
            alert("Cập nhật thành công!");
        }

    } catch (error) {
        console.error("DEBUG LỖI:", error);
        alert("LỖI CỤ THỂ: " + error.message);
        preview.src = oldSrc;
        preview.style.opacity = "1";
    }
});