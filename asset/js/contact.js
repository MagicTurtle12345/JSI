// Handle contact form submission
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const name = document.getElementById("contactName").value
  const email = document.getElementById("contactEmail").value
  const phone = document.getElementById("contactPhone").value
  const subject = document.getElementById("contactSubject").value
  const message = document.getElementById("contactMessage").value

  // Validate
  if (!name || !email || !subject || !message) {
    showError("contactError", "Vui lòng điền đầy đủ thông tin bắt buộc!")
    return
  }

  // Store message
  const messages = JSON.parse(localStorage.getItem("myCalendar_messages") || "[]")
  messages.push({
    id: Date.now().toString(),
    name,
    email,
    phone,
    subject,
    message,
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem("myCalendar_messages", JSON.stringify(messages))

  // Show success
  const successEl = document.getElementById("contactSuccess")
  successEl.textContent = "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất."
  successEl.classList.add("show")

  // Clear error
  document.getElementById("contactError").classList.remove("show")

  // Reset form
  document.getElementById("contactForm").reset()

  // Hide success message after 5 seconds
  setTimeout(() => {
    successEl.classList.remove("show")
  }, 5000)
})

function showError(elementId, message) {
  const errorEl = document.getElementById(elementId)
  errorEl.textContent = message
  errorEl.classList.add("show")
  setTimeout(() => {
    errorEl.classList.remove("show")
  }, 5000)
}

// Update navbar based on auth status
const authLinks = document.getElementById("authLinks")
const currentUser = window.getCurrentUser() // Assuming getCurrentUser is a global function

if (currentUser) {
  authLinks.innerHTML = `
    <a href="calendar.html">Lịch của tôi</a>
    <a href="user.html">
      <img src="${currentUser.avatar}" alt="Avatar" class="user-avatar">
    </a>
  `
}
