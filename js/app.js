import { books } from './books.js';
import { authors } from './authors.js';
import { quotes } from './quotes.js';
import { initTheme, toggleTheme } from './theme.js';
import { 
  getFavoriteBooks, 
  addFavoriteBook, 
  removeFavoriteBook, 
  isBookFavorite,
  getFavoriteQuotes, 
  addFavoriteQuote, 
  removeFavoriteQuote, 
  isQuoteFavorite,
  showToast 
} from './favorites.js';
import { searchBooks, searchQuotes, searchAuthors, getCategories } from './search.js';

// Global Guest Profile State
const DEFAULT_GUEST = {
  active: false,
  name: "Literary Wanderer",
  readingGoal: 5,
  finishedBooks: [],
  activityLog: []
};

export function getGuestProfile() {
  const data = localStorage.getItem('guest_profile');
  return data ? JSON.parse(data) : DEFAULT_GUEST;
}

export function saveGuestProfile(profile) {
  localStorage.setItem('guest_profile', JSON.stringify(profile));
  // Dispatch event so other components can refresh
  window.dispatchEvent(new CustomEvent('guestprofilechanged', { detail: profile }));
}

export function addGuestActivity(message) {
  const profile = getGuestProfile();
  if (!profile.active) return;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  profile.activityLog.unshift(`[${timestamp}] ${message}`);
  if (profile.activityLog.length > 25) profile.activityLog.pop(); // Cap log size
  saveGuestProfile(profile);
}

// Check and trigger Badge status based on favorites and finished books
export function getBadgesStatus() {
  const profile = getGuestProfile();
  const favBooks = getFavoriteBooks();
  const favQuotes = getFavoriteQuotes();

  return [
    {
      id: "novice",
      name: "Explorer",
      icon: "🧭",
      description: "Began your journey as a Guest Reader",
      unlocked: profile.active
    },
    {
      id: "thinker",
      name: "Philosopher",
      icon: "💭",
      description: "Saved 2 or more philosophical quotes",
      unlocked: favQuotes.length >= 2
    },
    {
      id: "scholar",
      name: "Literary Scholar",
      icon: "🎓",
      description: "Marked at least 1 classic book as finished",
      unlocked: profile.finishedBooks.length >= 1
    },
    {
      id: "curator",
      name: "Bibliophile",
      icon: "🏺",
      description: "Saved 3 or more books to your favorites list",
      unlocked: favBooks.length >= 3
    }
  ];
}

