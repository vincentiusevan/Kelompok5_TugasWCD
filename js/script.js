document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const topbar = document.getElementById('topbar');
  const themeToggle = document.getElementById('themeToggle');
  const navToggle = document.getElementById('navToggle');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. Tinggi topbar ---------- */
  const syncTopbarHeight = () => {
    root.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`);
  };

  syncTopbarHeight();
  window.addEventListener('resize', syncTopbarHeight);

  if ('ResizeObserver' in window) {
    new ResizeObserver(syncTopbarHeight).observe(topbar);
  }

  /* ---------- 2. Mode gelap / terang ---------- */
  const THEME_KEY = 'neurosync-theme';

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';

    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.querySelector('.btn-icon-glyph').textContent = isDark ? '☀️' : '🌙';
    themeToggle.querySelector('.btn-icon-text').textContent = isDark ? 'Light Mode' : 'Dark Mode';
  };

  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (error) {
    savedTheme = null;
  }

  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

  themeToggle.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {}
  });

  /* ---------- 3. Menu hamburger (layar kecil) ---------- */
  const setNavOpen = (open) => {
    topbar.classList.toggle('is-nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.querySelector('.sr-only').textContent = open
      ? 'Tutup menu navigasi'
      : 'Buka menu navigasi';
    syncTopbarHeight();
  };

  navToggle.addEventListener('click', () => {
    setNavOpen(!topbar.classList.contains('is-nav-open'));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && topbar.classList.contains('is-nav-open')) {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (topbar.classList.contains('is-nav-open') && !topbar.contains(event.target)) {
      setNavOpen(false);
    }
  });

  /* ---------- 4. Scroll halus antar bagian ---------- */
  const scrollToSection = (id) => {
    const target = document.getElementById(id);

    if (!target) return false;

    const offset = topbar.offsetHeight + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    });

    return true;
  };

  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);

      if (!id) return;

      if (topbar.classList.contains('is-nav-open')) {
        setNavOpen(false);
      }

      if (scrollToSection(id)) {
        event.preventDefault();
        history.replaceState(null, '', `#${id}`);
        setActiveLink(id);
      }
    });
  });

  /* ---------- 5. Penanda menu aktif saat digulir ---------- */
  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  };

  const watchedSections = navLinks
    .map((link) => document.querySelector(`main ${link.getAttribute('href')}`))
    .filter(Boolean);

  if ('IntersectionObserver' in window && watchedSections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length) {
          setActiveLink(visible[0].target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    watchedSections.forEach((section) => observer.observe(section));
  }
});
