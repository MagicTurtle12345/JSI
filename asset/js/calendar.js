// calendar.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, updateDoc, deleteDoc, 
    doc, query, where, onSnapshot 
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

// --- 2. BIẾN TOÀN CỤC ---
let currentWeekOffset = 0;
let currentEditingEvent = null;
let userEvents = [];
const COLLECTION_NAME = "events";

const CATEGORY_COLORS = {
    meeting: "#ef4444",
    work: "#3b82f6",
    personal: "#22c55e",
    study: "#f59e0b",
    play: "#a855f7",
    appointment: "#ec4899"
};

// --- 3. KHỞI CHẠY & THEO DÕI ĐĂNG NHẬP ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Load tên user lên UI nếu có element
        const userLink = document.getElementById("userLink");
        if (userLink) userLink.textContent = user.email.split('@')[0];
        
        // Bắt đầu lắng nghe dữ liệu từ Firestore
        listenToEvents(user.email);
    } else {
        // Chưa đăng nhập thì đá về trang login
        window.location.href = "login.html";
    }
});

// --- 4. LOGIC FIREBASE (REAL-TIME) ---
function listenToEvents(email) {
    const q = query(collection(db, COLLECTION_NAME), where("userEmail", "==", email));
    
    onSnapshot(q, (snapshot) => {
        userEvents = [];
        snapshot.forEach((doc) => {
            userEvents.push({ id: doc.id, ...doc.data() });
        });
        renderCalendar();
    });
}

// --- 5. LOGIC HIỂN THỊ LỊCH (RENDER) ---
function renderCalendar() {
    const weekDates = getWeekDates(currentWeekOffset);
    const grid = document.getElementById("calendarGrid");
    const currentMonthYear = document.getElementById("currentMonthYear");
    
    if (!grid) return;
    
    // Hiển thị Tháng/Năm trên header
    const firstDay = weekDates[0];
    currentMonthYear.textContent = `Tháng ${firstDay.getMonth() + 1}, ${firstDay.getFullYear()}`;

    // Xóa grid cũ (chỉ giữ lại cột thời gian nếu có)
    grid.innerHTML = '<div class="time-column"></div>';
    
    // Render 7 cột ngày
    weekDates.forEach((date) => {
        const isToday = date.toDateString() === new Date().toDateString();
        const dayCol = document.createElement("div");
        dayCol.className = `calendar-day ${isToday ? "today" : ""}`;
        
        dayCol.innerHTML = `
            <div class="day-header">
                <div class="day-name">${formatDate(date).split(' ')[0]}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
            <div class="day-events" data-date="${date.toISOString().split('T')[0]}"></div>
        `;
        grid.appendChild(dayCol);
    });

    // Render sự kiện vào các cột
    const activeCategories = Array.from(document.querySelectorAll(".category-item input:checked"))
                                  .map(cb => cb.dataset.category);

    userEvents.forEach(event => {
        if (!activeCategories.includes(event.category)) return;

        const targetCol = grid.querySelector(`[data-date="${event.date}"]`);
        if (targetCol) {
            const eventEl = document.createElement("div");
            eventEl.className = "event-item";
            eventEl.style.borderLeft = `4px solid ${CATEGORY_COLORS[event.category]}`;
            eventEl.style.background = `${CATEGORY_COLORS[event.category]}20`; // Thêm độ trong suốt
            eventEl.innerHTML = `
                <div class="event-time">${event.startTime} - ${event.endTime}</div>
                <div class="event-title">${event.title}</div>
            `;
            eventEl.onclick = () => openEditModal(event);
            targetCol.appendChild(eventEl);
        }
    });
}

// --- 6. XỬ LÝ SỰ KIỆN (FORM) ---
const eventForm = document.getElementById("eventForm");
if (eventForm) {
    eventForm.onsubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;

        const eventData = {
            title: document.getElementById("eventTitle").value,
            date: document.getElementById("eventDate").value,
            startTime: document.getElementById("eventStart").value,
            endTime: document.getElementById("eventEnd").value,
            category: document.getElementById("eventCategory").value,
            description: document.getElementById("eventDescription").value,
            userEmail: user.email
        };

        try {
            if (currentEditingEvent) {
                const docRef = doc(db, COLLECTION_NAME, currentEditingEvent.id);
                await updateDoc(docRef, eventData);
            } else {
                await addDoc(collection(db, COLLECTION_NAME), eventData);
            }
            closeModal();
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    };
}

// --- 7. ĐIỀU HƯỚNG & MODAL ---
window.openCreateModal = () => {
    currentEditingEvent = null;
    eventForm.reset();
    document.getElementById("modalTitle").textContent = "Tạo sự kiện mới";
    document.getElementById("deleteEventBtn").style.display = "none";
    document.getElementById("eventModal").style.display = "block";
};

function openEditModal(event) {
    currentEditingEvent = event;
    document.getElementById("modalTitle").textContent = "Chỉnh sửa sự kiện";
    document.getElementById("eventTitle").value = event.title;
    document.getElementById("eventDate").value = event.date;
    document.getElementById("eventStart").value = event.startTime;
    document.getElementById("eventEnd").value = event.endTime;
    document.getElementById("eventCategory").value = event.category;
    document.getElementById("eventDescription").value = event.description || "";
    
    document.getElementById("deleteEventBtn").style.display = "block";
    document.getElementById("eventModal").style.display = "block";
}

window.closeModal = () => {
    document.getElementById("eventModal").style.display = "none";
};

window.deleteEvent = async () => {
    if (currentEditingEvent && confirm("Xóa sự kiện này?")) {
        await deleteDoc(doc(db, COLLECTION_NAME, currentEditingEvent.id));
        closeModal();
    }
};

// --- 8. HELPER FUNCTIONS ---
function getWeekDates(offset) {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
    const monday = new Date(today.setDate(diff));
    
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function formatDate(date) {
    const options = { weekday: 'short', day: '2-digit', month: '2-digit' };
    return date.toLocaleDateString('vi-VN', options);
}

// --- 9. EVENT LISTENERS CHO UI ---
document.getElementById("prevWeek")?.addEventListener("click", () => {
    currentWeekOffset--;
    renderCalendar();
});

document.getElementById("nextWeek")?.addEventListener("click", () => {
    currentWeekOffset++;
    renderCalendar();
});

document.getElementById("todayBtn")?.addEventListener("click", () => {
    currentWeekOffset = 0;
    renderCalendar();
});

document.getElementById("createEventBtn")?.addEventListener("click", window.openCreateModal);

document.querySelectorAll(".category-item input").forEach(input => {
    input.onchange = renderCalendar;
});

// Logout function
window.logout = () => {
    auth.signOut().then(() => window.location.href = "login.html");
};