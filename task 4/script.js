(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;
  const COUNT = 70;
  const LINK_DIST = 130;
  const mouse = { x: null, y: null };

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function makeParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.6
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = `rgba(255, 93, 78, ${0.18 * (1 - dist / LINK_DIST)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (mouse.x !== null) {
        const dx = particles[i].x - mouse.x, dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST * 1.4) {
          ctx.strokeStyle = `rgba(244, 241, 234, ${0.25 * (1 - dist / (LINK_DIST * 1.4))})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244, 241, 234, 0.55)';
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => { resize(); makeParticles(); });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  resize();
  makeParticles();
  step();
})();

(function () {
  const targets = document.querySelectorAll('section, .stats-strip, .statement');
  targets.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => io.observe(el));
})();


(function () {
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach(card => {
    const baseRotate = card.classList.contains('card-a') ? -4 : 5;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg) scale(1.03)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotate(${baseRotate}deg)`;
    });
  });
})();

document.getElementById('download-resume')?.addEventListener('click', function (e) {
  e.preventDefault();

  const resumeHTML = `
    <html>
    <head>
      <title>Vedansh Bhargava — Resume</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #222; line-height: 1.5; }
        h1 { margin-bottom: 0; }
        .role { color: #ff5d4e; font-weight: 600; margin-top: 4px; }
        h2 { border-bottom: 2px solid #ff5d4e; padding-bottom: 4px; margin-top: 28px; }
        .contact { color: #555; margin-top: 8px; font-size: 0.95rem; }
        ul { padding-left: 18px; }
        li { margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <h1>Vedansh Bhargava</h1>
      <div class="role">Web Developer</div>
      <div class="contact">
        Phone: +91 70008 06090 &nbsp;|&nbsp;
        LinkedIn: linkedin.com/in/vedansh-bhargava-414056378
      </div>

      <h2>Profile</h2>
      <p>3rd-year B.Tech (CSE) student at Jaypee University of Engineering and Technology, and a
      learning frontend developer focused on HTML, CSS, and JavaScript, while expanding into
      Python and machine learning.</p>

      <h2>Education</h2>
      <p><strong>B.Tech, Computer Science</strong> — Jaypee University of Engineering and Technology<br>
      2023 – Present (3rd Year)</p>

      <h2>Skills</h2>
      <ul>
        <li>HTML &amp; CSS — semantic, responsive layouts</li>
        <li>JavaScript — DOM manipulation, events, local storage</li>
        <li>Python — scripting and data handling</li>
        <li>Machine Learning — regression &amp; classification basics</li>
      </ul>

      <h2>Projects</h2>
      <ul>
        <li><strong>Tech Trivia Quiz App</strong> — Timed 15-question JS quiz with live scoring and feedback.</li>
        <li><strong>Movie Explorer</strong> — API-driven movie search, filter, and detail viewer.</li>
        <li><strong>Student Score Predictor</strong> — Linear regression model predicting exam scores from study data.</li>
        <li><strong>Personal Portfolio</strong> — This multi-section site combining portfolio, task manager, and product listing.</li>
      </ul>
    </body>
    </html>
  `;

  const blob = new Blob([resumeHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Vedansh_Bhargava_Resume.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});