// ----------------------------------------------------
// LAYOUT ENGINE - Navbar & Footer generation
// ----------------------------------------------------
export function initLayout() {
  // Inject Top Reading Progress Bar container
  if (!document.getElementById('reading-progress')) {
    const progress = document.createElement('div');
    progress.id = 'reading-progress';
    document.body.prepend(progress);
  }

  // Inject Navbar
  const navPlaceholder = document.getElementById('navbar-placeholder');
  if (navPlaceholder) {
    const currentPath = window.location.pathname;
    const isPage = (name) => currentPath.includes(name);
    
    const profile = getGuestProfile();
    const guestBtnHtml = profile.active 
      ? `<a href="/#dashboard-section" class="guest-badge-btn" id="nav-guest-status">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="10" rx="1"/><rect width="7" height="5" x="3" y="14" rx="1"/></svg>
           Dashboard
         </a>`
      : `<button class="guest-badge-btn" id="continue-guest-nav-btn">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
           Guest Mode
         </button>`;

    navPlaceholder.innerHTML = `
      <nav class="navbar">
        <div class="navbar-container">
          <a href="/index.html" class="logo">
            <div class="logo-icon">B</div>
            <span>Bibliothèque Explorer</span>
          </a>
          
          <ul class="nav-links">
            <li class="nav-item ${isPage('index.html') || currentPath === '/' ? 'active' : ''}">
              <a href="/index.html">Home</a>
            </li>
            <li class="nav-item ${isPage('books.html') ? 'active' : ''}">
              <a href="/books.html">Books</a>
            </li>
            <li class="nav-item ${isPage('quotes.html') ? 'active' : ''}">
              <a href="/quotes.html">Quotes</a>
            </li>
            <li class="nav-item ${isPage('author.html') ? 'active' : ''}">
              <a href="/books.html?focus=authors">Authors</a>
            </li>
            <li class="nav-item ${isPage('favorites.html') ? 'active' : ''}">
              <a href="/favorites.html">Favorites</a>
            </li>
            <li class="nav-item ${isPage('about.html') ? 'active' : ''}">
              <a href="/about.html">About</a>
            </li>
          </ul>

          <div class="nav-actions">
            <button class="nav-btn theme-toggle" title="Toggle dark mode"></button>
            ${guestBtnHtml}
            <div class="hamburger" id="nav-hamburger" aria-label="Toggle navigation menu">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </nav>
    `;

    // Listen to Continue Guest trigger in Nav
    const guestNavBtn = document.getElementById('continue-guest-nav-btn');
    if (guestNavBtn) {
      guestNavBtn.addEventListener('click', () => {
        activateGuestMode();
      });
    }

    // Mobile Hamburger Toggle
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
      });
    }
  }

  // Inject Footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-info">
              <a href="/index.html" class="logo">
                <div class="logo-icon">B</div>
                <span>Bibliothèque Interactive</span>
              </a>
              <p class="footer-desc">
                An immersive digital library allowing literature enthusiasts to discover classic masterpieces through highly inspiring and philosophical quotes. Built with pure craft and standard web tech.
              </p>
              <div class="footer-socials">
                <a href="#" class="social-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                <a href="#" class="social-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
                <a href="#" class="social-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
              </div>
            </div>
            
            <div>
              <h4 class="footer-column-title">Sitemap</h4>
              <ul class="footer-links">
                <li><a href="/index.html">Home Dashboard</a></li>
                <li><a href="/books.html">Explore Books</a></li>
                <li><a href="/quotes.html">Inspirational Quotes</a></li>
                <li><a href="/favorites.html">My Favorites</a></li>
                <li><a href="/about.html">About Project</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="footer-column-title">Categories</h4>
              <ul class="footer-links">
                <li><a href="/books.html?category=Existentialism">Existentialism</a></li>
                <li><a href="/books.html?category=Philosophy">Philosophy</a></li>
                <li><a href="/books.html?category=Classic%20Literature">Classic Literature</a></li>
                <li><a href="/books.html?category=Psychological%20Fiction">Psychological Fiction</a></li>
                <li><a href="/books.html?category=Dystopian%20Fiction">Dystopian Fiction</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="footer-column-title">Bibliothèque Mission</h4>
              <p class="footer-desc" style="font-size: 0.85rem; line-height: 1.6;">
                "Reading is the core gateway to deep human empathy." Our mission is to promote high-quality classic literature by presenting its most powerful quotes to a digital-first audience.
              </p>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p>&copy; 2026 Bibliothèque Interactive de Citations et de Livres. All rights reserved.</p>
            <p>Designed and Built with Elegant Vanilla Stack</p>
          </div>
        </div>
      </footer>
    `;
  }

  // Inject Scroll to Top button
  if (!document.getElementById('scroll-to-top')) {
    const s2t = document.createElement('button');
    s2t.id = 'scroll-to-top';
    s2t.title = 'Scroll to top';
    s2t.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
    document.body.appendChild(s2t);
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        s2t.classList.add('show');
      } else {
        s2t.classList.remove('show');
      }
    });

    s2t.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize scroll-triggered Reading Progress Bar
  window.addEventListener('scroll', updateReadingProgress);

  // Initialize theme-related icons
  initTheme();
}

function updateReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
  bar.style.width = scrolled + '%';
}

// ----------------------------------------------------
// GUEST SYSTEM TRIGGERS
// ----------------------------------------------------
export function activateGuestMode() {
  const profile = getGuestProfile();
  if (profile.active) {
    showToast("Guest session already active! Welcome back.");
    return;
  }

  profile.active = true;
  profile.name = "Guest Wanderer";
  profile.readingGoal = 5;
  profile.finishedBooks = [];
  profile.activityLog = [];
  
  saveGuestProfile(profile);
  addGuestActivity("Initiated guest reader session.");
  showToast("Guest Mode Activated! Check your dashboard. 🚀");
  
  // Re-run layouts to update buttons
  initLayout();
  
  // Scroll to dashboard if on homepage
  const dashboard = document.getElementById('dashboard-section');
  if (dashboard) {
    dashboard.scrollIntoView({ behavior: 'smooth' });
    renderDashboard();
  } else {
    // If on another page, redirect to home page with hash to view dashboard
    window.location.href = '/index.html#dashboard-section';
  }
}

// ----------------------------------------------------
// PAGES RENDERING ROUTING
// ----------------------------------------------------

// 1. HOME RENDERING
export function renderHomePage() {
  initLayout();

  // Quote of the Day
  // Pick one quote based on current date to be consistent, or just pick index 3 for the perfect starter
  const quoteOfTheDay = quotes[14]; // Viktor Frankl: "Those who have a 'why' to live..."
  const book = books.find(b => b.id === quoteOfTheDay.bookId);
  const author = book ? authors.find(a => a.id === book.authorId) : null;

  const quoteContainer = document.getElementById('hero-quote-container');
  if (quoteContainer && book && author) {
    quoteContainer.innerHTML = `
      <div class="hero-quote-card slide-up">
        <p class="hero-quote-text">"${quoteOfTheDay.text}"</p>
        <div class="hero-quote-meta">
          <span>— ${author.name}, in</span>
          <a href="/book.html?id=${book.id}" class="book-link">"${book.title}"</a>
        </div>
        <div class="hero-actions">
          <a href="/book.html?id=${book.id}" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Discover the Book
          </a>
          <button class="btn btn-secondary" id="share-hero-quote">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.6" y1="6.51" y2="10.49"/></svg>
            Share Quote
          </button>
        </div>
      </div>
    `;

    // Copy/Share Listener
    document.getElementById('share-hero-quote').addEventListener('click', () => {
      navigator.clipboard.writeText(`"${quoteOfTheDay.text}" — ${author.name} (${book.title})`);
      showToast("Quote details copied to clipboard!");
      addGuestActivity(`Copied hero quote from "${book.title}"`);
    });
  }

  // Guest Dashboard rendering
  renderDashboard();

  // Featured Books (Display top 3 by rating)
  const featuredBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const featuredGrid = document.getElementById('featured-books-grid');
  if (featuredGrid) {
    featuredGrid.innerHTML = featuredBooks.map(b => renderBookCardMarkup(b)).join('');
    setupCardEventHandlers();
  }

  // Popular Authors (Display 4 authors)
  const popularAuthors = authors.slice(0, 4);
  const authorsGrid = document.getElementById('popular-authors-grid');
  if (authorsGrid) {
    authorsGrid.innerHTML = popularAuthors.map(a => `
      <div class="author-card slide-up">
        <div class="author-photo-wrapper">
          <img src="${a.photo}" alt="${a.name}" class="author-photo" referrerPolicy="no-referrer">
        </div>
        <h3 class="author-name">${a.name}</h3>
        <p class="author-nationality">${a.nationality}</p>
        <p class="author-bio-snippet">${a.biography}</p>
        <a href="/author.html?id=${a.id}" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
          View Author Profile
        </a>
      </div>
    `).join('');
  }

  // Random Quote Section
  renderRandomQuoteSection();

  // Categories Section
  const categoriesList = getCategories().filter(c => c !== "all");
  const categoriesGrid = document.getElementById('categories-grid');
  if (categoriesGrid) {
    categoriesGrid.innerHTML = categoriesList.map(c => `
      <a href="/books.html?category=${encodeURIComponent(c)}" class="category-pill" style="padding: 1rem 2rem; font-size: 1rem; border-radius: 30px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-align: center;">
        📁 ${c}
      </a>
    `).join('');
  }

  // Dynamic Dashboard and guest change listener
  window.addEventListener('guestprofilechanged', renderDashboard);
}

// ----------------------------------------------------
// DYNAMIC DASHBOARD RENDERER
// ----------------------------------------------------
export function renderDashboard() {
  const container = document.getElementById('dashboard-section-placeholder');
  if (!container) return;

  const profile = getGuestProfile();

  if (!profile.active) {
    // If not active, show attractive welcoming prompt with guest activation trigger
    container.innerHTML = `
      <div class="dashboard-banner slide-up text-center">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem; font-family: 'Playfair Display', serif;">Interactive Reader Dashboard</h2>
        <p style="font-size: 1.1rem; max-width: 700px; margin: 0 auto 2.5rem; opacity: 0.9;">
          Set personal reading milestones, keep a live reading log, unlock custom badges, and mark books as completed as you traverse classic wisdom.
        </p>
        <div style="display: flex; justify-content: center; gap: 1.5rem;">
          <button class="btn" id="activate-dashboard-btn" style="background-color: #FFFFFF; color: var(--primary-color); box-shadow: var(--shadow-lg); font-size: 1.05rem;">
            Continue as Guest & Unlock Dashboard 🧭
          </button>
        </div>
      </div>
    `;

    document.getElementById('activate-dashboard-btn').addEventListener('click', () => {
      activateGuestMode();
    });
    return;
  }

  // If active, render the gorgeous interactive metrics!
  const progressPercent = Math.min(100, Math.round((profile.finishedBooks.length / profile.readingGoal) * 100));
  const badges = getBadgesStatus();
  const unlockedBadges = badges.filter(b => b.unlocked);

  container.innerHTML = `
    <div class="slide-up">
      <div class="dashboard-banner">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
          <div>
            <h2 style="font-size: 2.2rem; font-family: 'Playfair Display', serif;">Welcome back, ${profile.name}!</h2>
            <p style="opacity: 0.9; font-size: 0.95rem; margin-top: 0.25rem;">Your curated interactive reading dashboard is live.</p>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-sm btn-secondary" id="reset-guest-session" style="font-size: 0.8rem; padding: 0.5rem 1rem; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3); background: transparent;">
              Logout / Reset Session
            </button>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-stats-card">
          <h3 class="font-serif" style="font-size: 1.3rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">My Reading Statistics</h3>
          
          <div class="stat-row">
            <span>Books Completed</span>
            <span class="stat-val">${profile.finishedBooks.length}</span>
          </div>
          <div class="stat-row">
            <span>Favorite Books</span>
            <span class="stat-val">${getFavoriteBooks().length}</span>
          </div>
          <div class="stat-row">
            <span>Favorite Quotes</span>
            <span class="stat-val">${getFavoriteQuotes().length}</span>
          </div>
          
          <div style="margin-top: 1.5rem;">
            <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Badges Unlocked (${unlockedBadges.length}/${badges.length})</h4>
            <div class="badges-container">
              ${badges.map(b => `
                <div class="badge ${b.unlocked ? 'unlocked' : ''}" title="${b.description}">
                  <span>${b.icon}</span>
                  <span>${b.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="dashboard-interactive-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="font-serif" style="font-size: 1.3rem;">Current Reading Milestone</h3>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button class="action-icon-btn" id="decrease-goal" style="width: 28px; height: 28px; font-size: 1rem; font-weight: bold;">-</button>
              <span style="font-weight: 700; font-size: 1rem;">Goal: ${profile.readingGoal} books</span>
              <button class="action-icon-btn" id="increase-goal" style="width: 28px; height: 28px; font-size: 1rem; font-weight: bold;">+</button>
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
            <span>${progressPercent}% Completed</span>
            <span>${profile.finishedBooks.length} of ${profile.readingGoal} Books Finished</span>
          </div>

          <h3 class="font-serif" style="font-size: 1.2rem; margin-bottom: 0.75rem;">Recent Activity Feed</h3>
          <ul class="activity-feed">
            ${profile.activityLog.length === 0 
              ? `<li style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 2rem 0;">No logs yet. Try favoriting quotes or marking books!</li>`
              : profile.activityLog.map(log => `
                  <li class="activity-item">
                    <span class="activity-icon">✔</span>
                    <span>${log}</span>
                  </li>
                `).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;

  // Statistics increase/decrease buttons listeners
  document.getElementById('increase-goal').addEventListener('click', () => {
    profile.readingGoal = Math.min(50, profile.readingGoal + 1);
    saveGuestProfile(profile);
    addGuestActivity(`Increased reading goal to ${profile.readingGoal} books.`);
  });

  document.getElementById('decrease-goal').addEventListener('click', () => {
    profile.readingGoal = Math.max(1, profile.readingGoal - 1);
    saveGuestProfile(profile);
    addGuestActivity(`Decreased reading goal to ${profile.readingGoal} books.`);
  });

  // Reset Session
  document.getElementById('reset-guest-session').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your guest session? All stats, goals, and history will be cleared.")) {
      localStorage.removeItem('guest_profile');
      localStorage.removeItem('fav_books');
      localStorage.removeItem('fav_quotes');
      showToast("Guest session completely reset.");
      window.location.reload();
    }
  });
}

