// ========================================
// Dr. Nilesh Pawar - Website JavaScript
// ========================================

// API Configuration
const API_BASE = window.location.origin; // Uses current server

// ========================================
// Data Storage (Local Storage - Fallback)
// ========================================
const APPOINTMENTS_KEY = 'dr_nilesh_appointments';
const ADMIN_USERS_KEY = 'dr_nilesh_admin_users';

// Initialize default data
function initializeData() {
    // Initialize appointments if not exists
    if (!localStorage.getItem(APPOINTMENTS_KEY)) {
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
    }
    
    // Initialize admin users if not exists
    if (!localStorage.getItem(ADMIN_USERS_KEY)) {
        const defaultAdmins = [
            { username: 'admin', password: 'doctor123', role: 'super_admin' },
            { username: 'nilesh', password: 'pawar123', role: 'admin' }
        ];
        localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(defaultAdmins));
    }
}

// Get appointments from local storage
function getAppointments() {
    return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
}

// Save appointments to local storage
function saveAppointments(appointments) {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

// Get admin users
function getAdminUsers() {
    return JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]');
}

// Save admin users
function saveAdminUsers(users) {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
}

// ========================================
// API Functions (with localStorage fallback)
// ========================================

// Fetch appointments from API or localStorage
async function fetchAppointments() {
    try {
        const response = await fetch(`${API_BASE}/api/appointments`);
        if (response.ok) {
            const data = await response.json();
            return data.appointments || [];
        }
    } catch (error) {
        console.log('Using local storage (backend not available)');
    }
    return getAppointments();
}

// Book appointment via API or localStorage
async function bookAppointment(appointmentData) {
    try {
        const response = await fetch(`${API_BASE}/api/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.appointment;
        }
    } catch (error) {
        console.log('Using local storage (backend not available)');
    }
    
    // Fallback to localStorage
    const appointments = getAppointments();
    const newAppointment = {
        id: 'APT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        ...appointmentData,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);
    saveAppointments(appointments);
    return newAppointment;
}

// Update appointment status via API or localStorage
async function updateAppointmentStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/api/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) return true;
    } catch (error) {
        console.log('Using local storage (backend not available)');
    }
    
    // Fallback to localStorage
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
        appointments[index].status = newStatus;
        appointments[index].updatedAt = new Date().toISOString();
        saveAppointments(appointments);
        return true;
    }
    return false;
}

// Delete appointment via API or localStorage
async function deleteAppointment(id) {
    try {
        const response = await fetch(`${API_BASE}/api/appointments/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) return true;
    } catch (error) {
        console.log('Using local storage (backend not available)');
    }
    
    // Fallback to localStorage
    const appointments = getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    saveAppointments(filtered);
}

// Admin login via API or localStorage
async function loginAdmin(username, password) {
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            isLoggedIn = true;
            currentAdmin = data.admin;
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('currentAdmin', JSON.stringify(data.admin));
            return true;
        }
    } catch (error) {
        console.log('Using local storage (backend not available)');
    }
    
    // Fallback to localStorage
    const admins = getAdminUsers();
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
        isLoggedIn = true;
        currentAdmin = admin;
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('currentAdmin', JSON.stringify(admin));
        return true;
    }
    return false;
}

