document.addEventListener('DOMContentLoaded', () => {


  const themeBtn  = document.getElementById('theme-toggle');
  const body      = document.body;
  const THEME_KEY = 'vedanshhub-theme';

  
  if (localStorage.getItem(THEME_KEY) === 'dark') {
    body.classList.add('dark-mode');
  }

  themeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, body.classList.contains('dark-mode') ? 'dark' : 'light');
  });



  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  const allLinks  = document.querySelectorAll('.nav-link');
  const sections  = document.querySelectorAll('section[id]');


  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    highlightCurrentSection();
  }, { passive: true });


  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  
  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  
  function highlightCurrentSection() {
    let active = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        active = sec.id;
      }
    });

    allLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${active}`);
    });
  }



  const toast     = document.getElementById('toast');
  const toastTitle = toast.querySelector('.toast-title');
  const toastMsg   = toast.querySelector('.toast-msg');
  let   toastTimer;

  function showToast(title, message) {
    toastTitle.textContent = title;
    toastMsg.textContent   = message;

    toast.classList.remove('hidden');
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.classList.add('hidden'), 400);
    }, 4000);
  }



  const contactForm = document.getElementById('contact-form');

  
  const fields = {
    name:    { el: document.getElementById('contact-name'),    err: document.getElementById('error-name'),    ok: v => v.trim().length > 0 },
    email:   { el: document.getElementById('contact-email'),   err: document.getElementById('error-email'),   ok: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    subject: { el: document.getElementById('contact-subject'), err: document.getElementById('error-subject'), ok: v => v.trim().length > 0 },
    message: { el: document.getElementById('contact-message'), err: document.getElementById('error-message'), ok: v => v.trim().length > 0 },
  };


  function validateField(field) {
    const group   = field.el.closest('.form-group');
    const passing = field.ok(field.el.value);

    group.classList.toggle('has-error', !passing);
    group.classList.toggle('is-valid',   passing);

    return passing;
  }

  
  Object.values(fields).forEach(field => {
    ['input', 'blur'].forEach(evt => {
      field.el.addEventListener(evt, () => validateField(field));
    });
  });

  contactForm.addEventListener('submit', e => {
    e.preventDefault();

    const results    = Object.values(fields).map(validateField);
    const allPassing = results.every(Boolean);

    if (allPassing) {
      showToast('Message sent ✓', 'All fields validated. Form would submit here in production.');

    
      contactForm.reset();
      Object.values(fields).forEach(field => {
        const group = field.el.closest('.form-group');
        group.classList.remove('has-error', 'is-valid');
      });
    } else {
      
      const firstBad = Object.values(fields).find(f => !f.ok(f.el.value));
      if (firstBad) firstBad.el.focus();

      const panel = contactForm.closest('.contact-form-panel');
      panel.classList.add('shake');
      panel.addEventListener('animationend', () => panel.classList.remove('shake'), { once: true });
    }
  });



  const todoInput    = document.getElementById('todo-input');
  const todoCategory = document.getElementById('todo-category');
  const todoAddBtn   = document.getElementById('todo-add-btn');
  const todoList     = document.getElementById('todo-list');
  const todoCount    = document.getElementById('todo-count');
  const emptyState   = document.getElementById('todo-empty-state');
  const clearDoneBtn = document.getElementById('todo-clear-completed');
  const filterBtns   = document.querySelectorAll('.filter-btn');

  const TASKS_KEY = 'devhub-tasks';

  let tasks = loadTasks();
  let filter = 'all';

  
  if (tasks.length === 0) {
    tasks = [
      { id: 1, text: 'Read through the CSS Grid section', category: 'Study',    done: false },
      { id: 2, text: 'Finish the semantic HTML layout',   category: 'Work',     done: true  },
      { id: 3, text: 'Write the JS validation code',      category: 'Urgent',   done: false },
    ];
    saveTasks();
  }

  function loadTasks() {
    try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || []; }
    catch { return []; }
  }

  function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  
  function addTask() {
    const text = todoInput.value.trim();
    if (!text) { todoInput.focus(); return; }

    tasks.unshift({ id: Date.now(), text, category: todoCategory.value, done: false });
    saveTasks();
    todoInput.value = '';
    renderTasks();
  }

  
  function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveTasks();
    renderTasks();
  }

  
  function removeTask(id, listEl) {
    listEl.classList.add('fade-out');
    listEl.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, { once: true });
  }

  
  function renderTasks() {
    todoList.innerHTML = '';

    const visible = tasks.filter(t => {
      if (filter === 'active')    return !t.done;
      if (filter === 'completed') return  t.done;
      return true;
    });

    const remainingCount = tasks.filter(t => !t.done).length;
    todoCount.textContent = `${remainingCount} remaining`;

    const isEmpty = visible.length === 0;
    emptyState.classList.toggle('hidden', !isEmpty);
    todoList.classList.toggle('hidden',   isEmpty);

    visible.forEach(task => {
      const li = document.createElement('li');
      li.className = `todo-item${task.done ? ' completed' : ''}`;

      li.innerHTML = `
        <div class="todo-left">
          <div class="todo-cb" aria-label="Mark as done" role="checkbox" aria-checked="${task.done}">
            ${task.done ? '✓' : ''}
          </div>
          <div class="todo-content">
            <span class="todo-text">${sanitize(task.text)}</span>
            <span class="todo-badge badge-${task.category.toLowerCase()}">${task.category}</span>
          </div>
        </div>
        <button class="todo-del" aria-label="Remove task" title="Delete">✕</button>
      `;

      li.querySelector('.todo-cb').addEventListener('click', () => toggleTask(task.id));
      li.querySelector('.todo-del').addEventListener('click', () => removeTask(task.id, li));

      todoList.appendChild(li);
    });
  }

  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      renderTasks();
    });
  });

  
  clearDoneBtn.addEventListener('click', () => {
    const before = tasks.length;
    tasks = tasks.filter(t => !t.done);
    const cleared = before - tasks.length;

    if (cleared > 0) {
      saveTasks();
      renderTasks();
      showToast('Cleared ✓', `Removed ${cleared} completed task${cleared !== 1 ? 's' : ''}.`);
    }
  });


  todoInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
  todoAddBtn.addEventListener('click', addTask);

  renderTasks();



  const galleryGrid     = document.getElementById('gallery-grid');
  const gallerySearch   = document.getElementById('gallery-search');
  const filterContainer = document.getElementById('gallery-filters');
  const galleryEmpty    = document.getElementById('gallery-empty-state');

  const uploadToggle  = document.getElementById('toggle-upload-form-btn');
  const uploadPanel   = document.getElementById('image-upload-panel');
  const uploadForm    = document.getElementById('image-upload-form');
  const uploadCancel  = document.getElementById('cancel-upload-btn');

  const lightbox      = document.getElementById('lightbox');
  const lbImg         = document.getElementById('lightbox-img');
  const lbTitle       = document.getElementById('lightbox-title');
  const lbCategory    = document.getElementById('lightbox-category');
  const lbClose       = document.getElementById('lightbox-close');
  const lbPrev        = document.getElementById('lightbox-prev');
  const lbNext        = document.getElementById('lightbox-next');

  const GALLERY_KEY = 'devhub-gallery';

  const defaults = [
    { id: 1, title: 'Misty Mountains',      category: 'nature', tags: 'mountains, mist, trees',      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', fav: false },
    { id: 2, title: 'Designer Workspace',   category: 'design', tags: 'desk, laptop, minimal',       url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', fav: true  },
    { id: 3, title: 'Code in the Dark',     category: 'tech',   tags: 'code, terminal, programming', url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80', fav: false },
    { id: 4, title: 'Forest Sunlight',      category: 'nature', tags: 'forest, light, trees',        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', fav: false },
    { id: 5, title: 'Minimal Architecture', category: 'design', tags: 'house, architecture, clean',  url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', fav: false },
    { id: 6, title: 'Mobile Interface',     category: 'tech',   tags: 'phone, apps, ui, software',  url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80', fav: false },
  ];

  let gallery = loadGallery();
  let galFilter = 'all';
  let galQuery  = '';
  let visibleImages = []; 
  let lbIndex = 0;

  function loadGallery() {
    try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || defaults; }
    catch { return defaults; }
  }

  function saveGallery() {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  }

  
  uploadToggle.addEventListener('click', () => {
    uploadPanel.classList.toggle('hidden');
    if (!uploadPanel.classList.contains('hidden')) {
      document.getElementById('img-url').focus();
    }
  });

  uploadCancel.addEventListener('click', () => {
    uploadPanel.classList.add('hidden');
    uploadForm.reset();
  });

  uploadForm.addEventListener('submit', e => {
    e.preventDefault();
    const url   = document.getElementById('img-url').value.trim();
    const title = document.getElementById('img-title').value.trim();
    if (!url || !title) return;

    const newImg = {
      id:     Date.now(),
      title,
      url,
      category: document.getElementById('img-category').value,
      tags:     document.getElementById('img-tags').value.trim() || 'custom',
      fav:    false,
      custom: true,
    };

    gallery.unshift(newImg);
    saveGallery();
    uploadForm.reset();
    uploadPanel.classList.add('hidden');
    renderGallery();
    showToast('Image added', `"${title}" is now in the grid.`);
  });

  
  filterContainer.addEventListener('click', e => {
    const btn = e.target.closest('.gf-btn');
    if (!btn) return;
    filterContainer.querySelectorAll('.gf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    galFilter = btn.dataset.galleryFilter;
    renderGallery();
  });

  
  gallerySearch.addEventListener('input', e => {
    galQuery = e.target.value.trim().toLowerCase();
    renderGallery();
  });

  function toggleFav(id, btn) {
    gallery = gallery.map(img => {
      if (img.id !== id) return img;
      const next = { ...img, fav: !img.fav };
      btn.classList.toggle('fav-active', next.fav);
      return next;
    });
    saveGallery();
    if (galFilter === 'favorites') renderGallery();
  }

  function deleteImage(id) {
    if (!confirm('Remove this image from the gallery?')) return;
    gallery = gallery.filter(img => img.id !== id);
    saveGallery();
    renderGallery();
    showToast('Image removed', 'The item was deleted from the gallery.');
  }

  function renderGallery() {
    galleryGrid.innerHTML = '';

    visibleImages = gallery.filter(img => {
      const matchCat = galFilter === 'all'
        || (galFilter === 'favorites' && img.fav)
        || img.category === galFilter;

      const haystack = `${img.title} ${img.tags} ${img.category}`.toLowerCase();
      const matchSearch = !galQuery || haystack.includes(galQuery);

      return matchCat && matchSearch;
    });

    const isEmpty = visibleImages.length === 0;
    galleryEmpty.classList.toggle('hidden', !isEmpty);
    galleryGrid.classList.toggle('hidden',   isEmpty);

    visibleImages.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';

      item.innerHTML = `
        <img class="gallery-item-image" src="${sanitize(img.url)}" alt="${sanitize(img.title)}" loading="lazy">
        <div class="gallery-item-overlay">
          <div class="gallery-item-top">
            <span class="item-cat-badge">${img.category}</span>
            <div class="item-btns">
              <button class="item-btn btn-fav ${img.fav ? 'fav-active' : ''}" aria-label="Favourite" title="Favourite">♥</button>
              ${img.custom ? `<button class="item-btn del-img" aria-label="Delete" title="Delete">✕</button>` : ''}
            </div>
          </div>
          <div class="gallery-item-info">
            <h4>${sanitize(img.title)}</h4>
            <p>${sanitize(img.tags)}</p>
          </div>
        </div>
      `;

      const favBtn = item.querySelector('.btn-fav');
      favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFav(img.id, favBtn); });

      if (img.custom) {
        item.querySelector('.del-img').addEventListener('click', e => {
          e.stopPropagation();
          deleteImage(img.id);
        });
      }

      
      item.addEventListener('click', () => openLightbox(idx));

      galleryGrid.appendChild(item);
    });
  }

  

  function openLightbox(idx) {
    if (!visibleImages.length) return;
    lbIndex = idx;
    showLightboxImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  function showLightboxImage() {
    const img = visibleImages[lbIndex];
    if (!img) return;

    
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.97)';

    setTimeout(() => {
      lbImg.src          = img.url;
      lbImg.alt          = img.title;
      lbTitle.textContent    = img.title;
      lbCategory.textContent = img.category;
      lbImg.style.opacity    = '1';
      lbImg.style.transform  = 'scale(1)';
    }, 140);
  }

  function prevImage() {
    lbIndex = (lbIndex - 1 + visibleImages.length) % visibleImages.length;
    showLightboxImage();
  }

  function nextImage() {
    lbIndex = (lbIndex + 1) % visibleImages.length;
    showLightboxImage();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', prevImage);
  lbNext.addEventListener('click', nextImage);

  
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   prevImage();
    if (e.key === 'ArrowRight')  nextImage();
  });

  renderGallery();

  function sanitize(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

});