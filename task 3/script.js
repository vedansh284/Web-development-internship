/* ==========================================================================
   QUIZORA — result.js
   Renders the results of the most recently completed quiz.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  QW.renderProfileChip('#profileMount');

  const result = QW.getJSON(QW.KEYS.lastResult, null);

  if(!result){
    document.getElementById('resultContent').innerHTML =
      '<div class="glass result-card" style="grid-column:1/-1;text-align:center;padding:60px;"><h3>No quiz results yet</h3><p>Take a quiz first to see your results here.</p><a href="quiz.html" class="btn btn-primary" style="margin-top:10px;">Start a Quiz →</a></div>';
    return;
  }

  const RING_CIRC = 603; // 2 * PI * 96

  const correct = result.review.filter(r => r.status === 'correct').length;
  const wrong   = result.review.filter(r => r.status === 'wrong').length;
  const skipped = result.review.filter(r => r.status === 'skipped').length;
  const bookmarked = result.review.filter(r => r.bookmarked).length;

  /* ---------------- Performance level ---------------- */
  function performanceLevel(pct){
    if(pct >= 90) return { label: 'Outstanding', color: '#2fd888', message: "Phenomenal work — you're operating at expert level!" };
    if(pct >= 75) return { label: 'Excellent', color: '#22d3ee', message: 'Excellent performance — you clearly know your stuff.' };
    if(pct >= 50) return { label: 'Good', color: '#4f7cff', message: "Solid effort! A little more practice and you'll be unstoppable." };
    if(pct >= 30) return { label: 'Fair', color: '#ffb547', message: 'A fair attempt — review the topics below and try again.' };
    return { label: 'Needs Practice', color: '#ff5470', message: "Don't worry — every expert started somewhere. Try again!" };
  }
  const perf = performanceLevel(result.percent);

  /* ---------------- Fill text content ---------------- */
  document.getElementById('resultCategory').textContent = `${result.category} · ${result.difficulty[0].toUpperCase()}${result.difficulty.slice(1)}`;
  document.getElementById('percentText').textContent = `${result.percent}%`;
  document.getElementById('scoreFractionText').textContent = `${result.score} / ${result.total} correct`;
  const badge = document.getElementById('perfBadge');
  badge.textContent = perf.label;
  badge.style.background = perf.color + '26';
  badge.style.color = perf.color;
  badge.style.boxShadow = `0 0 20px ${perf.color}40`;
  document.getElementById('motivationText').textContent = perf.message;

  document.getElementById('statCategory').textContent = result.category;
  document.getElementById('statDifficulty').textContent = result.difficulty[0].toUpperCase() + result.difficulty.slice(1);
  document.getElementById('statCorrect').textContent = correct;
  document.getElementById('statWrong').textContent = wrong;
  document.getElementById('statSkipped').textContent = skipped;
  document.getElementById('statBookmarked').textContent = bookmarked;

  /* ---------------- Animate score ring ---------------- */
  requestAnimationFrame(() => {
    const offset = RING_CIRC * (1 - result.percent / 100);
    document.getElementById('scoreProg').style.strokeDashoffset = offset;
  });

  /* ---------------- Review list ---------------- */
  const reviewList = document.getElementById('reviewList');
  result.review.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'glass review-item';
    const statusLabel = r.status === 'correct' ? 'Correct' : r.status === 'wrong' ? 'Incorrect' : 'Skipped';
    div.innerHTML = `
      <div class="rq">${i + 1}. ${r.question} ${r.bookmarked ? '🔖' : ''}</div>
      <div class="ra ${r.status}">
        <strong>${statusLabel}</strong>
        ${r.status === 'wrong' ? `— you chose "${r.selected}", correct was "${r.correctAnswer}"` : r.status === 'skipped' ? `— correct answer was "${r.correctAnswer}"` : ''}
      </div>`;
    reviewList.appendChild(div);
  });

  /* ---------------- Performance chart (canvas bar chart) ---------------- */
  function drawChart(){
    const canvas = document.getElementById('result-chart');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const data = [
      { label: 'Correct', value: correct, color: '#2fd888' },
      { label: 'Wrong', value: wrong, color: '#ff5470' },
      { label: 'Skipped', value: skipped, color: '#ffb547' },
    ];
    const max = Math.max(result.total, 1);
    const barW = rect.width / data.length * 0.4;
    const gap = rect.width / data.length;
    const baseline = rect.height - 30;
    const maxBarH = rect.height - 60;

    data.forEach((d, i) => {
      const x = gap * i + gap / 2 - barW / 2;
      const targetH = (d.value / max) * maxBarH;
      let h = 0;
      const animate = () => {
        h += (targetH - h) * 0.18;
        if(Math.abs(targetH - h) < 0.5) h = targetH;
        ctx.clearRect(x - 4, 0, barW + 8, rect.height);
        ctx.fillStyle = d.color;
        const y = baseline - h;
        ctx.beginPath();
        if(ctx.roundRect){ ctx.roundRect(x, y, barW, h, 8); } else { ctx.rect(x, y, barW, h); }
        ctx.fill();
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-1') || '#eef1fb';
        ctx.textAlign = 'center';
        ctx.fillText(d.value, x + barW / 2, y - 10);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-3') || '#6b7690';
        ctx.fillText(d.label, x + barW / 2, baseline + 20);
        if(h !== targetH) requestAnimationFrame(animate);
      };
      animate();
    });
  }
  drawChart();
  window.addEventListener('resize', () => setTimeout(drawChart, 150));

  /* ---------------- Confetti for high scores ---------------- */
  if(result.percent >= 70){
    launchConfetti();
    QW.toast('Great job — you nailed it! 🎉', 'success');
  }
  function launchConfetti(){
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#4f7cff', '#8b5cf6', '#22d3ee', '#2fd888', '#ffb547', '#ec4899'];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
    }));
    let frame = 0;
    const maxFrames = 260;
    (function loop(){
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if(frame < maxFrames) requestAnimationFrame(loop);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })();
  }

  /* ---------------- Actions ---------------- */
  document.getElementById('retryBtn').addEventListener('click', () => window.location.href = 'quiz.html');

  // Pure vanilla PDF export: opens the browser's native print dialog with a
  // clean, print-only layout (see the @media print rules in style.css).
  // The user picks "Save as PDF" as the printer/destination — no libraries involved.
  document.getElementById('downloadBtn').addEventListener('click', () => {
    QW.toast('Opening print dialog — choose "Save as PDF" as the destination.', 'info', 3500);
    setTimeout(() => window.print(), 400);
  });

  document.getElementById('shareBtn').addEventListener('click', async () => {
    const text = `I scored ${result.score}/${result.total} (${result.percent}%) on the ${result.category} quiz at Quizora! 🎯`;
    if(navigator.share){
      try{ await navigator.share({ title: 'My Quizora Result', text }); }catch(e){ /* user cancelled */ }
    } else {
      try{
        await navigator.clipboard.writeText(text);
        QW.toast('Result copied to clipboard!', 'success');
      }catch(e){
        QW.toast(text, 'info', 5000);
      }
    }
  });
});
