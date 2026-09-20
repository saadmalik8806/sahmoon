// ========================================
// WEDDING INVITATION WEBSITE - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeSealButton();
    initializeVolumeControl();
    initializeCountdown();
    initializeFormSubmit();
});

// ========================================
// SEAL BUTTON & HERO VIDEO
// ========================================

function initializeSealButton() {
    const sealButton = document.getElementById('sealButton');
    const heroVideo = document.getElementById('heroVideo');
    const heroTextContainer = document.getElementById('heroTextContainer');

    if (sealButton && heroVideo) {
        sealButton.addEventListener('click', () => {
            // Hide seal button
            sealButton.style.display = 'none';
            
            // Play video
            heroVideo.play().catch(error => {
                console.log('Video autoplay prevented:', error);
            });

            // Fade in hero text after delay
            setTimeout(() => {
                if (heroTextContainer) {
                    heroTextContainer.classList.add('visible');
                }
            }, 2500);
        });
    }
}

// ========================================
// TAP TO OPEN BUTTON
// ========================================

function initializeTapToOpen() {
    const tapBtn = document.getElementById('tapToOpenBtn');
    const mainContent = document.getElementById('mainContent');
    const video = document.getElementById('backgroundVideo');
    const music = document.getElementById('backgroundMusic');

    if (tapBtn) {
        tapBtn.addEventListener('click', () => {
            // Fade out and remove the tap button
            tapBtn.classList.add('hidden');

            // Start playing the video
            if (video) {
                video.play().catch(error => {
                    console.log('Video autoplay prevented:', error);
                });
            }

            // Small delay to let user see the envelope animation
            setTimeout(() => {
                // Fade in main content
                if (mainContent) {
                    mainContent.classList.remove('hidden');
                }
            }, 800);
        });
    }
}

// ========================================
// VOLUME CONTROL (MUSIC)
// ========================================

function initializeVolumeControl() {
    const volumeBtn = document.getElementById('volumeBtn');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const volumeOnIcon = document.querySelector('.volume-icon-on');
    const volumeOffIcon = document.querySelector('.volume-icon-mute');

    let isMuted = true;

    if (volumeBtn && backgroundMusic) {
        volumeBtn.addEventListener('click', () => {
            isMuted = !isMuted;

            if (isMuted) {
                // Mute the music
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                if (volumeOnIcon) volumeOnIcon.style.display = 'block';
                if (volumeOffIcon) volumeOffIcon.style.display = 'none';
            } else {
                // Play the music
                backgroundMusic.play().catch(error => {
                    console.log('Audio autoplay prevented:', error);
                });
                if (volumeOnIcon) volumeOnIcon.style.display = 'none';
                if (volumeOffIcon) volumeOffIcon.style.display = 'block';
            }
        });
    }
}

// ========================================
// COUNTDOWN TIMER
// ========================================

function initializeCountdown() {
    // Target date: June 30, 2026 at 10:30 AM
    const targetDate = new Date('June 30, 2026 10:30:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update DOM
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

        // If countdown is finished
        if (distance < 0) {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
        }
    }

    // Update immediately
    updateCountdown();

    // Update every second
    setInterval(updateCountdown, 1000);
}

// ========================================
// RSVP FORM SUBMISSION
// ========================================

function initializeFormSubmit() {
    const form = document.getElementById('rsvpForm');
    const successMessage = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const attendance = document.getElementById('attendance').value;
            const message = document.getElementById('message').value;

            // Validate
            if (!name || !email || !attendance) {
                alert('Please fill in all required fields');
                return;
            }

            // Log the data (in a real app, this would be sent to a server)
            console.log('RSVP Data:', {
                name,
                email,
                attendance,
                message,
                timestamp: new Date().toISOString()
            });

            // Show success message
            form.reset();
            if (successMessage) {
                successMessage.classList.remove('hidden');
                setTimeout(() => {
                    if (successMessage) {
                        successMessage.classList.add('hidden');
                    }
                }, 4000);
            }
        });
    }
}

// ========================================
// SCROLL ANIMATIONS
// ========================================

// Optional: Add scroll animation triggers
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 1s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections for scroll animations
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    observer.observe(section);
});
