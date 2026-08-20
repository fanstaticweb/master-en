// =========================================================================
// GOOGLE SHEETS WEB APP URL
// Paste your deployed Google Apps Script Web App URL below:
// =========================================================================
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxyn6qA4XcsaDt_f0xseWmkuXSth7cZSxSmxk2tStuztWJbW5F7UkNgWvK-3BORYSJw/exec";

// Global state for bookings
let bookingsData = [];
let currentFilter = 'all';
let currentView = 'cards'; // 'cards' or 'list'

// --- PASSWORD AND SESSION MANAGEMENT ---
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("adminAuthenticated") === "true") {
    showAdminInterface();
  } else {
    document.getElementById("loginOverlay").style.display = "flex";
    document.getElementById("adminContent").style.display = "none";
  }
});

function handleLogin(event) {
  event.preventDefault();
  const enteredPassword = document.getElementById("passwordInput").value;
  const errorMsg = document.getElementById("loginError");

  // Compare with ADMIN_PASSWORD defined in admin.html
  if (enteredPassword === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminAuthenticated", "true");
    errorMsg.style.display = "none";
    showAdminInterface();
  } else {
    errorMsg.style.display = "block";
    document.getElementById("passwordInput").value = "";
    document.getElementById("passwordInput").focus();
  }
}

function handleLogout() {
  sessionStorage.removeItem("adminAuthenticated");
  window.location.reload();
}

function showAdminInterface() {
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("adminContent").style.display = "block";

  // Automatic initial sync
  syncData();
}

// --- DATA FETCHING & SYNCHRONIZATION (READ) ---
async function syncData() {
  if (!GOOGLE_SHEETS_URL) {
    showToast("Warning: Google Sheets URL is not configured!", "warning");
    // Load mock data so the UI can be tested without setup
    loadMockData();
    return;
  }

  const syncIcon = document.getElementById("syncIcon");
  const syncBtn = document.getElementById("syncBtn");

  // Turn on spinner animation
  syncIcon.classList.add("spin");
  syncBtn.disabled = true;

  try {
    // Fetch data from the Google Apps Script Web App
    const response = await fetch(GOOGLE_SHEETS_URL);
    if (!response.ok) throw new Error("Network response was not ok.");

    const data = await response.json();

    // Update global array
    bookingsData = Array.isArray(data) ? data : [];

    // Update last sync time
    const now = new Date();
    document.getElementById("lastSyncedTime").innerText = `Last updated: ${now.toLocaleTimeString('en-US')}`;

    // Filter and render
    filterAndRender();
    showToast("Data successfully synced!");

  } catch (error) {
    console.error("Sync error:", error);
    showToast("Error occurred during synchronization!", "danger");
  } finally {
    // Turn off spinner animation
    syncIcon.classList.remove("spin");
    syncBtn.disabled = false;
  }
}

// --- STATUS UPDATE (UPDATE STATUS) ---
async function updateBookingStatus(timestamp, newStatus) {
  if (!GOOGLE_SHEETS_URL) {
    // Local update only if no URL is set
    const booking = bookingsData.find(b => b.timestamp === timestamp);
    if (booking) {
      booking.status = newStatus;
      filterAndRender();
      showToast(`Status updated to: ${newStatus} (Saved locally)`);
    }
    return;
  }

  // Optimistic UI update for immediate user feedback
  const originalBookings = JSON.parse(JSON.stringify(bookingsData));
  const targetBooking = bookingsData.find(b => b.timestamp === timestamp);
  if (targetBooking) {
    targetBooking.status = newStatus;
    filterAndRender();
  }

  try {
    const payload = {
      action: "update",
      timestamp: timestamp,
      status: newStatus
    };

    // Send POST request in no-cors mode to bypass redirect/CORS issues
    await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(payload).toString()
    });

    showToast(`Status updated to: ${newStatus}`);

    // Trigger silent sync in 2 seconds to ensure alignment with the server
    setTimeout(silentSync, 2000);

  } catch (error) {
    console.error("Status update error:", error);
    showToast("Failed to update status!", "danger");
    // Revert to original state on error
    bookingsData = originalBookings;
    filterAndRender();
  }
}

