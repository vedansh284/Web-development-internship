(function () {
  'use strict';

  const DEFAULT_API_KEY = 'API KEY';

  let state = {
    role: '',
    level: 'Fresher / Intern',
    count: 5,
    persona: 'Friendly HR',
    questions: [],
    currentIndex: 0,
    answers: [],
  };
 
  const PERSONA_STYLES = {
    'Friendly HR':
      'Adopt a warm, encouraging HR interviewer persona. Focus on communication, culture fit, and behavioral questions. Keep feedback supportive and gentle even when pointing out gaps.',
    'Tough Technical Lead':
      'Adopt a direct, skeptical technical lead persona. Ask pointed, probing technical/fundamentals questions and push for depth and specifics. Keep feedback honest and blunt, calling out vague or shallow answers clearly.',
    'Curveball Panelist':
      'Adopt an unconventional panelist persona who asks unexpected, situational, or slightly offbeat questions to test adaptability and creative thinking. Feedback should note how well the candidate handled the unexpected angle.',
  };

  const LOADING_TIPS = [
    'Tip: Structure answers with Situation → Task → Action → Result.',
    'Tip: Pause for a second before answering — it reads as confidence, not hesitation.',
    "Tip: It's fine to say 'let me think for a moment' out loud.",
    'Tip: Numbers and specifics make an answer far more convincing.',
    "Tip: If you don't know something, say so — then explain how you'd find out.",
    'Tip: End answers with impact — what changed because of what you did.',
  ];

  const setupScreen = document.getElementById('setupScreen');
  const loadingScreen = document.getElementById('loadingScreen');
  const interviewScreen = document.getElementById('interviewScreen');
  const summaryScreen = document.getElementById('summaryScreen');
  const loadingText = document.getElementById('loadingText');

  const roleInput = document.getElementById('roleInput');
  const levelChips = document.getElementById('levelChips');
  const countChips = document.getElementById('countChips');
  const personaChips = document.getElementById('personaChips');
  const startBtn = document.getElementById('startBtn');
  const setupError = document.getElementById('setupError');
  const loadingTip = document.getElementById('loadingTip');

  const progressRail = document.getElementById('progressRail');
  const qCount = document.getElementById('qCount');
  const qRoleTag = document.getElementById('qRoleTag');
  const questionText = document.getElementById('questionText');
  const answerInput = document.getElementById('answerInput');
  const wordCount = document.getElementById('wordCount');
  const recIndicator = document.getElementById('recIndicator');
  const micBtn = document.getElementById('micBtn');
  const confidenceChips = document.getElementById('confidenceChips');
  const submitAnswerBtn = document.getElementById('submitAnswerBtn');
  const interviewError = document.getElementById('interviewError');

  const feedbackCard = document.getElementById('feedbackCard');
  const scoreValue = document.getElementById('scoreValue');
  const strengthsList = document.getElementById('strengthsList');
  const improvementsList = document.getElementById('improvementsList');
  const tipText = document.getElementById('tipText');
  const nextBtn = document.getElementById('nextBtn');

  const avgScore = document.getElementById('avgScore');
  const summaryLine = document.getElementById('summaryLine');
  const breakdownList = document.getElementById('breakdownList');
  const printBtn = document.getElementById('printBtn');
  const retryBtn = document.getElementById('retryBtn');
  const resetBtn = document.getElementById('resetBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  const historyBtn = document.getElementById('historyBtn');
  const historyScreen = document.getElementById('historyScreen');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyBackBtn = document.getElementById('historyBackBtn');

  let selectedConfidence = null;

  function showScreen(el) {
    [setupScreen, loadingScreen, interviewScreen, summaryScreen, historyScreen].forEach((s) => s.classList.add('hidden'));
    el.classList.remove('hidden');
  }

  function showError(container, msg) {
    container.innerHTML = '<div class="error-box">' + escapeHtml(msg) + '</div>';
  }
  function clearError(container) {
    container.innerHTML = '';
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function extractJson(text) {
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace === -1) start = firstBracket;
    else if (firstBracket === -1) start = firstBrace;
    else start = Math.min(firstBrace, firstBracket);
    if (start > 0) cleaned = cleaned.slice(start);
    return JSON.parse(cleaned);
  }

  async function callGemini(systemPrompt, userPrompt) {
    const apiKey = DEFAULT_API_KEY.trim();
    if (!apiKey) {
      throw new Error('No Gemini API key is set. Add your key to DEFAULT_API_KEY near the top of script.js.');
    }
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' +
      encodeURIComponent(apiKey);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        }),
      });
    } catch (networkErr) {
      throw new Error('Could not reach the Gemini API — check your internet connection and try again.');
    }

    if (!response.ok) {
      let detail = '';
      try {
        const errBody = await response.json();
        detail = errBody?.error?.message ? ' — ' + errBody.error.message : '';
      } catch (_) {}
      throw new Error('Request failed with status ' + response.status + detail);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response content received from Gemini.');
    return text;
  }

  levelChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    [...levelChips.children].forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.level = chip.dataset.level;
  });

  countChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    [...countChips.children].forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.count = parseInt(chip.dataset.count, 10);
  });

  personaChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    [...personaChips.children].forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.persona = chip.dataset.persona;
  });

  startBtn.addEventListener('click', async () => {
    const role = roleInput.value.trim();
    clearError(setupError);
    if (!role) {
      showError(setupError, 'Please enter the job role you want to practice for.');
      return;
    }
    state.role = role;
    state.currentIndex = 0;
    state.answers = [];

    showScreen(loadingScreen);
    loadingText.textContent = 'Preparing your questions…';
    const tipTimer = startLoadingTips();

    try {
      const personaStyle = PERSONA_STYLES[state.persona] || '';
      const sys =
        'You are an expert interview panel designer. ' +
        personaStyle +
        ' Respond with ONLY valid JSON and nothing else — no preamble, no markdown fences.';
      const prompt = `Generate ${state.count} realistic interview questions for a candidate interviewing for the role of "${state.role}" at a "${state.level}" experience level. Include a mix of behavioral and role-relevant technical/fundamental questions, ordered from easier to harder. Return ONLY this JSON shape: {"questions": ["question 1", "question 2"]}`;
      const raw = await callGemini(sys, prompt);
      const parsed = extractJson(raw);
      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('Could not generate questions. Please try again.');
      }
      state.questions = parsed.questions.slice(0, state.count);
      renderRail();
      renderQuestion();
      showScreen(interviewScreen);
    } catch (err) {
      showScreen(setupScreen);
      showError(setupError, 'Something went wrong generating your interview: ' + err.message);
    } finally {
      stopLoadingTips(tipTimer);
    }
  });

  function startLoadingTips() {
    let i = 0;
    loadingTip.textContent = LOADING_TIPS[0];
    return setInterval(() => {
      i = (i + 1) % LOADING_TIPS.length;
      loadingTip.textContent = LOADING_TIPS[i];
    }, 2600);
  }
  function stopLoadingTips(timer) {
    clearInterval(timer);
  }

  function renderRail() {
    progressRail.innerHTML = '';
    state.questions.forEach(() => {
      const pip = document.createElement('div');
      pip.className = 'pip';
      pip.innerHTML = '<span></span>';
      progressRail.appendChild(pip);
    });
    updateRail();
  }

  function updateRail() {
    [...progressRail.children].forEach((pip, i) => {
      pip.classList.remove('done', 'current');
      if (i < state.currentIndex) pip.classList.add('done');
      else if (i === state.currentIndex) pip.classList.add('current');
    });
  }

  function renderQuestion() {
    const trackNum = String(state.currentIndex + 1).padStart(2, '0');
    const trackTotal = String(state.questions.length).padStart(2, '0');
    qCount.textContent = `TRACK ${trackNum} / ${trackTotal}`;
    qRoleTag.textContent = state.role;
    questionText.textContent = state.questions[state.currentIndex];
    answerInput.value = '';
    wordCount.textContent = '0 words';
    recIndicator.classList.remove('live');
    feedbackCard.classList.add('hidden');
    answerInput.classList.remove('hidden');
    submitAnswerBtn.classList.remove('hidden');
    selectedConfidence = null;
    [...confidenceChips.children].forEach((c) => c.classList.remove('active'));
    clearError(interviewError);
    updateRail();
    answerInput.focus();
  }

  answerInput.addEventListener('input', () => {
    const words = answerInput.value.trim().split(/\s+/).filter(Boolean).length;
    wordCount.textContent = words + ' word' + (words === 1 ? '' : 's');
    recIndicator.classList.toggle('live', answerInput.value.length > 0);
  });

  confidenceChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.conf-chip');
    if (!chip) return;
    [...confidenceChips.children].forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    selectedConfidence = parseInt(chip.dataset.conf, 10);
  });

  let recognition = null;
  let isListening = false;
  let baseAnswerText = '';

  (function setupSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      micBtn.disabled = true;
      micBtn.title = 'Voice input is not supported in this browser';
      return;
    }
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      baseAnswerText = answerInput.value;
    };
    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      answerInput.value = (baseAnswerText + ' ' + transcript).trim();
      answerInput.dispatchEvent(new Event('input'));
    };
    const stopUI = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      micBtn.textContent = '🎤';
    };
    recognition.onend = stopUI;
    recognition.onerror = stopUI;
  })();

  micBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      isListening = true;
      micBtn.classList.add('listening');
      micBtn.textContent = '⏹';
    } catch (_) {
    }
  });

  submitAnswerBtn.addEventListener('click', async () => {
    const answer = answerInput.value.trim();
    clearError(interviewError);
    if (!answer) {
      showError(interviewError, 'Type an answer before submitting — even a rough one helps you practice.');
      return;
    }

    submitAnswerBtn.disabled = true;
    submitAnswerBtn.textContent = 'Scoring…';

    try {
      const personaStyle = PERSONA_STYLES[state.persona] || '';
      const sys =
        'You are an interview coach. ' +
        personaStyle +
        ' Respond with ONLY valid JSON and nothing else — no preamble, no markdown fences.';
      const prompt = `Interview question: "${state.questions[state.currentIndex]}"
Candidate's answer: "${answer}"
Candidate level: ${state.level}, role: ${state.role}.

Evaluate the answer. Return ONLY this JSON shape:
{"score": <integer 1-10>, "strengths": ["short point", "short point"], "improvements": ["short point", "short point"], "tip": "one rewritten opening line the candidate could use instead, under 25 words"}`;

      const raw = await callGemini(sys, prompt);
      const parsed = extractJson(raw);

      state.answers.push({
        question: state.questions[state.currentIndex],
        answer: answer,
        score: parsed.score,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        tip: parsed.tip || '',
        confidence: selectedConfidence,
      });

      renderFeedback(parsed);
    } catch (err) {
      showError(interviewError, 'Could not evaluate that answer: ' + err.message + '. You can try submitting again.');
    } finally {
      submitAnswerBtn.disabled = false;
      submitAnswerBtn.textContent = 'Submit Answer →';
    }
  });

  function renderFeedback(fb) {
    scoreValue.textContent = fb.score;
    strengthsList.innerHTML = (fb.strengths || []).map((s) => '<li>' + escapeHtml(s) + '</li>').join('');
    improvementsList.innerHTML = (fb.improvements || []).map((s) => '<li>' + escapeHtml(s) + '</li>').join('');
    tipText.textContent = ' "' + fb.tip + '"';

    feedbackCard.classList.remove('hidden');
    answerInput.classList.add('hidden');
    submitAnswerBtn.classList.add('hidden');

    const isLast = state.currentIndex === state.questions.length - 1;
    nextBtn.textContent = isLast ? 'See Final Report →' : 'Next Question →';
    feedbackCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  nextBtn.addEventListener('click', () => {
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      renderQuestion();
    } else {
      renderSummary();
      showScreen(summaryScreen);
    }
  });

  function renderSummary() {
    const total = state.answers.reduce((sum, a) => sum + (a.score || 0), 0);
    const avg = (total / state.answers.length).toFixed(1);
    avgScore.textContent = avg;

    let line = 'Solid foundation — a bit more structure will take you far.';
    if (avg >= 8) line = 'Strong performance — you sound genuinely interview-ready.';
    else if (avg >= 6) line = "Good base — tighten your weaker answers and you're set.";
    else if (avg < 4) line = 'Rough draft stage — focus on structure (situation, action, result).';
    summaryLine.textContent = line;

    breakdownList.innerHTML = state.answers
      .map((a, i) => {
        let confLine = '';
        if (a.confidence) {
          const diff = a.confidence * 2 - a.score;
          let note = 'well matched with the AI score';
          if (diff >= 3) note = 'you felt more confident than the score reflects';
          else if (diff <= -3) note = 'you scored higher than you expected';
          confLine = `<div class="conf-compare">Self-rated confidence: ${a.confidence}/5 — ${note}</div>`;
        }
        return `
      <div class="breakdown-item">
        <div>
          <span class="breakdown-q">${i + 1}. ${escapeHtml(a.question)}</span>
          ${confLine}
        </div>
        <span class="breakdown-score">${a.score}/10</span>
      </div>
    `;
      })
      .join('');

    saveHistoryEntry(parseFloat(avg));
  }

  const HISTORY_KEY = 'signal_interview_history';

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistoryEntry(avg) {
    const history = loadHistory();
    history.unshift({
      date: new Date().toISOString(),
      role: state.role,
      level: state.level,
      persona: state.persona,
      count: state.questions.length,
      avgScore: avg,
    });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch (_) {
    }
  }

  function renderHistoryList() {
    const history = loadHistory();
    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No past attempts yet — finish an interview to see it here.</div>';
      return;
    }
    historyList.innerHTML = history
      .map((h) => {
        const dateStr = new Date(h.date).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return `
      <div class="history-item">
        <div class="history-item-main">
          <span class="history-role">${escapeHtml(h.role)}</span>
          <span class="history-meta">${escapeHtml(h.level)} · ${escapeHtml(h.persona)} · ${h.count} questions · ${dateStr}</span>
        </div>
        <span class="history-score">${h.avgScore}/10</span>
      </div>
    `;
      })
      .join('');
  }

  historyBtn.addEventListener('click', () => {
    renderHistoryList();
    showScreen(historyScreen);
  });

  historyBackBtn.addEventListener('click', () => {
    showScreen(setupScreen);
  });

  clearHistoryBtn.addEventListener('click', () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (_) {}
    renderHistoryList();
  });

  printBtn.addEventListener('click', () => window.print());

  retryBtn.addEventListener('click', () => {
    resetAll();
  });

  resetBtn.addEventListener('click', () => {
    resetAll();
  });

  function resetAll() {
    state = { role: '', level: 'Fresher / Intern', count: 5, persona: 'Friendly HR', questions: [], currentIndex: 0, answers: [] };
    roleInput.value = '';
    selectedConfidence = null;
    [...levelChips.children].forEach((c, i) => c.classList.toggle('active', i === 0));
    [...countChips.children].forEach((c, i) => c.classList.toggle('active', i === 1));
    [...personaChips.children].forEach((c, i) => c.classList.toggle('active', i === 0));
    clearError(setupError);
    showScreen(setupScreen);
    roleInput.focus();
  }

  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.documentElement.dataset.theme === 'light';
    document.documentElement.dataset.theme = isLight ? 'dark' : 'light';
    themeToggleBtn.textContent = isLight ? '🌙 Dark' : '☀️ Light';
  });

  showScreen(setupScreen);
})();
