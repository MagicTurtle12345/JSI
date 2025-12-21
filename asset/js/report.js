import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. THEO DÕI ĐĂNG NHẬP & KIỂM TRA ROLE ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Lấy thông tin Role của user từ Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        // Hiển thị giao diện dựa trên Role
        const adminSection = document.getElementById("adminAssessmentSection");
        if (userData && userData.role === "admin") {
            adminSection.style.display = "block";
            console.log("Chào Admin!");
        } else {
            adminSection.style.display = "none";
        }

        // Tải dữ liệu báo cáo và đánh giá
        loadReportData(user.email);
        loadAdminAssessment(user.email);
    } else {
        window.location.href = "login.html";
    }
});

// --- 3. TẢI ĐÁNH GIÁ CỦA ADMIN ---
async function loadAdminAssessment(userEmail) {
    const assessmentText = document.getElementById("adminAssessmentText");
    const displayArea = document.getElementById("balanceAssessment");

    // Giả sử đánh giá được lưu trong collection 'assessments' theo email người dùng
    const docRef = doc(db, "assessments", userEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (assessmentText) assessmentText.value = data.content;
        displayArea.innerHTML = `<p style="line-height: 1.6;">${data.content}</p>`;
    } else {
        displayArea.innerHTML = `<p>Chưa có đánh giá nào từ Admin.</p>`;
    }
}

// --- 4. HÀM LƯU ĐÁNH GIÁ (CHỈ ADMIN GỌI ĐƯỢC) ---
window.saveAssessment = async () => {
    const user = auth.currentUser;
    const assessmentText = document.getElementById("adminAssessmentText").value;
    
    // Kiểm tra lại role một lần nữa cho chắc chắn
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.data().role !== "admin") {
        alert("Bạn không có quyền thực hiện hành động này!");
        return;
    }

    try {
        // Lưu vào collection 'assessments', dùng email người dùng làm ID tài liệu
        // Lưu ý: Trong thực tế bạn cần xác định đang đánh giá cho user nào
        const targetUserEmail = auth.currentUser.email; // Ví dụ admin tự đánh giá mình hoặc chọn 1 user cụ thể
        
        await setDoc(doc(db, "assessments", targetUserEmail), {
            content: assessmentText,
            adminEmail: user.email,
            updatedAt: new Date().toISOString()
        });

        alert("Lưu đánh giá thành công!");
        loadAdminAssessment(targetUserEmail);
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        alert("Không thể lưu đánh giá.");
    }
};

// --- 5. LOGIC HIỂN THỊ BIỂU ĐỒ (DỮ LIỆU TỪ FIRESTORE) ---
async function loadReportData(email) {
    // Lấy tất cả sự kiện của user từ Firestore để tính toán cho biểu đồ
    const q = query(collection(db, "events"), where("userEmail", "==", email));
    const querySnapshot = await getDocs(q);
    
    let events = [];
    querySnapshot.forEach(doc => events.push(doc.data()));

    // Gọi hàm vẽ biểu đồ (Sử dụng Chart.js giống code cũ của bạn)
    // renderCharts(events); 
    console.log("Đã tải " + events.length + " sự kiện để làm báo cáo.");
}