// Silent background synchronization
async function silentSync() {
  if (!GOOGLE_SHEETS_URL) return;
  try {
    const response = await fetch(GOOGLE_SHEETS_URL);
    if (response.ok) {
      const data = await response.json();
      bookingsData = Array.isArray(data) ? data : [];
      filterAndRender();
    }
  } catch (e) {
    console.warn("Background sync error:", e);
  }
}

// --- EDIT BOOKING (EDIT BOOKING) ---
const editDialog = document.getElementById("editDialog");

function openEditModal(timestamp) {
  const booking = bookingsData.find(b => b.timestamp === timestamp);
  if (!booking) return;

  document.getElementById("editTimestamp").value = booking.timestamp;
  document.getElementById("editName").value = booking.fullName || "";
  document.getElementById("editEmail").value = booking.email || "";
  document.getElementById("editPhone").value = booking.phone || "";
  document.getElementById("editRoom").value = booking.room || "Deluxe Ocean Suite";
  document.getElementById("editGuests").value = booking.guests || "2";
  document.getElementById("editCheckIn").value = formatDateForInput(booking.checkIn);
  document.getElementById("editCheckOut").value = formatDateForInput(booking.checkOut);
  document.getElementById("editRequests").value = booking.requests || "";

  editDialog.showModal();
}

function closeEditModal() {
  editDialog.close();
}

async function saveEdit(event) {
  event.preventDefault();

  const timestamp = document.getElementById("editTimestamp").value;
  const updatedData = {
    fullName: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    phone: document.getElementById("editPhone").value,
    room: document.getElementById("editRoom").value,
    guests: document.getElementById("editGuests").value,
    checkIn: document.getElementById("editCheckIn").value,
    checkOut: document.getElementById("editCheckOut").value,
    requests: document.getElementById("editRequests").value
  };

  // Optimistic local update
  const originalBookings = JSON.parse(JSON.stringify(bookingsData));
  const targetBooking = bookingsData.find(b => b.timestamp === timestamp);
  if (targetBooking) {
    Object.assign(targetBooking, updatedData);
    filterAndRender();
  }

  closeEditModal();
  showToast("Saving changes...");

  if (!GOOGLE_SHEETS_URL) {
    showToast("Updated locally (Google Sheet not configured)!");
    return;
  }

  try {
    const payload = {
      action: "update",
      timestamp: timestamp,
      ...updatedData
    };

    // Send to Google Sheets
    await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(payload).toString()
    });

    showToast("Booking details successfully updated in Google Sheets!");

    // Sync with server
    setTimeout(silentSync, 2000);

  } catch (error) {
    console.error("Save edit error:", error);
    showToast("Failed to save changes to the sheet!", "danger");
    // Revert on error
    bookingsData = originalBookings;
    filterAndRender();
  }
}

// --- VIEW SWITCHER ---
function setView(view) {
  currentView = view;
  
  const cardsBtn = document.getElementById("view-cards-btn");
  const listBtn = document.getElementById("view-list-btn");
  const listContainer = document.getElementById("bookingsList");

  if (view === 'list') {
    listBtn.classList.add("active");
    cardsBtn.classList.remove("active");
    listContainer.classList.add("list-mode");
  } else {
    cardsBtn.classList.add("active");
    listBtn.classList.remove("active");
    listContainer.classList.remove("list-mode");
  }

  filterAndRender();
}