// ----------------------------------------------------
// RANDOM QUOTE GENERATOR COMPONENT
// ----------------------------------------------------
export function renderRandomQuoteSection() {
  const container = document.getElementById('random-quote-container');
  if (!container) return;

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const q = quotes[randomIndex];
    const b = books.find(book => book.id === q.bookId);
    const a = b ? authors.find(auth => auth.id === b.authorId) : null;
    return { q, b, a };
  };

  const draw = () => {
    const { q, b, a } = getRandomQuote();
    if (!b || !a) return;

    container.innerHTML = `
      <div class="quote-card slide-up" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3.5rem;">
        <p class="quote-card-text" style="font-size: 1.6rem;">"${q.text}"</p>
        <div class="quote-card-meta" style="align-items: center; justify-content: center;">
          <a href="/book.html?id=${b.id}" class="quote-card-book" style="font-size: 1.05rem;">"${b.title}"</a>
          <span class="quote-card-author" style="font-size: 0.9rem; margin-top: 0.25rem;">— ${a.name}</span>
        </div>
        <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-secondary btn-sm" id="btn-next-random" style="font-size: 0.85rem;">
            🔄 Inspire Me Again
          </button>
          <button class="action-icon-btn ${isQuoteFavorite(q.id) ? 'active' : ''}" id="btn-fav-random" title="Add quote to favorites">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>
          <button class="action-icon-btn" id="btn-copy-random" title="Copy quote text">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-next-random').addEventListener('click', () => {
      draw();
    });

    const favBtn = document.getElementById('btn-fav-random');
    favBtn.addEventListener('click', () => {
      if (isQuoteFavorite(q.id)) {
        removeFavoriteQuote(q.id);
        favBtn.classList.remove('active');
        addGuestActivity(`Removed quote from "${b.title}" from favorites`);
      } else {
        addFavoriteQuote(q.id);
        favBtn.classList.add('active');
        addGuestActivity(`Favorited quote from "${b.title}"`);
      }
      renderDashboard(); // Refresh stats if on home
    });

    document.getElementById('btn-copy-random').addEventListener('click', () => {
      navigator.clipboard.writeText(`"${q.text}" — ${a.name} (${b.title})`);
      showToast("Quote text copied!");
      addGuestActivity(`Copied random quote: "${q.text.substring(0, 20)}..."`);
    });
  };

  draw();
}

// ----------------------------------------------------
// BOOK CARD MARKUP GENERATOR
// ----------------------------------------------------
export function renderBookCardMarkup(book) {
  const author = authors.find(a => a.id === book.authorId);
  const authorName = author ? author.name : "Unknown Author";
  
  const isFav = isBookFavorite(book.id);
  const profile = getGuestProfile();
  const isFinished = profile.active && profile.finishedBooks.includes(book.id);

  // We can render a fallback premium minimalist cover if no image, or let's support custom styled covers by default!
  // To make it look extremely premium like Goodreads, we render a beautiful cover design with custom editorial bg and serif title overlays when loaded!
  return `
    <div class="book-card slide-up" data-id="${book.id}">
      <div class="book-cover-wrapper">
        <div class="editorial-cover" style="background: ${book.coverBg}; color: ${book.textColor};">
          <div class="editorial-cover-border"></div>
          <span class="editorial-category">${book.category}</span>
          <h4 class="editorial-title">${book.title}</h4>
          <span class="editorial-author">${authorName}</span>
        </div>
        <div class="book-card-badge">${book.year}</div>
      </div>
      <div class="book-card-content">
        <span class="book-card-category">${book.category}</span>
        <h3 class="book-card-title">${book.title}</h3>
        <p class="book-card-author">By ${authorName}</p>
        <p class="book-card-desc">${book.description}</p>
        <div class="book-card-footer">
          <div class="book-rating">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${book.rating.toFixed(1)}</span>
          </div>
          <div class="card-actions">
            <a href="/book.html?id=${book.id}" class="action-icon-btn" title="View Book Details">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </a>
            <button class="action-icon-btn fav-book-toggle ${isFav ? 'active' : ''}" data-id="${book.id}" title="Save to Favorites">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
            ${profile.active 
              ? `<button class="action-icon-btn finished-book-toggle ${isFinished ? 'active' : ''}" data-id="${book.id}" title="${isFinished ? 'Marked as Reading' : 'Mark as Finished'}" style="${isFinished ? 'background-color: var(--primary-color); color: white; border-color: var(--primary-color)' : ''}">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                 </button>`
              : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupCardEventHandlers() {
  // Favorite Book Toggles
  document.querySelectorAll('.fav-book-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const book = books.find(b => b.id === id);
      if (!book) return;

      if (isBookFavorite(id)) {
        removeFavoriteBook(id);
        btn.classList.remove('active');
        addGuestActivity(`Removed "${book.title}" from favorites`);
      } else {
        addFavoriteBook(id);
        btn.classList.add('active');
        addGuestActivity(`Favorited book "${book.title}"`);
      }
      
      // Update dynamic dashboard
      renderDashboard();
    });
  });

  // Finished Book Toggles
  document.querySelectorAll('.finished-book-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const book = books.find(b => b.id === id);
      if (!book) return;

      const profile = getGuestProfile();
      if (!profile.active) return;

      const index = profile.finishedBooks.indexOf(id);
      if (index > -1) {
        profile.finishedBooks.splice(index, 1);
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        showToast(`Marked "${book.title}" as currently reading 📖`);
        addGuestActivity(`Reopened "${book.title}" to reading list.`);
      } else {
        profile.finishedBooks.push(id);
        btn.classList.add('active');
        btn.style.backgroundColor = 'var(--primary-color)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--primary-color)';
        showToast(`Congratulations! Finished "${book.title}" 🎉`);
        addGuestActivity(`Finished reading "${book.title}"!`);
      }

      saveGuestProfile(profile);
      renderDashboard();
    });
  });
}

