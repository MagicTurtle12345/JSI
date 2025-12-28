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

let currentWeekOffset = 0;
let userEvents = [];
let currentEditingEvent = null;

const CATEGORY_COLORS = {
    meeting: "#ef4444", work: "#3b82f6", personal: "#22c55e",
    study: "#f59e0b", play: "#a855f7", appointment: "#ec4899"
};

// --- QUẢN LÝ TRẠNG THÁI ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if(document.getElementById("userLink")) 
            document.getElementById("userLink").textContent = user.email.split('@')[0];
        listenToEvents(user.email);
    } else {
        window.location.href = "login.html";
    }
});

function listenToEvents(email) {
    const q = query(collection(db, "events"), where("userEmail", "==", email));
    onSnapshot(q, (snapshot) => {
        userEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCalendar();
    });
}

// --- HÀM VẼ GRID (Sửa lỗi mất Grid) ---
function renderCalendar() {
    const calendarGrid = document.getElementById("calendarGrid");
    if (!calendarGrid) return;

    const weekDates = getWeekDates(currentWeekOffset);
    const headerTitle = document.getElementById("currentMonthYear");
    if (headerTitle) {
        headerTitle.textContent = `Tháng ${weekDates[0].getMonth() + 1}, ${weekDates[0].getFullYear()}`;
    }

    // Làm sạch Grid
    calendarGrid.innerHTML = '';

    // Lấy filter
    const activeCategories = Array.from(document.querySelectorAll(".category-item input:checked"))
                                  .map(cb => cb.dataset.category);

    weekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === new Date().toDateString();
        
        // TẠO CỘT NGÀY (Phải có class calendar-day để CSS Grid nhận diện)
        const dayCol = document.createElement("div");
        dayCol.className = `calendar-day ${isToday ? "today" : ""}`;
        
        dayCol.innerHTML = `
            <div class="day-header">
                <div class="day-name">${date.toLocaleDateString('vi-VN', {weekday: 'short'})}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
            <div class="day-events"></div>
        `;

        const eventsContainer = dayCol.querySelector('.day-events');
        
        // Lọc sự kiện cho ngày này
        const dayEvents = userEvents.filter(ev => ev.date === dateStr && activeCategories.includes(ev.category));

        dayEvents.forEach(event => {
            const evEl = document.createElement("div");
            evEl.className = `event-item`;
            evEl.style.borderLeft = `4px solid ${CATEGORY_COLORS[event.category]}`;
            evEl.style.background = `${CATEGORY_COLORS[event.category]}15`; // Màu nền nhạt
            
            evEl.innerHTML = `
                <div class="event-time">${event.startTime} - ${event.endTime}</div>
                <div class="event-title">${event.title}</div>
            `;
            evEl.onclick = () => openEditModal(event);
            eventsContainer.appendChild(evEl);
        });

        calendarGrid.appendChild(dayCol);
    });
}

// --- XỬ LÝ NÚT BẤM (Gán vào window để HTML gọi được) ---
window.openCreateModal = () => {
    currentEditingEvent = null;
    document.getElementById("eventForm").reset();
    document.getElementById("deleteEventBtn").style.display = "none";
    document.getElementById("eventModal").style.display = "block";
};

window.closeModal = () => {
    document.getElementById("eventModal").style.display = "none";
};

window.handleDeleteEvent = async () => {
    if (currentEditingEvent && confirm("Bạn có chắc chắn muốn xóa?")) {
        await deleteDoc(doc(db, "events", currentEditingEvent.id));
        window.closeModal();
    }
};

function openEditModal(event) {
    currentEditingEvent = event;
    document.getElementById("eventTitle").value = event.title;
    document.getElementById("eventDate").value = event.date;
    document.getElementById("eventStart").value = event.startTime;
    document.getElementById("eventEnd").value = event.endTime;
    document.getElementById("eventCategory").value = event.category;
    document.getElementById("deleteEventBtn").style.display = "block";
    document.getElementById("eventModal").style.display = "block";
}

// Lắng nghe sự kiện Submit
document.getElementById("eventForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("eventTitle").value,
        date: document.getElementById("eventDate").value,
        startTime: document.getElementById("eventStart").value,
        endTime: document.getElementById("eventEnd").value,
        category: document.getElementById("eventCategory").value,
        userEmail: auth.currentUser.email
    };

    if (currentEditingEvent) {
        await updateDoc(doc(db, "events", currentEditingEvent.id), data);
    } else {
        await addDoc(collection(db, "events"), data);
    }
    window.closeModal();
};

// Điều hướng
document.getElementById("prevWeek").onclick = () => { currentWeekOffset--; renderCalendar(); };
document.getElementById("nextWeek").onclick = () => { currentWeekOffset++; renderCalendar(); };
document.getElementById("todayBtn").onclick = () => { currentWeekOffset = 0; renderCalendar(); };
document.getElementById("createEventBtn").onclick = window.openCreateModal;

// Lắng nghe filter
document.querySelectorAll(".category-item input").forEach(input => {
    input.onchange = renderCalendar;
});

function getWeekDates(offset) {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1 + (offset * 7)));
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });
}