/* ═══════════════════════════════════════════════════════════════
   CREATURE — A NEW MUSICAL
   Main JavaScript
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
	/* ─────────────────────────────────────────────
     CURSOR GLOW EFFECT
     ───────────────────────────────────────────── */
	// Cursor glow
	const cg = document.getElementById('cursorGlow');
	if (cg) {
		let mx = 0,
			my = 0,
			gx = 0,
			gy = 0;
		let glowVisible = true;

		document.addEventListener('mousemove', (e) => {
			mx = e.clientX;
			my = e.clientY;

			// Hide glow over circus section
			const circusFrame = document.querySelector('.circus-frame');
			if (circusFrame) {
				const rect = circusFrame.getBoundingClientRect();
				const overCircus =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;
				if (overCircus && glowVisible) {
					cg.style.opacity = '0';
					glowVisible = false;
				} else if (!overCircus && !glowVisible) {
					cg.style.opacity = '1';
					glowVisible = true;
				}
			}
		});

		(function animate() {
			gx += (mx - gx) * 0.1;
			gy += (my - gy) * 0.1;
			cg.style.left = gx + 'px';
			cg.style.top = gy + 'px';
			requestAnimationFrame(animate);
		})();
	}

	/* ─────────────────────────────────────────────
     NAVIGATION — Scroll background + shrink
     ───────────────────────────────────────────── */
	const nav = document.getElementById('mainNav');
	if (nav) {
		window.addEventListener('scroll', () => {
			nav.classList.toggle('scrolled', window.scrollY > 80);
		});
	}

	/* ─────────────────────────────────────────────
     MOBILE NAVIGATION TOGGLE
     ───────────────────────────────────────────── */
	const navToggle = document.getElementById('navToggle');
	const navLinks = document.getElementById('navLinks');
	if (navToggle && navLinks) {
		navToggle.addEventListener('click', () => {
			navLinks.classList.toggle('open');
		});
	}

	/* ─────────────────────────────────────────────
     SCROLL REVEAL ANIMATIONS
     ───────────────────────────────────────────── */
	const reveals = document.querySelectorAll('.reveal');
	if (reveals.length > 0) {
		const revealObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{
				threshold: 0.1,
				rootMargin: '0px 0px -50px 0px',
			},
		);

		reveals.forEach((el) => revealObserver.observe(el));
	}

	/* ─────────────────────────────────────────────
     REVIEWS CAROUSEL
     ───────────────────────────────────────────── */
	const dots = document.querySelectorAll('.review-dot');
	const cards = document.querySelectorAll('.review-card');

	if (dots.length > 0 && cards.length > 0) {
		// Click handler for dots
		dots.forEach((dot) => {
			dot.addEventListener('click', () => {
				const idx = parseInt(dot.dataset.index);
				showReview(idx);
			});
		});

		// Auto-rotate every 6 seconds
		let currentReview = 0;
		setInterval(() => {
			currentReview = (currentReview + 1) % cards.length;
			showReview(currentReview);
		}, 6000);

		function showReview(idx) {
			cards.forEach((c) => (c.style.display = 'none'));
			dots.forEach((d) => d.classList.remove('active'));
			if (cards[idx]) cards[idx].style.display = 'block';
			if (dots[idx]) dots[idx].classList.add('active');
			currentReview = idx;
		}
	}

	/* ─────────────────────────────────────────────
     UNDERWATER PARTICLE SYSTEM
     ───────────────────────────────────────────── */
	const canvas = document.getElementById('particles-canvas');
	if (canvas) {
		const ctx = canvas.getContext('2d');
		let particles = [];

		function resizeCanvas() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		class Particle {
			constructor() {
				this.reset();
			}

			reset() {
				this.x = Math.random() * canvas.width;
				this.y = Math.random() * canvas.height;
				this.size = Math.random() * 2 + 0.5;
				this.speedX = (Math.random() - 0.5) * 0.3;
				this.speedY = (Math.random() - 0.5) * 0.2 - 0.1;
				this.opacity = Math.random() * 0.4 + 0.1;
				this.pulse = Math.random() * Math.PI * 2;
			}

			update() {
				this.x += this.speedX + Math.sin(this.pulse) * 0.1;
				this.y += this.speedY;
				this.pulse += 0.01;

				if (
					this.x < 0 ||
					this.x > canvas.width ||
					this.y < 0 ||
					this.y > canvas.height
				) {
					this.reset();
				}
			}

			draw() {
				const pulsedOpacity = this.opacity * (0.5 + Math.sin(this.pulse) * 0.5);

				// Core dot
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(0, 255, 204, ${pulsedOpacity})`;
				ctx.fill();

				// Glow
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(0, 255, 204, ${pulsedOpacity * 0.15})`;
				ctx.fill();
			}
		}

		// Create particles
		for (let i = 0; i < 80; i++) {
			particles.push(new Particle());
		}

		function animateParticles() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			particles.forEach((p) => {
				p.update();
				p.draw();
			});
			requestAnimationFrame(animateParticles);
		}

		animateParticles();
	}

	/* ─────────────────────────────────────────────
     SMOOTH SCROLL FOR ANCHOR LINKS
     ───────────────────────────────────────────── */
	document.querySelectorAll('a[href^="#"]').forEach((a) => {
		a.addEventListener('click', (e) => {
			const href = a.getAttribute('href');
			if (href === '#') return; // Skip bare # links

			e.preventDefault();
			const target = document.querySelector(href);
			if (target) {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				// Close mobile menu if open
				if (navLinks) navLinks.classList.remove('open');
			}
		});
	});

	const at = document.getElementById('audioToggle');
	if (at) {
		at.addEventListener('click', () => {
			const playing = ambientAudio.toggle();
			at.classList.toggle('active', playing);
		});
	}
});