// ----------------------------------------------------
// 2. BOOKS & AUTHORS CATALOG RENDERING
// ----------------------------------------------------
export function renderBooksPage() {
  initLayout();

  // Get current active tab from URL queries or default to books
  const urlParams = new URLSearchParams(window.location.search);
  const focusParam = urlParams.get('focus') || 'books';
  const categoryParam = urlParams.get('category') || 'all';

  let currentTab = focusParam === 'authors' ? 'authors' : 'books';
  let activeCategory = categoryParam;
  let searchQuery = "";
  let activeSort = "default";

  // Elements
  const tabBooksBtn = document.getElementById('tab-books-toggle');
  const tabAuthorsBtn = document.getElementById('tab-authors-toggle');
  const booksSection = document.getElementById('books-browser-section');
  const authorsSection = document.getElementById('authors-browser-section');

  const booksGrid = document.getElementById('catalog-books-grid');
  const authorsGrid = document.getElementById('catalog-authors-grid');

  const booksSearchInput = document.getElementById('books-search-input');
  const authorsSearchInput = document.getElementById('authors-search-input');
  const booksSortSelect = document.getElementById('books-sort-select');
  const categoriesRail = document.getElementById('books-categories-rail');

  const booksCountInd = document.getElementById('books-count-indicator');
  const authorsCountInd = document.getElementById('authors-count-indicator');

  // Set up Tabs switching
  const switchTab = (tab) => {
    currentTab = tab;
    // Set URL
    const url = new URL(window.location);
    url.searchParams.set('focus', tab);
    window.history.pushState({}, '', url);

    if (tab === 'books') {
      tabBooksBtn.className = "btn btn-primary";
      tabAuthorsBtn.className = "btn btn-secondary";
      booksSection.style.display = 'block';
      authorsSection.style.display = 'none';
      renderBooks();
    } else {
      tabBooksBtn.className = "btn btn-secondary";
      tabAuthorsBtn.className = "btn btn-primary";
      booksSection.style.display = 'none';
      authorsSection.style.display = 'block';
      renderAuthors();
    }
  };

  tabBooksBtn.addEventListener('click', () => switchTab('books'));
  tabAuthorsBtn.addEventListener('click', () => switchTab('authors'));

  // -------------------------
  // BOOKS TAB LOGIC
  // -------------------------
  const renderCategoriesList = () => {
    if (!categoriesRail) return;
    const categories = getCategories();
    categoriesRail.innerHTML = categories.map(c => {
      const isActive = c.toLowerCase() === activeCategory.toLowerCase();
      const label = c === "all" ? "📂 All Genres" : c;
      return `
        <button class="category-pill ${isActive ? 'active' : ''}" data-cat="${c}">
          ${label}
        </button>
      `;
    }).join('');

    // Click handlers
    categoriesRail.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeCategory = pill.getAttribute('data-cat');
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('category', activeCategory);
        window.history.pushState({}, '', url);

        // Re-render categories layout and books
        renderCategoriesList();
        renderBooks();
        addGuestActivity(`Filtered catalog by category: "${activeCategory}"`);
      });
    });
  };

  const renderBooks = () => {
    if (!booksGrid) return;
    const results = searchBooks(searchQuery, activeCategory, activeSort);
    
    if (results.length === 0) {
      booksGrid.innerHTML = `
        <div class="empty-state slide-up" style="grid-column: 1 / -1;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
          <h3>No Masterpieces Found</h3>
          <p>We couldn't find any books matching your current filters. Try resetting search fields!</p>
          <button class="btn btn-primary btn-sm" id="reset-books-filters-btn">Reset All Filters</button>
        </div>
      `;
      booksCountInd.innerText = "No books found";

      document.getElementById('reset-books-filters-btn').addEventListener('click', () => {
        searchQuery = "";
        activeCategory = "all";
        activeSort = "default";
        if (booksSearchInput) booksSearchInput.value = "";
        if (booksSortSelect) booksSortSelect.value = "default";
        renderCategoriesList();
        renderBooks();
      });
      return;
    }

    booksGrid.innerHTML = results.map(b => renderBookCardMarkup(b)).join('');
    booksCountInd.innerText = `Showing ${results.length} of ${books.length} masterpieces`;
    setupCardEventHandlers();
  };

  // Input events
  if (booksSearchInput) {
    booksSearchInput.value = searchQuery;
    booksSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderBooks();
    });
  }

  if (booksSortSelect) {
    booksSortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderBooks();
    });
  }

  // -------------------------
  // AUTHORS TAB LOGIC
  // -------------------------
  const renderAuthors = () => {
    if (!authorsGrid) return;
    const results = searchAuthors(searchQuery);

    if (results.length === 0) {
      authorsGrid.innerHTML = `
        <div class="empty-state slide-up" style="grid-column: 1 / -1;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
          <h3>No Thinkers Found</h3>
          <p>No historic authors matched your query. Try searching with a different term!</p>
        </div>
      `;
      authorsCountInd.innerText = "No thinkers found";
      return;
    }

    authorsGrid.innerHTML = results.map(a => `
      <div class="author-card slide-up">
        <div class="author-photo-wrapper">
          <img src="${a.photo}" alt="${a.name}" class="author-photo" referrerPolicy="no-referrer">
        </div>
        <h3 class="author-name">${a.name}</h3>
        <p class="author-nationality">${a.nationality}</p>
        <p class="author-bio-snippet">${a.biography}</p>
        <a href="/author.html?id=${a.id}" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
          View Author Profile
        </a>
      </div>
    `).join('');
    authorsCountInd.innerText = `Showing ${results.length} of ${authors.length} historical thinkers`;
  };

  if (authorsSearchInput) {
    authorsSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderAuthors();
    });
  }

  // Initialize view focus state
  switchTab(currentTab);
  renderCategoriesList();
}

