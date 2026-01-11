import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCISk54t_1O9IJh9EiV06Jha2G8Rxu2w4c",
  authDomain: "mycalendar-c7e21.firebaseapp.com",
  projectId: "mycalendar-c7e21",
  storageBucket: "mycalendar-c7e21.firebasestorage.app",
  messagingSenderId: "584205292158",
  appId: "1:584205292158:web:7ff34d63dc91f648273e2f",
  measurementId: "G-XXFHVW46DD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Cập nhật Header
        const userLink = document.getElementById("userLink");
        if (userLink) userLink.textContent = user.email.split('@')[0];

        // Kiểm tra Role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
            document.getElementById("adminAssessmentSection").style.display = "block";
        }
        
        loadReportData(user.email);
        loadAdminAssessment(user.email);
    } else {
        window.location.href = "login.html";
    }
});

async function loadAdminAssessment(email) {
    const snap = await getDoc(doc(db, "assessments", email));
    if (snap.exists()) {
        document.getElementById("balanceAssessment").innerHTML = `<p>${snap.data().content}</p>`;
        document.getElementById("adminAssessmentText").value = snap.data().content;
    }
}

window.saveAssessment = async () => {
    const text = document.getElementById("adminAssessmentText").value;
    const email = auth.currentUser.email;
    await setDoc(doc(db, "assessments", email), {
        content: text,
        updatedAt: new Date().toISOString()
    });
    alert("Đã lưu đánh giá!");
};

// Hàm này sẽ lấy dữ liệu sự kiện để vẽ biểu đồ (Chart.js)
async function loadReportData(email) {
    const q = query(collection(db, "events"), where("userEmail", "==", email));
    const querySnapshot = await getDocs(q);
    // Logic vẽ Chart của bạn ở đây...
}
// Thêm dòng này vào cuối file report.js của bạn
window.saveAssessment = async () => {
    const text = document.getElementById("adminAssessmentText").value;
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Lưu đánh giá vào collection 'assessments'
        // Dùng EMAIL của user đó làm ID để dễ quản lý
        await setDoc(doc(db, "assessments", user.email), {
            content: text,
            updatedAt: new Date().toISOString()
        });
        alert("Đã lưu đánh giá thành công!");
        location.reload(); // Load lại để hiện nội dung mới
    } catch (e) {
        alert("Lỗi: " + e.message);
    }
};
// ... (Giữ nguyên phần import và config của bạn)

async function loadReportData(email) {
  const q = query(collection(db, "events"), where("userEmail", "==", email));
  const querySnapshot = await getDocs(q);
  
  const stats = { meeting: 0, work: 0, personal: 0, study: 0, play: 0, appointment: 0 };

  querySnapshot.forEach(doc => {
    const data = doc.data();
    // Tính số phút giữa startTime và endTime
    const start = data.startTime.split(':');
    const end = data.endTime.split(':');
    const duration = (parseInt(end[0]) * 60 + parseInt(end[1])) - (parseInt(start[0]) * 60 + parseInt(start[1]));
    
    if (duration > 0) stats[data.category] += duration / 60; // Đổi ra giờ
  });

  updateChart(stats);
  generateAutoAssessment(stats);
}

// Tự động đưa ra nhận xét nếu là Admin (Hoặc gợi ý cho Admin sửa)
function generateAutoAssessment(stats) {
  let advice = "";
  if (stats.meeting > stats.work) {
    advice = "Thời gian họp đang nhiều hơn thời gian làm việc thực tế. Cần tối ưu lại lịch họp.";
  } else if (stats.work > 8) {
    advice = "Bạn đang làm việc quá cường độ, hãy dành thời gian nghỉ ngơi.";
  } else {
    advice = "Lịch trình hiện tại khá cân bằng.";
  }
  
  // Hiển thị nội dung gợi ý vào ô Textarea của Admin
  const adminArea = document.getElementById("adminAssessmentText");
  if (adminArea && !adminArea.value) {
    adminArea.value = advice;
  }
}

// KHẮC PHỤC NÚT LƯU: Gán vào window
window.saveAssessment = async () => {
  const text = document.getElementById("adminAssessmentText").value;
  const email = auth.currentUser.email;
  
  try {
    await setDoc(doc(db, "assessments", email), {
      content: text,
      updatedAt: new Date().toISOString()
    });
    alert("Đã lưu đánh giá thành công!");
    location.reload();
  } catch (e) {
    alert("Lỗi: " + e.message);
  }
};