// --- FILTER & RENDER ---
function setFilter(filter) {
  currentFilter = filter;

  // Update active button styling
  document.querySelectorAll(".filter-btn").forEach(btn => {
    if (btn.getAttribute("data-filter") === filter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  filterAndRender();
}

function filterAndRender() {
  const searchVal = document.getElementById("searchInput").value.toLowerCase().trim();
  const listContainer = document.getElementById("bookingsList");

  // Filter by status
  let filtered = bookingsData;
  if (currentFilter !== 'all') {
    filtered = bookingsData.filter(b => b.status.toLowerCase() === currentFilter);
  }

  // Filter by search query (Name, email, or room)
  if (searchVal) {
    filtered = filtered.filter(b =>
      (b.fullName && b.fullName.toLowerCase().includes(searchVal)) ||
      (b.email && b.email.toLowerCase().includes(searchVal)) ||
      (b.room && b.room.toLowerCase().includes(searchVal))
    );
  }

  // Update counters
  updateFilterCounts();

  // Render list
  listContainer.innerHTML = "";

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>No bookings found matching the criteria.</p>
      </div>
    `;
    return;
  }

  // Sort bookings by timestamp descending (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  filtered.forEach(booking => {
    const statusClass = booking.status.toLowerCase();

    if (currentView === 'list') {
      const row = document.createElement("div");
      row.className = "booking-list-row";
      
      row.innerHTML = `
        <div class="booking-list-row-status-bar ${statusClass}"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <span class="status-badge ${statusClass}" style="padding: 2px 6px; font-size: 10px;">${escapeHtml(booking.status)}</span>
          <div>
            <div style="font-weight: 600; color: var(--primary);">${escapeHtml(booking.fullName)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(booking.room)} (${escapeHtml(booking.guests)} G)</div>
          </div>
        </div>
        
        <div class="booking-list-row-center">
          ${formatDisplayDate(booking.checkIn)} &rarr; ${formatDisplayDate(booking.checkOut)}
        </div>
        
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          ${renderActionButtons(booking)}
          <button class="btn-action" onclick="openEmailModal('${booking.timestamp}')" style="padding: 6px 10px; flex: unset; min-width: unset; border-color: var(--accent); color: var(--accent); display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Email
          </button>
          <button class="btn-action btn-action-edit" onclick="openEditModal('${booking.timestamp}')" style="padding: 6px 10px; flex: unset; min-width: unset;">
            Edit
          </button>
        </div>
      `;
      listContainer.appendChild(row);
    } else {
      const card = document.createElement("div");
      card.className = "booking-card";
      
      card.innerHTML = `
        <div class="card-status-bar ${statusClass}"></div>
        
        <div class="card-header">
          <div class="client-name">${escapeHtml(booking.fullName)}</div>
          <div class="status-badge ${statusClass}">${escapeHtml(booking.status)}</div>
        </div>
        
        <div class="card-details">
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <div class="detail-label">Email:</div>
            <div class="detail-value"><a href="mailto:${escapeHtml(booking.email)}" style="color: inherit;">${escapeHtml(booking.email)}</a></div>
          </div>
          
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <div class="detail-label">Phone:</div>
            <div class="detail-value"><a href="tel:${escapeHtml(booking.phone)}" style="color: inherit;">${escapeHtml(booking.phone)}</a></div>
          </div>
  
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            <div class="detail-label">Room:</div>
            <div class="detail-value">${escapeHtml(booking.room)}</div>
          </div>
  
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <div class="detail-label">Dates:</div>
            <div class="detail-value">${formatDisplayDate(booking.checkIn)} &rarr; ${formatDisplayDate(booking.checkOut)}</div>
          </div>
  
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <div class="detail-label">Guests:</div>
            <div class="detail-value">${escapeHtml(booking.guests)}</div>
          </div>
  
          ${booking.requests ? `
            <div class="special-requests-box">
              <strong>Requests:</strong> ${escapeHtml(booking.requests)}
            </div>
          ` : ''}
  
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">
            Submitted: ${new Date(booking.timestamp).toLocaleString('en-US')}
          </div>
        </div>
        
        <div class="card-actions">
          ${renderActionButtons(booking)}
          <button class="btn-action" onclick="openEmailModal('${booking.timestamp}')" style="border-color: var(--accent); color: var(--accent); display: flex; align-items: center; gap: 4px; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Email
          </button>
          <button class="btn-action btn-action-edit" onclick="openEditModal('${booking.timestamp}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Edit
          </button>
        </div>
      `;
      listContainer.appendChild(card);
    }
  });
}

function renderActionButtons(booking) {
  const currentStatus = booking.status.toLowerCase();

  if (currentStatus === 'pending') {
    return `
      <button class="btn-action btn-action-approve" onclick="updateBookingStatus('${booking.timestamp}', 'Approved')">
        Approve
      </button>
      <button class="btn-action btn-action-reject" onclick="updateBookingStatus('${booking.timestamp}', 'Rejected')">
        Reject
      </button>
    `;
  } else if (currentStatus === 'approved') {
    return `
      <button class="btn-action btn-action-pending" onclick="updateBookingStatus('${booking.timestamp}', 'Pending')">
        Reset
      </button>
      <button class="btn-action btn-action-reject" onclick="updateBookingStatus('${booking.timestamp}', 'Rejected')">
        Reject
      </button>
    `;
  } else {
    // rejected
    return `
      <button class="btn-action btn-action-approve" onclick="updateBookingStatus('${booking.timestamp}', 'Approved')">
        Approve
      </button>
      <button class="btn-action btn-action-pending" onclick="updateBookingStatus('${booking.timestamp}', 'Pending')">
        Reset
      </button>
    `;
  }
}

function updateFilterCounts() {
  const allCount = bookingsData.length;
  const pendingCount = bookingsData.filter(b => b.status.toLowerCase() === 'pending').length;
  const approvedCount = bookingsData.filter(b => b.status.toLowerCase() === 'approved').length;
  const rejectedCount = bookingsData.filter(b => b.status.toLowerCase() === 'rejected').length;

  document.getElementById("count-all").innerText = allCount;
  document.getElementById("count-pending").innerText = pendingCount;
  document.getElementById("count-approved").innerText = approvedCount;
  document.getElementById("count-rejected").innerText = rejectedCount;
}

// --- UTILS ---
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMessage");

  toastMsg.innerText = message;

  if (type === "danger") {
    toast.style.backgroundColor = "var(--danger)";
  } else if (type === "warning") {
    toast.style.backgroundColor = "var(--warning)";
  } else {
    toast.style.backgroundColor = "var(--primary)";
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const year = date.getFullYear();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Mock data for local testing
function loadMockData() {
  bookingsData = [
    {
      timestamp: "2026-08-20T12:00:00.000Z",
      fullName: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      room: "Deluxe Ocean Suite",
      checkIn: "2026-09-10",
      checkOut: "2026-09-15",
      guests: "2",
      requests: "We would like extra towels and, if possible, a sea view.",
      status: "Pending"
    },
    {
      timestamp: "2026-08-19T14:30:00.000Z",
      fullName: "Andrea Grande",
      email: "andrea.g@example.com",
      phone: "+39 320 987 6543",
      room: "Orchard Cottage",
      checkIn: "2026-10-01",
      checkOut: "2026-10-05",
      guests: "1",
      requests: "I would like vegetarian breakfast options.",
      status: "Approved"
    },
    {
      timestamp: "2026-08-18T09:15:00.000Z",
      fullName: "Peter Little",
      email: "peter.little@example.com",
      phone: "+44 7911 123456",
      room: "Timber Loft",
      checkIn: "2026-09-20",
      checkOut: "2026-09-22",
      guests: "4",
      requests: "Late arrival expected (after 10:00 PM).",
      status: "Rejected"
    }
  ];

  document.getElementById("lastSyncedTime").innerText = "Mock data loaded (not synced)";
  filterAndRender();
}

// --- EMAIL DIALOG FUNCTIONS ---
const emailDialog = document.getElementById("emailDialog");

function openEmailModal(timestamp) {
  const booking = bookingsData.find(b => b.timestamp === timestamp);
  if (!booking) return;

  document.getElementById("emailTimestamp").value = booking.timestamp;
  document.getElementById("emailGuestName").value = booking.fullName || "";
  document.getElementById("emailGuestEmail").value = booking.email || "";
  document.getElementById("emailTemplate").value = "confirm";

  updateEmailPreview();
  emailDialog.showModal();
}

function closeEmailModal() {
  emailDialog.close();
}

function updateEmailPreview() {
  const timestamp = document.getElementById("emailTimestamp").value;
  const booking = bookingsData.find(b => b.timestamp === timestamp);
  if (!booking) return;

  const template = document.getElementById("emailTemplate").value;
  const previewBox = document.getElementById("emailPreviewBox");

  const { subject, body } = getEmailContent(template, booking);
  
  previewBox.innerHTML = `<strong>Subject: ${escapeHtml(subject)}</strong><hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border);"><div style="white-space: pre-wrap;">${escapeHtml(body)}</div>`;
}

function getEmailContent(template, booking) {
  const checkInDisp = formatDisplayDate(booking.checkIn);
  const checkOutDisp = formatDisplayDate(booking.checkOut);

  if (template === "confirm") {
    return {
      subject: "Booking Confirmed - The Haven",
      body: `Dear ${booking.fullName},

We are delighted to confirm your reservation at The Haven! Your booking has been approved, and we look forward to welcoming you soon. Below is a summary of your confirmed stay:

• Selected Room: ${booking.room}
• Check-in Date: ${checkInDisp}
• Check-out Date: ${checkOutDisp}
• Total Guests: ${booking.guests}
${booking.requests ? `• Special Requests: ${booking.requests}\n` : ""}
Check-in is available from 3:00 PM, and check-out is by 11:00 AM. If you have any questions or require assistance with airport transfers or local recommendations, please reply directly to this email.

Warm regards,
The Haven Team`
    };
  } else {
    return {
      subject: "Update regarding your booking request - The Haven",
      body: `Dear ${booking.fullName},

Thank you for your interest in staying at The Haven. We have received your booking inquiry for the ${booking.room} from ${checkInDisp} to ${checkOutDisp}.

Unfortunately, due to high demand, the room is not available for the specific dates you selected. We sincerely apologize for any disappointment this may cause.

We would love the opportunity to host you! We politely suggest:
- Adjusting your travel dates by a few days, or
- Checking the availability of our other premium room options.

Please reply directly to this email to coordinate alternative arrangements, and our front desk will be happy to find the perfect solution for your stay.

Warm regards,
The Haven Team`
    };
  }
}

function copyEmailToClipboard() {
  const timestamp = document.getElementById("emailTimestamp").value;
  const booking = bookingsData.find(b => b.timestamp === timestamp);
  if (!booking) return;

  const template = document.getElementById("emailTemplate").value;
  const { subject, body } = getEmailContent(template, booking);
  const combinedText = `Subject: ${subject}\n\n${body}`;

  navigator.clipboard.writeText(combinedText)
    .then(() => {
      showToast("Email text copied to clipboard!");
      closeEmailModal();

      // Update status in sheet
      const newStatus = (template === "confirm") ? "Approved" : "Rejected";
      updateBookingStatus(booking.timestamp, newStatus);
    })
    .catch(err => {
      console.error("Clipboard copy failed: ", err);
      showToast("Failed to copy email text.", "danger");
    });
}

function openMailClient() {
  const timestamp = document.getElementById("emailTimestamp").value;
  const booking = bookingsData.find(b => b.timestamp === timestamp);
  if (!booking) return;

  const template = document.getElementById("emailTemplate").value;
  const { subject, body } = getEmailContent(template, booking);

  const mailtoUrl = `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  closeEmailModal();
  showToast("Opening your email client...");

  // Open the mailto link
  window.location.href = mailtoUrl;

  // Update status in sheet
  const newStatus = (template === "confirm") ? "Approved" : "Rejected";
  updateBookingStatus(booking.timestamp, newStatus);
}
