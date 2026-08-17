// Initialize Lucide icons
lucide.createIcons();

// State management
let applications = JSON.parse(localStorage.getItem('jobApplications')) || [];
let editingId = null;

// DOM Elements
const addBtn = document.getElementById('add-new-btn');
const modalOverlay = document.getElementById('app-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('application-form');
const modalTitle = document.getElementById('modal-title');
const tableBody = document.getElementById('applications-body');
const emptyState = document.getElementById('empty-state');
const applicationsTable = document.getElementById('applications-table');

// Filtering DOM
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');

// Stats DOM
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statInterview = document.getElementById('stat-interview');
const statAccepted = document.getElementById('stat-accepted');
const statRejected = document.getElementById('stat-rejected');

// Events
addBtn.addEventListener('click', openModalForAdd);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
form.addEventListener('submit', handleFormSubmit);

searchInput.addEventListener('input', renderApplications);
statusFilter.addEventListener('change', renderApplications);

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
}

function saveApplications() {
  localStorage.setItem('jobApplications', JSON.stringify(applications));
  renderDashboard();
}

function openModalForAdd() {
  editingId = null;
  modalTitle.textContent = 'Add Application';
  form.reset();
  // Set default date to today
  document.getElementById('date-applied').valueAsDate = new Date();
  modalOverlay.classList.remove('hidden');
}

function openModalForEdit(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  
  editingId = id;
  modalTitle.textContent = 'Edit Application';
  
  document.getElementById('company-name').value = app.company;
  document.getElementById('job-title').value = app.title;
  document.getElementById('date-applied').value = app.date;
  document.getElementById('status').value = app.status;
  document.getElementById('app-link').value = app.link || '';
  document.getElementById('notes').value = app.notes || '';
  
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  form.reset();
  editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const company = document.getElementById('company-name').value.trim();
  const title = document.getElementById('job-title').value.trim();
  const date = document.getElementById('date-applied').value;
  const status = document.getElementById('status').value;
  const link = document.getElementById('app-link').value.trim();
  const notes = document.getElementById('notes').value.trim();
  
  const newApp = {
    id: editingId || generateId(),
    company,
    title,
    date,
    status,
    link,
    notes,
    timestamp: editingId ? applications.find(a => a.id === editingId).timestamp : Date.now()
  };
  
  if (editingId) {
    applications = applications.map(a => a.id === editingId ? newApp : a);
  } else {
    applications.push(newApp);
  }
  
  saveApplications();
  closeModal();
}

function deleteApplication(id) {
  if (confirm('Are you sure you want to delete this job application?')) {
    applications = applications.filter(a => a.id !== id);
    saveApplications();
  }
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function renderDashboard() {
  updateStats();
  renderApplications();
}

function updateStats() {
  statTotal.textContent = applications.length;
  statPending.textContent = applications.filter(a => a.status === 'Pending').length;
  statInterview.textContent = applications.filter(a => a.status === 'Interview').length;
  statAccepted.textContent = applications.filter(a => a.status === 'Accepted').length;
  statRejected.textContent = applications.filter(a => a.status === 'Rejected').length;
}

function renderApplications() {
  const query = searchInput.value.toLowerCase();
  const filter = statusFilter.value;
  
  let filtered = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(query) || app.title.toLowerCase().includes(query);
    const matchesFilter = filter === 'All' || app.status === filter;
    return matchesSearch && matchesFilter;
  });
  
  // Sort by most recently added by default (timestamp desc)
  filtered.sort((a, b) => b.timestamp - a.timestamp);
  
  tableBody.innerHTML = '';
  
  if (filtered.length === 0) {
    applicationsTable.parentElement.classList.add('hide-table');
    applicationsTable.style.display = 'none';
    emptyState.classList.remove('hidden');
  } else {
    applicationsTable.style.display = 'table';
    emptyState.classList.add('hidden');
    
    filtered.forEach(app => {
      const tr = document.createElement('tr');
      
      const badgeClass = app.status.toLowerCase();
      
      const titleHTML = app.link ? `<a href="${app.link}" target="_blank" style="color:var(--primary); text-decoration:none;">${app.title} <i data-lucide="external-link" style="width:12px;height:12px"></i></a>` : app.title;
      
      tr.innerHTML = `
        <td class="company-cell">${app.company}</td>
        <td>${titleHTML}</td>
        <td>${formatDate(app.date)}</td>
        <td><span class="badge ${badgeClass}">${app.status}</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn edit-btn" title="Edit" onclick="openModalForEdit('${app.id}')">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="icon-btn delete-btn" title="Delete" onclick="deleteApplication('${app.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    
    // Re-initialize icons for dynamically added elements
    lucide.createIcons();
  }
}

// Initial Render
renderDashboard();