// Export to Excel via API or local
async function exportToExcel() {
    try {
        const response = await fetch(`${API_BASE}/api/export`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Dr_Nilesh_Appointments_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            return;
        }
    } catch (error) {
        console.log('Using local export (backend not available)');
    }
    
    // Fallback to local export
    const appointments = getAppointments();
    if (appointments.length === 0) {
        alert('No appointments to export!');
        return;
    }
    
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Message', 'Status', 'Created At'];
    const rows = appointments.map(apt => [
        apt.id,
        apt.name,
        apt.phone,
        apt.email,
        apt.service,
        apt.date,
        apt.timeSlot,
        apt.message || '',
        apt.status,
        new Date(apt.createdAt).toLocaleString()
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Dr_Nilesh_Appointments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Exported ${appointments.length} appointments!`);
}

// Get appointment stats
async function getAppointmentStats() {
    const appointments = await fetchAppointments();
    return {
        total: appointments.length,
        pending: appointments.filter(a => a.status === 'Pending').length,
        confirmed: appointments.filter(a => a.status === 'Confirmed').length,
        completed: appointments.filter(a => a.status === 'Completed').length,
        cancelled: appointments.filter(a => a.status === 'Cancelled').length
    };
}

// Render admin dashboard
async function renderAdminDashboard() {
    const stats = await getAppointmentStats();
    
    document.getElementById('totalAppointments').textContent = stats.total;
    document.getElementById('pendingAppointments').textContent = stats.pending;
    document.getElementById('completedAppointments').textContent = stats.completed;
    document.getElementById('cancelledAppointments').textContent = stats.cancelled;
    
    const appointments = await fetchAppointments();
    renderAppointmentsTable(appointments);
}

// Render appointments table
function renderAppointmentsTable(appointments) {
    if (!appointments || appointments.length === 0) {
        document.getElementById('appointmentsTableBody').innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">No appointments found</td></tr>';
        return;
    }
    
    document.getElementById('appointmentsTableBody').innerHTML = appointments.map(apt => `
        <tr>
            <td><small>${apt.id}</small></td>
            <td><strong>${apt.name}</strong></td>
            <td>${apt.phone}</td>
            <td>${apt.email}</td>
            <td>${apt.service}</td>
            <td>${apt.date}</td>
            <td>${apt.timeSlot}</td>
            <td><span class="status-badge ${apt.status.toLowerCase()}">${apt.status}</span></td>
            <td>
                <div class="action-buttons">
                    ${apt.status === 'Pending' ? `<button class="action-btn confirm" onclick="updateStatus('${apt.id}', 'Confirmed')" title="Confirm"><i class="fas fa-check"></i></button>` : ''}
                    ${apt.status === 'Confirmed' ? `<button class="action-btn complete" onclick="updateStatus('${apt.id}', 'Completed')" title="Complete"><i class="fas fa-check-double"></i></button>` : ''}
                    ${apt.status !== 'Cancelled' && apt.status !== 'Completed' ? `<button class="action-btn cancel" onclick="updateStatus('${apt.id}', 'Cancelled')" title="Cancel"><i class="fas fa-times"></i></button>` : ''}
                    <button class="action-btn delete" onclick="deleteAppointmentById('${apt.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update status
async function updateStatus(id, status) {
    if (confirm(`Mark this appointment as ${status}?`)) {
        await updateAppointmentStatus(id, status);
        renderAdminDashboard();
    }
}

// Delete appointment
async function deleteAppointmentById(id) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        await deleteAppointment(id);
        renderAdminDashboard();
    }
}

// Filter appointments
async function filterAppointments() {
    const status = document.getElementById('filterStatus').value;
    const appointments = await fetchAppointments();
    
    if (status === 'all') {
        renderAppointmentsTable(appointments);
    } else {
        renderAppointmentsTable(appointments.filter(a => a.status === status));
    }
}

// Search appointments
async function searchAppointments() {
    const searchTerm = document.getElementById('searchAppointment').value.toLowerCase();
    const appointments = await fetchAppointments();
    
    if (!searchTerm) {
        renderAppointmentsTable(appointments);
        return;
    }
    
    const filtered = appointments.filter(apt => 
        apt.name.toLowerCase().includes(searchTerm) ||
        apt.phone.includes(searchTerm) ||
        apt.email.toLowerCase().includes(searchTerm) ||
        apt.service.toLowerCase().includes(searchTerm)
    );
    
    renderAppointmentsTable(filtered);
}

// ========================================
// Admin Authentication
// ========================================
let isLoggedIn = false;
let currentAdmin = null;

function showAdminSection() {
    const adminSection = document.getElementById('admin');
    if (adminSection) {
        adminSection.style.display = 'block';
        const offsetTop = adminSection.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function checkAdminSession() {
    const loggedIn = sessionStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
        const admin = JSON.parse(sessionStorage.getItem('currentAdmin'));
        if (admin) {
            isLoggedIn = true;
            currentAdmin = admin;
            return true;
        }
    }
    return false;
}

function logoutAdmin() {
    isLoggedIn = false;
    currentAdmin = null;
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('currentAdmin');
    
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    
    document.getElementById('loginForm').reset();
}

function addAdminUser() {
    const username = prompt('Enter new admin username:');
    if (!username) return;
    
    const password = prompt('Enter password for new admin:');
    if (!password) return;
    
    const admins = getAdminUsers();
    if (admins.find(a => a.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    admins.push({ username, password, role: 'admin' });
    saveAdminUsers(admins);
    alert(`Admin user "${username}" added successfully!`);
}

// ========================================
// Newsletter Subscription
// ========================================
function subscribeNewsletter(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (input && input.value) {
        alert('Thank you for subscribing! You will receive health tips and updates.');
        input.value = '';
    }
}

// ========================================
// Main Initialization
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize data
    initializeData();
    
    // Check admin session
    if (checkAdminSession()) {
        // Admin logged in - navAdmin hidden but accessible via #admin
    }
    
    // ========================================
    // Navbar Scroll Effect
    // ========================================
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ========================================
    // Mobile Menu Toggle
    // ========================================
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            const spans = menuToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && !href.includes('admin')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ========================================
    // Appointment Form Submission
    // ========================================
    const appointmentForm = document.getElementById('appointmentForm');
    
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const date = document.getElementById('appointmentDate').value;
            const service = document.getElementById('service').value;
            const timeSlot = document.getElementById('timeSlot').value;
            const message = document.getElementById('message').value;
            
            if (!name || !phone || !email || !date || !service || !timeSlot) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Book the appointment
            const appointment = bookAppointment({
                name,
                phone,
                email,
                date,
                service,
                timeSlot,
                message
            });
            
            alert(`Thank you, ${name}! Your appointment has been booked!\n\nDetails:\n- Service: ${service}\n- Date: ${date}\n- Time: ${timeSlot}\n- ID: ${appointment.id}\n\nWe will contact you at ${phone} shortly.`);
            
            this.reset();
        });
    }

    // ========================================
    // Admin Login Form
    // ========================================
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            const success = await loginAdmin(username, password);
            if (success) {
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                renderAdminDashboard();
            } else {
                alert('Invalid username or password!');
            }
        });
    }

    // ========================================
    // Check if showing admin section
    // ========================================
    if (window.location.hash === '#admin') {
        showAdminSection();
        if (!isLoggedIn) {
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminDashboard').style.display = 'none';
        } else {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            renderAdminDashboard();
        }
    }

    // ========================================
    // Handle hash changes for Admin navigation
    // ========================================
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#admin') {
            showAdminSection();
            if (!isLoggedIn) {
                document.getElementById('adminLogin').style.display = 'block';
                document.getElementById('adminDashboard').style.display = 'none';
            } else {
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                renderAdminDashboard();
            }
        }
    });

    // ========================================
    // Scroll Animations
    // ========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.service-card, .testimonial-card, .feature-item, .why-feature, .contact-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Staggered animation delays
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.15}s`;
    });

    // ========================================
    // Parallax Effect
    // ========================================
    const heroShapes = document.querySelectorAll('.hero-shape');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        heroShapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.1;
            shape.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });

    // ========================================
    // Active Navigation Link
    // ========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = sectionId;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    const linkStyle = document.createElement('style');
    linkStyle.textContent = `
        .nav-link.active {
            color: var(--primary) !important;
        }
        .nav-link.active::after {
            width: 100% !important;
        }
    `;
    document.head.appendChild(linkStyle);

    // Console welcome message
    console.log('%c👨‍⚕️ Welcome to Dr. Nilesh Pawar Medical Center', 'font-size: 20px; font-weight: bold; color: #0D9488;');
    console.log('%cYour health is our priority. Book your appointment today!', 'color: #64748B;');
});