// ----------------------------------------------------
// 3. BOOK DETAIL VIEWER RENDERING
// ----------------------------------------------------
export function renderBookDetailPage() {
  initLayout();

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  const container = document.getElementById('book-details-layout-placeholder');
  if (!container) return;

  if (!bookId) {
    container.innerHTML = `
      <div class="empty-state slide-up">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="9"/><line x1="9" x2="15" y1="13" y2="13"/><line x1="9" x2="13" y1="17" y2="17"/></svg>
        <h3>No Book ID Provided</h3>
        <p>Please return to the catalog and select a masterpiece to explore its insights.</p>
        <a href="/books.html" class="btn btn-primary">Go to Catalog</a>
      </div>
    `;
    return;
  }

  const book = books.find(b => b.id === bookId);
  if (!book) {
    container.innerHTML = `
      <div class="empty-state slide-up">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <h3>Masterpiece Not Found</h3>
        <p>We couldn't locate a book with the ID "${bookId}" in our collections.</p>
        <a href="/books.html" class="btn btn-primary">Go to Catalog</a>
      </div>
    `;
    return;
  }

  const author = authors.find(a => a.id === book.authorId);
  const authorName = author ? author.name : "Unknown Thinker";
  const bookQuotes = quotes.filter(q => q.bookId === book.id);

  // Find similar books (by category, excl current)
  let similarBooks = books.filter(b => b.id !== book.id && b.category === book.category);
  if (similarBooks.length === 0) {
    similarBooks = books.filter(b => b.id !== book.id).slice(0, 3); // Fallback to other top choices
  } else {
    similarBooks = similarBooks.slice(0, 3);
  }

  const isFav = isBookFavorite(book.id);
  const profile = getGuestProfile();
  const isFinished = profile.active && profile.finishedBooks.includes(book.id);

  container.innerHTML = `
    <div class="detail-layout">
      <!-- Left sidebar: Large cover & core meta -->
      <aside class="detail-sidebar slide-up">
        <div class="detail-cover-card" style="background: ${book.coverBg}; padding: 3.5rem 2rem; border-radius: var(--radius-md); text-align: center; color: ${book.textColor}; min-height: 420px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          <div class="editorial-cover-border" style="top: 20px; bottom: 20px; left: 20px; right: 20px;"></div>
          <span class="editorial-category" style="font-size: 0.8rem; letter-spacing: 0.15em;">${book.category}</span>
          <h1 class="font-serif" style="font-size: 2.2rem; color: inherit; line-height: 1.3; font-weight: 700;">${book.title}</h1>
          <span style="font-style: italic; font-size: 0.95rem; opacity: 0.9;">By ${authorName}</span>
        </div>

        <ul class="detail-meta-list">
          <li class="detail-meta-item">
            <span class="detail-meta-label">Author</span>
            <span class="detail-meta-val">
              <a href="/author.html?id=${book.authorId}" style="color: var(--primary-color); font-weight: 600;">${authorName}</a>
            </span>
          </li>
          <li class="detail-meta-item">
            <span class="detail-meta-label">Published</span>
            <span class="detail-meta-val">${book.year}</span>
          </li>
          <li class="detail-meta-item">
            <span class="detail-meta-label">Genre</span>
            <span class="detail-meta-val">${book.category}</span>
          </li>
          <li class="detail-meta-item">
            <span class="detail-meta-label">Rating</span>
            <span class="detail-meta-val" style="display: flex; align-items: center; gap: 0.25rem;">
              ⭐ ${book.rating.toFixed(1)} / 5.0
            </span>
          </li>
          ${profile.active 
            ? `<li class="detail-meta-item">
                 <span class="detail-meta-label">Reading Progress</span>
                 <span class="detail-meta-val" id="detail-finished-status">
                   ${isFinished ? '🎉 Finished' : '📖 In Progress'}
                 </span>
               </li>`
            : ''
          }
        </ul>
      </aside>

      <!-- Right Column: Rich details & quotes -->
      <div class="detail-main slide-up">
        <div class="detail-header">
          <h1 class="detail-title-large font-serif">${book.title}</h1>
          <p class="detail-subtitle">Written by <a href="/author.html?id=${book.authorId}" style="text-decoration: underline;">${authorName}</a></p>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="detail-fav-btn" style="${isFav ? 'background-color: #E63946; border-color: #E63946;' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>${isFav ? 'Remove from Favorites' : 'Add to Favorites'}</span>
            </button>
            
            ${profile.active 
              ? `<button class="btn btn-secondary" id="detail-finished-btn">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                   <span>${isFinished ? 'Mark as Unread' : 'Mark as Finished'}</span>
                 </button>`
              : ''
            }
          </div>
        </div>

        <div>
          <h3 class="detail-section-title font-serif">Synopsis & Analysis</h3>
          <p class="detail-description">${book.description}</p>
        </div>

        <div>
          <h3 class="detail-section-title font-serif">Inspirational Quotes (${bookQuotes.length})</h3>
          <div class="quotes-grid" style="grid-template-columns: 1fr; gap: 1.5rem;">
            ${bookQuotes.length === 0 
              ? `<p style="color: var(--text-muted); font-style: italic;">No quotes compiled for this book yet. Check back soon!</p>`
              : bookQuotes.map(q => {
                  const isQFav = isQuoteFavorite(q.id);
                  return `
                    <div class="quote-card" style="padding: 1.75rem; border-radius: var(--radius-sm);">
                      <p class="quote-card-text" style="font-size: 1.15rem;">"${q.text}"</p>
                      <div class="quote-card-actions">
                        <button class="action-icon-btn copy-quote-btn" data-text="${q.text}" title="Copy quote">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                        <button class="action-icon-btn fav-quote-btn ${isQFav ? 'active' : ''}" data-id="${q.id}" title="Save quote to favorites">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
          </div>
        </div>

        <div>
          <h3 class="detail-section-title font-serif">Recommended Suggestions</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">If you appreciated "${book.title}", you may find deep wisdom in these related works:</p>
          <div class="similar-items-grid">
            ${similarBooks.map(b => {
              const bAuthor = authors.find(auth => auth.id === b.authorId);
              return `
                <a href="/book.html?id=${b.id}" class="book-card" style="box-shadow: var(--shadow-sm); height: 100%;">
                  <div class="book-cover-wrapper" style="height: 180px;">
                    <div class="editorial-cover" style="background: ${b.coverBg}; color: ${b.textColor}; padding: 1.5rem 1rem;">
                      <span class="editorial-category" style="font-size: 0.6rem;">${b.category}</span>
                      <h4 class="editorial-title" style="font-size: 1rem;">${b.title}</h4>
                      <span class="editorial-author" style="font-size: 0.75rem;">By ${bAuthor ? bAuthor.name : 'Unknown'}</span>
                    </div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // --- ACTIONS HANDLERS ---
  const favBtn = document.getElementById('detail-fav-btn');
  favBtn.addEventListener('click', () => {
    if (isBookFavorite(book.id)) {
      removeFavoriteBook(book.id);
      favBtn.style.backgroundColor = '';
      favBtn.style.borderColor = '';
      favBtn.querySelector('span').innerText = 'Add to Favorites';
      addGuestActivity(`Removed "${book.title}" from favorites`);
    } else {
      addFavoriteBook(book.id);
      favBtn.style.backgroundColor = '#E63946';
      favBtn.style.borderColor = '#E63946';
      favBtn.querySelector('span').innerText = 'Remove from Favorites';
      addGuestActivity(`Favorited book "${book.title}"`);
    }
    // Reload dynamically to preserve consistent states
    renderBookDetailPage();
  });

  const finishBtn = document.getElementById('detail-finished-btn');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      const index = profile.finishedBooks.indexOf(book.id);
      if (index > -1) {
        profile.finishedBooks.splice(index, 1);
        addGuestActivity(`Reopened "${book.title}" to reading list.`);
        showToast(`Marked "${book.title}" as currently reading 📖`);
      } else {
        profile.finishedBooks.push(book.id);
        addGuestActivity(`Finished reading "${book.title}"!`);
        showToast(`Congratulations! Finished "${book.title}" 🎉`);
      }
      saveGuestProfile(profile);
      renderBookDetailPage();
    });
  }

  // Quotes Action inside Detail Page
  container.querySelectorAll('.copy-quote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      navigator.clipboard.writeText(`"${text}" — ${authorName} ("${book.title}")`);
      showToast("Quote text copied!");
      addGuestActivity(`Copied quote from "${book.title}"`);
    });
  });

  container.querySelectorAll('.fav-quote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (isQuoteFavorite(id)) {
        removeFavoriteQuote(id);
        btn.classList.remove('active');
        addGuestActivity(`Removed quote from "${book.title}" from favorites`);
      } else {
        addFavoriteQuote(id);
        btn.classList.add('active');
        addGuestActivity(`Favorited quote from "${book.title}"`);
      }
    });
  });
}

// ----------------------------------------------------
// 4. AUTHOR PROFILE RENDERING
// ----------------------------------------------------
export function renderAuthorProfilePage() {
  initLayout();

  const urlParams = new URLSearchParams(window.location.search);
  const authorId = urlParams.get('id');

  const container = document.getElementById('author-profile-layout-placeholder');
  if (!container) return;

  if (!authorId) {
    container.innerHTML = `
      <div class="empty-state slide-up">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <h3>No Author ID Provided</h3>
        <p>Please return to the authors browse panel and select a thinker to explore.</p>
        <a href="/books.html?focus=authors" class="btn btn-primary">Browse Authors</a>
      </div>
    `;
    return;
  }

  const author = authors.find(a => a.id === authorId);
  if (!author) {
    container.innerHTML = `
      <div class="empty-state slide-up">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <h3>Thinker Not Found</h3>
        <p>We couldn't locate an author with the ID "${authorId}" in our collection.</p>
        <a href="/books.html?focus=authors" class="btn btn-primary">Browse Authors</a>
      </div>
    `;
    return;
  }

  // Find books and quotes
  const authorBooks = books.filter(b => b.authorId === author.id);
  const authorQuotes = quotes.filter(q => {
    const b = books.find(book => book.id === q.bookId);
    return b && b.authorId === author.id;
  });

  container.innerHTML = `
    <div class="detail-layout">
      <!-- Left sidebar: Author Portrait & details -->
      <aside class="detail-sidebar slide-up">
        <div class="detail-cover-card" style="text-align: center; padding: 2rem;">
          <div class="author-photo-wrapper" style="width: 180px; height: 180px; margin-bottom: 1.5rem; border: 4px solid var(--border-color);">
            <img src="${author.photo}" alt="${author.name}" class="author-photo" referrerPolicy="no-referrer">
          </div>
          <h2 class="font-serif" style="font-size: 1.8rem; margin-bottom: 0.5rem;">${author.name}</h2>
          <p class="author-nationality" style="font-size: 0.9rem; margin-bottom: 0;">${author.nationality}</p>
        </div>

        <ul class="detail-meta-list">
          <li class="detail-meta-item">
            <span class="detail-meta-label">Nationality</span>
            <span class="detail-meta-val">${author.nationality}</span>
          </li>
          <li class="detail-meta-item">
            <span class="detail-meta-label">Books Compiled</span>
            <span class="detail-meta-val">${authorBooks.length}</span>
          </li>
          <li class="detail-meta-item">
            <span class="detail-meta-label">Compiled Quotes</span>
            <span class="detail-meta-val">${authorQuotes.length}</span>
          </li>
        </ul>
      </aside>

      <!-- Right Column: Biography, books, quotes -->
      <div class="detail-main slide-up">
        <div class="detail-header">
          <h1 class="detail-title-large font-serif">${author.name}</h1>
          <p class="detail-subtitle">Historical Philosopher & Author (${author.nationality})</p>
        </div>

        <div>
          <h3 class="detail-section-title font-serif">Biography & Intellectual Legacy</h3>
          <p class="detail-description" style="font-size: 1.05rem; line-height: 1.8; color: var(--text-color);">${author.biography}</p>
        </div>

        <div>
          <h3 class="detail-section-title font-serif">Masterpieces in Our Library (${authorBooks.length})</h3>
          <div class="books-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 2rem;">
            ${authorBooks.map(b => renderBookCardMarkup(b)).join('')}
          </div>
        </div>

        <div>
          <h3 class="detail-section-title font-serif">Compiled Philosophical Quotes (${authorQuotes.length})</h3>
          <div class="quotes-grid" style="grid-template-columns: 1fr; gap: 1.5rem;">
            ${authorQuotes.length === 0 
              ? `<p style="color: var(--text-muted); font-style: italic;">No quotes compiled for this thinker yet. Check back soon!</p>`
              : authorQuotes.map(q => {
                  const qBook = books.find(b => b.id === q.bookId);
                  const isQFav = isQuoteFavorite(q.id);
                  return `
                    <div class="quote-card" style="padding: 1.75rem; border-radius: var(--radius-sm);">
                      <p class="quote-card-text" style="font-size: 1.15rem; margin-bottom: 1rem;">"${q.text}"</p>
                      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem; flex-wrap: wrap; gap: 1rem;">
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                          In <a href="/book.html?id=${q.bookId}" style="text-decoration: underline; font-weight: 600;">"${qBook ? qBook.title : ''}"</a>
                        </span>
                        <div class="quote-card-actions" style="margin-top: 0;">
                          <button class="action-icon-btn copy-quote-btn" data-text="${q.text}" data-book="${qBook ? qBook.title : ''}" title="Copy quote">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                          <button class="action-icon-btn fav-quote-btn ${isQFav ? 'active' : ''}" data-id="${q.id}" title="Save quote to favorites">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  setupCardEventHandlers();

  // Copy/Favorite Quote Actions inside Author Page
  container.querySelectorAll('.copy-quote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      const bookName = btn.getAttribute('data-book');
      navigator.clipboard.writeText(`"${text}" — ${author.name} ("${bookName}")`);
      showToast("Quote text copied!");
      addGuestActivity(`Copied a quote from ${author.name}`);
    });
  });

  container.querySelectorAll('.fav-quote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (isQuoteFavorite(id)) {
        removeFavoriteQuote(id);
        btn.classList.remove('active');
        addGuestActivity(`Removed quote by ${author.name} from favorites`);
      } else {
        addFavoriteQuote(id);
        btn.classList.add('active');
        addGuestActivity(`Favorited quote by ${author.name}`);
      }
    });
  });
}

// ----------------------------------------------------
// 5. QUOTES BROWSER RENDERING
// ----------------------------------------------------
export function renderQuotesPage() {
  initLayout();

  let searchQuery = "";
  let activeCategory = "all";

  // Elements
  const quotesGrid = document.getElementById('catalog-quotes-grid');
  const searchInput = document.getElementById('quotes-search-input');
  const categoriesRail = document.getElementById('quotes-categories-rail');
  const countIndicator = document.getElementById('quotes-count-indicator');

  const renderCategoriesList = () => {
    if (!categoriesRail) return;
    const categories = getCategories();
    categoriesRail.innerHTML = categories.map(c => {
      const isActive = c.toLowerCase() === activeCategory.toLowerCase();
      const label = c === "all" ? "📂 All Genres" : c;
      return `
        <button class="category-pill ${isActive ? 'active' : ''}" data-cat="${c}">
          ${label}
        </button>
      `;
    }).join('');

    // Click handlers
    categoriesRail.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeCategory = pill.getAttribute('data-cat');
        renderCategoriesList();
        renderQuotes();
        addGuestActivity(`Filtered quotes by category: "${activeCategory}"`);
      });
    });
  };

  const renderQuotes = () => {
    if (!quotesGrid) return;

    // Filter matching
    const results = quotes.filter(q => {
      const book = books.find(b => b.id === q.bookId);
      const author = book ? authors.find(a => a.id === book.authorId) : null;

      const matchesCategory = activeCategory === "all" || (book && book.category.toLowerCase() === activeCategory.toLowerCase());

      const normQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = !normQuery ||
        q.text.toLowerCase().includes(normQuery) ||
        (book && book.title.toLowerCase().includes(normQuery)) ||
        (author && author.name.toLowerCase().includes(normQuery));

      return matchesCategory && matchesSearch;
    });

    if (results.length === 0) {
      quotesGrid.innerHTML = `
        <div class="empty-state slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <h3>No Quotes Found</h3>
          <p>We couldn't find any quotes matching your current query or category filters.</p>
          <button class="btn btn-primary btn-sm" id="reset-quotes-filters-btn">Reset All Filters</button>
        </div>
      `;
      countIndicator.innerText = "No quotes found";

      document.getElementById('reset-quotes-filters-btn').addEventListener('click', () => {
        searchQuery = "";
        activeCategory = "all";
        if (searchInput) searchInput.value = "";
        renderCategoriesList();
        renderQuotes();
      });
      return;
    }

    quotesGrid.innerHTML = results.map(q => {
      const qBook = books.find(b => b.id === q.bookId);
      const qAuthor = qBook ? authors.find(a => a.id === qBook.authorId) : null;
      const isQFav = isQuoteFavorite(q.id);

      return `
        <div class="quote-card slide-up" style="padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
          <p class="quote-card-text" style="font-size: 1.4rem; line-height: 1.6;">"${q.text}"</p>
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div class="quote-card-meta" style="margin-top: 0;">
              ${qBook ? `<a href="/book.html?id=${qBook.id}" class="quote-card-book">"${qBook.title}"</a>` : ''}
              ${qAuthor ? `<a href="/author.html?id=${qAuthor.id}" class="quote-card-author">— ${qAuthor.name}</a>` : ''}
            </div>
            
            <div class="quote-card-actions" style="margin-top: 0;">
              <button class="action-icon-btn copy-quote-btn" data-text="${q.text}" data-author="${qAuthor ? qAuthor.name : 'Unknown'}" data-book="${qBook ? qBook.title : ''}" title="Copy quote">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="action-icon-btn fav-quote-btn ${isQFav ? 'active' : ''}" data-id="${q.id}" title="Save quote to favorites">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    countIndicator.innerText = `Showing ${results.length} of ${quotes.length} inspirational reflections`;

    // Hook up individual buttons inside quotes grid
    quotesGrid.querySelectorAll('.copy-quote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const authName = btn.getAttribute('data-author');
        const bookName = btn.getAttribute('data-book');
        navigator.clipboard.writeText(`"${text}" — ${authName} ("${bookName}")`);
        showToast("Quote text copied!");
        addGuestActivity(`Copied quote from "${bookName}"`);
      });
    });

    quotesGrid.querySelectorAll('.fav-quote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const quote = quotes.find(q => q.id === id);
        if (!quote) return;

        if (isQuoteFavorite(id)) {
          removeFavoriteQuote(id);
          btn.classList.remove('active');
          addGuestActivity(`Removed quote from favorites`);
        } else {
          addFavoriteQuote(id);
          btn.classList.add('active');
          addGuestActivity(`Favorited quote`);
        }
      });
    });
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderQuotes();
    });
  }

  renderCategoriesList();
  renderQuotes();
}

