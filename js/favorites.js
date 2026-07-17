// Favorites management with LocalStorage and Toast Notifications

export function getFavoriteBooks() {
  const favs = localStorage.getItem('fav_books');
  return favs ? JSON.parse(favs) : [];
}

export function addFavoriteBook(bookId) {
  const favs = getFavoriteBooks();
  if (!favs.includes(bookId)) {
    favs.push(bookId);
    localStorage.setItem('fav_books', JSON.stringify(favs));
    showToast("Added to Favorite Books 📖");
  }
}

export function removeFavoriteBook(bookId) {
  let favs = getFavoriteBooks();
  favs = favs.filter(id => id !== bookId);
  localStorage.setItem('fav_books', JSON.stringify(favs));
  showToast("Removed from Favorite Books 📖");
}

export function isBookFavorite(bookId) {
  return getFavoriteBooks().includes(bookId);
}

export function getFavoriteQuotes() {
  const favs = localStorage.getItem('fav_quotes');
  return favs ? JSON.parse(favs) : [];
}

export function addFavoriteQuote(quoteId) {
  const favs = getFavoriteQuotes();
  if (!favs.includes(quoteId)) {
    favs.push(quoteId);
    localStorage.setItem('fav_quotes', JSON.stringify(favs));
    showToast("Added to Favorite Quotes ✨");
  }
}

export function removeFavoriteQuote(quoteId) {
  let favs = getFavoriteQuotes();
  favs = favs.filter(id => id !== quoteId);
  localStorage.setItem('fav_quotes', JSON.stringify(favs));
  showToast("Removed from Favorite Quotes ✨");
}

export function isQuoteFavorite(quoteId) {
  return getFavoriteQuotes().includes(quoteId);
}

// Global Toast Notification Helper
export function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-5 py-3 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 flex items-center gap-3 transition-all duration-300 transform translate-y-4 opacity-0 font-body text-sm pointer-events-auto';
  
  // Custom styled SVG for checkmark
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 focus:outline-none" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
