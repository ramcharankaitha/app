// Password visibility toggle
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('password');
const passwordIcon = passwordToggle.querySelector('i');

passwordToggle.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.remove('fa-eye-slash');
        passwordIcon.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.remove('fa-eye');
        passwordIcon.classList.add('fa-eye-slash');
    }
});

// Form submission
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const remember = document.getElementById('remember').checked;
    
    // Here you would typically send this data to your backend
    console.log('Login attempt:', {
        email,
        password,
        role,
        remember
    });
    
    // Simulate login process
    const signInBtn = document.querySelector('.signin-btn');
    const originalText = signInBtn.textContent;
    signInBtn.textContent = 'Signing in...';
    signInBtn.disabled = true;
    
    setTimeout(() => {
        signInBtn.textContent = originalText;
        signInBtn.disabled = false;
        alert('Login functionality will be connected to your backend API');
    }, 1500);
});

// Google Sign In
const googleBtn = document.querySelector('.google-btn');

googleBtn.addEventListener('click', function() {
    console.log('Google sign in clicked');
    // Here you would integrate with Google OAuth
    alert('Google sign in will be integrated with OAuth');
});

// Back button functionality
const backBtn = document.querySelector('.back-btn');

backBtn.addEventListener('click', function() {
    // Navigate back or close modal
    if (window.history.length > 1) {
        window.history.back();
    } else {
        console.log('Back button clicked');
    }
});

// Toggle switch functionality (if needed)
const toggleSwitch = document.querySelector('.toggle-switch');

toggleSwitch.addEventListener('click', function() {
    const slider = this.querySelector('.toggle-slider');
    if (slider.style.right === '3px') {
        slider.style.right = 'auto';
        slider.style.left = '3px';
        this.style.background = '#ccc';
    } else {
        slider.style.right = '3px';
        slider.style.left = 'auto';
        this.style.background = '#dc3545';
    }
});

// Add smooth animations on load
window.addEventListener('load', function() {
    const loginCard = document.querySelector('.login-card');
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        loginCard.style.transition = 'all 0.5s ease';
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 100);
});

