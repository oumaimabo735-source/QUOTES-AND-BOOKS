// Theme management (Light / Dark Mode)
export function initTheme() {
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Set up event listener on any toggle buttons
  setupToggleListeners();
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  updateToggleIcons();
  
  // Dispatch custom event for pages that want to listen to theme changes
  window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: isDark ? 'light' : 'dark' } }));
}

function setupToggleListeners() {
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(btn => {
    // Avoid adding multiple listeners if called repeatedly
    btn.removeEventListener('click', toggleTheme);
    btn.addEventListener('click', toggleTheme);
  });
  updateToggleIcons();
}

function updateToggleIcons() {
  const toggles = document.querySelectorAll('.theme-toggle');
  const isDark = document.documentElement.classList.contains('dark');
  
  toggles.forEach(btn => {
    if (isDark) {
      // Sun icon
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      // Moon icon
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  });
}

// Automatically init on import
if (typeof document !== 'undefined') {
  initTheme();
}
