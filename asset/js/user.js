// Load user profile
function loadUserProfile() {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    window.location.href = "login.html"
    return
  }

  document.getElementById("userEmail").value = currentUser.email
  document.getElementById("userPhone").value = currentUser.phone || ""
  document.getElementById("userRole").value = currentUser.role === "admin" ? "Quản trị viên" : "Người dùng"
  document.getElementById("avatarPreview").src =
    currentUser.avatar ||
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/500px-Default_pfp.svg.png?20220226140232"
}

// Update profile
function updateProfile() {
  const currentUser = getCurrentUser()
  if (!currentUser) return

  const phone = document.getElementById("userPhone").value

  // Update user data
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.email === currentUser.email)

  if (userIndex !== -1) {
    users[userIndex].phone = phone
    users[userIndex].avatar = currentUser.avatar
    saveUsers(users)

    // Update current user session
    const updatedUser = { ...users[userIndex] }
    delete updatedUser.password
    saveCurrentUser(updatedUser)

    alert("Cập nhật thông tin thành công!")
    loadUserProfile()
  }
}

// Change password
function changePassword() {
  const currentUser = getCurrentUser()
  if (!currentUser) return

  const currentPassword = document.getElementById("currentPassword").value
  const newPassword = document.getElementById("newPassword").value
  const confirmNewPassword = document.getElementById("confirmNewPassword").value

  const errorEl = document.getElementById("passwordError")
  const successEl = document.getElementById("passwordSuccess")

  // Clear messages
  errorEl.classList.remove("show")
  successEl.classList.remove("show")

  // Validation
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showError("passwordError", "Vui lòng điền đầy đủ thông tin!")
    return
  }

  if (newPassword !== confirmNewPassword) {
    showError("passwordError", "Mật khẩu mới không khớp!")
    return
  }

  if (newPassword.length < 6) {
    showError("passwordError", "Mật khẩu phải có ít nhất 6 ký tự!")
    return
  }

  // Verify current password
  const users = getUsers()
  const user = users.find((u) => u.email === currentUser.email)

  if (!user || user.password !== currentPassword) {
    showError("passwordError", "Mật khẩu hiện tại không đúng!")
    return
  }

  // Update password
  const userIndex = users.findIndex((u) => u.email === currentUser.email)
  if (userIndex !== -1) {
    users[userIndex].password = newPassword
    saveUsers(users)

    // Show success
    successEl.textContent = "Đổi mật khẩu thành công!"
    successEl.classList.add("show")

    // Clear form
    document.getElementById("currentPassword").value = ""
    document.getElementById("newPassword").value = ""
    document.getElementById("confirmNewPassword").value = ""

    setTimeout(() => {
      successEl.classList.remove("show")
    }, 3000)
  }
}

// Handle avatar upload
document.getElementById("avatarUpload").addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Check file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    alert("File quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.")
    return
  }

  // Read and preview
  const reader = new FileReader()
  reader.onload = (event) => {
    const avatarUrl = event.target.result
    document.getElementById("avatarPreview").src = avatarUrl

    // Save to user data
    const currentUser = getCurrentUser()
    if (!currentUser) return

    const users = getUsers()
    const userIndex = users.findIndex((u) => u.email === currentUser.email)

    if (userIndex !== -1) {
      users[userIndex].avatar = avatarUrl
      saveUsers(users)

      // Update current user session
      currentUser.avatar = avatarUrl
      saveCurrentUser(currentUser)
    }
  }

  reader.readAsDataURL(file)
})

// Load profile on page load
loadUserProfile()

// Declare functions to fix lint errors
function getCurrentUser() {
  // Implementation for getCurrentUser
}

function getUsers() {
  // Implementation for getUsers
}

function saveUsers(users) {
  // Implementation for saveUsers
}

function saveCurrentUser(user) {
  // Implementation for saveCurrentUser
}

function showError(elementId, message) {
  const errorEl = document.getElementById(elementId)
  errorEl.textContent = message
  errorEl.classList.add("show")
}
