import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCISk54t_1O9IJh9EiV06Jha2G8Rxu2w4c",
  authDomain: "mycalendar-c7e21.firebaseapp.com",
  projectId: "mycalendar-c7e21",
  storageBucket: "mycalendar-c7e21.firebasestorage.app",
  messagingSenderId: "584205292158",
  appId: "1:584205292158:web:7ff34d63dc91f648273e2f",
  measurementId: "G-XXFHVW46DD",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentWeekOffset = 0;
let userEvents = [];
const HOUR_HEIGHT = 50; // Chiều cao mỗi ô giờ (khớp với CSS)
const CATEGORY_COLORS = { meeting: "#ef4444", work: "#3b82f6", personal: "#22c55e", study: "#f59e0b", play: "#a855f7", appointment: "#ec4899" };

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (document.getElementById("userLink")) document.getElementById("userLink").textContent = user.email.split("@")[0];
    listenToEvents(user.email);
  } else {
    window.location.href = "login.html";
  }
});

function listenToEvents(email) {
  const q = query(collection(db, "events"), where("userEmail", "==", email));
  onSnapshot(q, (snapshot) => {
    userEvents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderCalendar();
  });
}

function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;
  calendarGrid.innerHTML = "";

  const weekDates = getWeekDates(currentWeekOffset);
  const activeCategories = Array.from(document.querySelectorAll(".category-item input:checked")).map((cb) => cb.dataset.category);

  // 1. TẠO CỘT THỜI GIAN (Bên trái)
  const timeCol = document.createElement("div");
  timeCol.className = "time-column";
  timeCol.innerHTML = '<div class="time-header-slot"></div>'; // Ô trống góc trên cùng bên trái
  for (let i = 0; i < 24; i++) {
    timeCol.innerHTML += `<div class="time-slot">${i}:00</div>`;
  }
  calendarGrid.appendChild(timeCol);

  // 2. TẠO 7 CỘT NGÀY
  weekDates.forEach((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const isToday = date.toDateString() === new Date().toDateString();

    const dayCol = document.createElement("div");
    dayCol.className = `calendar-day ${isToday ? "today" : ""}`;
    
    // Header của ngày (Thứ + Ngày)
    let dayHTML = `
        <div class="day-header">
            <div class="day-name">${date.toLocaleDateString("vi-VN", { weekday: "short" })}</div>
            <div class="day-number">${date.getDate()}</div>
        </div>
        <div class="day-events-container">
    `;
    
    // Tạo 24 ô lưới nền
    for (let i = 0; i < 24; i++) {
        dayHTML += `<div class="hour-grid-cell"></div>`;
    }
    dayHTML += `</div>`; // Đóng day-events-container
    dayCol.innerHTML = dayHTML;

    const eventsContainer = dayCol.querySelector(".day-events-container");
    const dayEvents = userEvents.filter((ev) => ev.date === dateStr && activeCategories.includes(ev.category));

    dayEvents.forEach((event) => {
      const evEl = document.createElement("div");
      evEl.className = `event-item`;
      evEl.style.borderLeft = `4px solid ${CATEGORY_COLORS[event.category]}`;
      evEl.style.background = `${CATEGORY_COLORS[event.category]}15`;
      
      // LOGIC TÍNH TOÁN VỊ TRÍ CHÍNH XÁC
      const start = event.startTime.split(':').map(Number);
      const end = event.endTime.split(':').map(Number);

      const startInMinutes = start[0] * 60 + start[1];
      const endInMinutes = end[0] * 60 + end[1];
      const duration = endInMinutes - startInMinutes;

      // Tính vị trí top và height dựa trên HOUR_HEIGHT
      const topPos = (startInMinutes / 60) * HOUR_HEIGHT;
      const heightPos = (duration / 60) * HOUR_HEIGHT;

      evEl.style.top = `${topPos}px`;
      evEl.style.height = `${heightPos}px`;

      evEl.innerHTML = `
                <div class="event-time">${event.startTime} - ${event.endTime}</div>
                <div class="event-title">${event.title}</div>
            `;
      evEl.onclick = (e) => {
          e.stopPropagation();
          openEditModal(event);
      };
      eventsContainer.appendChild(evEl);
    });
    calendarGrid.appendChild(dayCol);
  });
}

// Các hàm xử lý Modal giữ nguyên logic cũ nhưng cập nhật ID khớp với HTML của bạn
let currentEditingEvent = null;

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
  document.getElementById("eventStartTime").value = event.startTime;
  document.getElementById("eventEndTime").value = event.endTime;
  document.getElementById("eventCategory").value = event.category;
  document.getElementById("deleteEventBtn").style.display = "block";
  document.getElementById("eventModal").style.display = "block";
}

document.getElementById("eventForm").onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    title: document.getElementById("eventTitle").value,
    date: document.getElementById("eventDate").value,
    startTime: document.getElementById("eventStartTime").value,
    endTime: document.getElementById("eventEndTime").value,
    category: document.getElementById("eventCategory").value,
    userEmail: auth.currentUser.email,
  };

  if (currentEditingEvent) {
    await updateDoc(doc(db, "events", currentEditingEvent.id), data);
  } else {
    await addDoc(collection(db, "events"), data);
  }
  window.closeModal();
};

document.getElementById("prevWeek").onclick = () => { currentWeekOffset--; renderCalendar(); };
document.getElementById("nextWeek").onclick = () => { currentWeekOffset++; renderCalendar(); };
if (document.getElementById("createEventBtn")) {
    document.getElementById("createEventBtn").onclick = window.openCreateModal;
}

function getWeekDates(offset) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
  const monday = new Date(now.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
// 1. Thêm Event Listener cho ô chọn ngày (đặt trong hàm onAuthStateChanged hoặc setup)
document.getElementById("jumpToDate").addEventListener("change", (e) => {
    const selectedDate = new Date(e.target.value);
    if (!isNaN(selectedDate)) {
        goToDate(selectedDate);
    }
});

// 2. Hàm tính toán lại Offset dựa trên ngày được chọn
function goToDate(targetDate) {
    const now = new Date();
    
    // Tính số mili giây chênh lệch
    const diffInMs = targetDate - now;
    // Chuyển đổi sang số ngày chênh lệch
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    // Tìm ngày đầu tuần của tuần hiện tại và tuần mục tiêu để tính offset chính xác
    const currentMonday = getWeekDates(0)[0];
    const targetMonday = new Date(targetDate);
    const day = targetMonday.getDay();
    const diffToMonday = targetMonday.getDate() - day + (day === 0 ? -6 : 1);
    targetMonday.setDate(diffToMonday);
    targetMonday.setHours(0, 0, 0, 0);
    
    const mondayDiffInMs = targetMonday - currentMonday;
    currentWeekOffset = Math.round(mondayDiffInMs / (1000 * 60 * 60 * 24 * 7));
    
    renderCalendar();
}

// 3. (Tùy chọn) Cập nhật lại nút Today để reset cả ô chọn ngày
const originalTodayBtn = document.getElementById("todayBtn").onclick;
document.getElementById("todayBtn").onclick = () => {
    document.getElementById("jumpToDate").value = ""; // Xóa ngày đã chọn
    currentWeekOffset = 0;
    renderCalendar();
};