// ----------------------------------------------------
// 6. FAVORITES NOTEBOOK RENDERING
// ----------------------------------------------------
export function renderFavoritesPage() {
  initLayout();

  let activeTab = "books";

  // Elements
  const tabBooks = document.getElementById('tab-fav-books');
  const tabQuotes = document.getElementById('tab-fav-quotes');
  const sectionBooks = document.getElementById('fav-books-section');
  const sectionQuotes = document.getElementById('fav-quotes-section');

  const booksGrid = document.getElementById('favorites-books-grid');
  const quotesGrid = document.getElementById('favorites-quotes-grid');

  const switchTab = (tab) => {
    activeTab = tab;
    if (tab === 'books') {
      tabBooks.className = "btn btn-primary";
      tabQuotes.className = "btn btn-secondary";
      sectionBooks.style.display = 'block';
      sectionQuotes.style.display = 'none';
      renderFavBooks();
    } else {
      tabBooks.className = "btn btn-secondary";
      tabQuotes.className = "btn btn-primary";
      sectionBooks.style.display = 'none';
      sectionQuotes.style.display = 'block';
      renderFavQuotes();
    }
  };

  const renderFavBooks = () => {
    if (!booksGrid) return;
    const favIds = getFavoriteBooks();
    const resolvedBooks = books.filter(b => favIds.includes(b.id));

    if (resolvedBooks.length === 0) {
      booksGrid.innerHTML = `
        <div class="empty-state slide-up" style="grid-column: 1 / -1; padding: 4rem 2rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
          <h3>Your Library is Empty</h3>
          <p>You haven't added any literary masterpieces to your saved shelf yet. Discover classic works now!</p>
          <a href="/books.html" class="btn btn-primary">Discover Books</a>
        </div>
      `;
      return;
    }

    booksGrid.innerHTML = resolvedBooks.map(b => renderBookCardMarkup(b)).join('');

    // Override favorite button click handlers for instant responsive removal
    booksGrid.querySelectorAll('.fav-book-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const bk = books.find(b => b.id === id);
        removeFavoriteBook(id);
        renderFavBooks(); // Reactive re-render!
        showToast(`Removed "${bk ? bk.title : 'book'}" from saved list.`);
        addGuestActivity(`Removed "${bk ? bk.title : 'book'}" from favorites`);
      });
    });

    // Setup other handlers (finished toggle, view details, etc)
    setupCardEventHandlers();
  };

  const renderFavQuotes = () => {
    if (!quotesGrid) return;
    const favIds = getFavoriteQuotes();
    const resolvedQuotes = quotes.filter(q => favIds.includes(q.id));

    if (resolvedQuotes.length === 0) {
      quotesGrid.innerHTML = `
        <div class="empty-state slide-up" style="padding: 4rem 2rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9.09 9 1-1h1.5l1 1v1.5l-1 1H11v1.5"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          <h3>No Saved Reflections</h3>
          <p>Your philosophical notebook is empty. Browse compiling quotes from classic authors to build your notebook.</p>
          <a href="/quotes.html" class="btn btn-primary">Browse Quotes</a>
        </div>
      `;
      return;
    }

    quotesGrid.innerHTML = resolvedQuotes.map(q => {
      const qBook = books.find(b => b.id === q.bookId);
      const qAuthor = qBook ? authors.find(a => a.id === qBook.authorId) : null;

      return `
        <div class="quote-card slide-up" style="padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
          <p class="quote-card-text" style="font-size: 1.4rem; line-height: 1.6;">"${q.text}"</p>
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div class="quote-card-meta" style="margin-top: 0;">
              ${qBook ? `<a href="/book.html?id=${qBook.id}" class="quote-card-book">"${qBook.title}"</a>` : ''}
              ${qAuthor ? `<a href="/author.html?id=${qAuthor.id}" class="quote-card-author">— ${qAuthor.name}</a>` : ''}
            </div>
            
            <div class="quote-card-actions" style="margin-top: 0;">
              <button class="action-icon-btn copy-quote-btn" data-text="${q.text}" data-author="${qAuthor ? qAuthor.name : 'Unknown'}" data-book="${qBook ? qBook.title : ''}" title="Copy quote">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="action-icon-btn fav-quote-btn active" data-id="${q.id}" title="Remove quote from favorites">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Click handler overrides for instant reactive removal
    quotesGrid.querySelectorAll('.copy-quote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const authName = btn.getAttribute('data-author');
        const bookName = btn.getAttribute('data-book');
        navigator.clipboard.writeText(`"${text}" — ${authName} ("${bookName}")`);
        showToast("Quote text copied!");
        addGuestActivity(`Copied saved quote from "${bookName}"`);
      });
    });

    quotesGrid.querySelectorAll('.fav-quote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        removeFavoriteQuote(id);
        renderFavQuotes(); // Reactive re-render!
        showToast("Removed quote from notebook.");
        addGuestActivity(`Removed a quote from favorites`);
      });
    });
  };

  tabBooks.addEventListener('click', () => switchTab('books'));
  tabQuotes.addEventListener('click', () => switchTab('quotes'));

  switchTab(activeTab);
}

// ----------------------------------------------------
// 7. ABOUT PAGE RENDERING
// ----------------------------------------------------
export function renderAboutPage() {
  initLayout();

  const bCount = document.getElementById('about-books-count');
  const qCount = document.getElementById('about-quotes-count');
  const aCount = document.getElementById('about-authors-count');

  if (bCount) bCount.innerText = books.length;
  if (qCount) qCount.innerText = quotes.length;
  if (aCount) aCount.innerText = authors.length;
}
