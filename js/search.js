import { books } from './books.js';
import { authors } from './authors.js';
import { quotes } from './quotes.js';

export function searchBooks(query = "", category = "all", sortBy = "default") {
  let filtered = [...books];
  const cleanQuery = query.toLowerCase().trim();

  // 1. Text Search
  if (cleanQuery) {
    filtered = filtered.filter(b => {
      const author = authors.find(a => a.id === b.authorId);
      const authorName = author ? author.name.toLowerCase() : "";
      return b.title.toLowerCase().includes(cleanQuery) || 
             b.category.toLowerCase().includes(cleanQuery) || 
             authorName.includes(cleanQuery) ||
             b.description.toLowerCase().includes(cleanQuery);
    });
  }

  // 2. Category Filter
  if (category && category !== "all") {
    filtered = filtered.filter(b => b.category.toLowerCase() === category.toLowerCase());
  }

  // 3. Sorting
  if (sortBy === "title-asc") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "title-desc") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortBy === "rating-desc") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "year-desc") {
    filtered.sort((a, b) => b.year - a.year);
  } else if (sortBy === "year-asc") {
    filtered.sort((a, b) => a.year - b.year);
  }

  return filtered;
}

export function searchQuotes(query = "", category = "all") {
  let filtered = [...quotes];
  const cleanQuery = query.toLowerCase().trim();

  // Join quotes with book and author metadata for matching
  filtered = filtered.map(q => {
    const book = books.find(b => b.id === q.bookId);
    const author = book ? authors.find(a => a.id === book.authorId) : null;
    return {
      ...q,
      bookTitle: book ? book.title : "",
      authorName: author ? author.name : "",
      category: book ? book.category : ""
    };
  });

  // 1. Text Search
  if (cleanQuery) {
    filtered = filtered.filter(q => {
      return q.text.toLowerCase().includes(cleanQuery) ||
             q.bookTitle.toLowerCase().includes(cleanQuery) ||
             q.authorName.toLowerCase().includes(cleanQuery);
    });
  }

  // 2. Category Filter
  if (category && category !== "all") {
    filtered = filtered.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }

  return filtered;
}

export function searchAuthors(query = "") {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [...authors];

  return authors.filter(a => {
    return a.name.toLowerCase().includes(cleanQuery) ||
           a.nationality.toLowerCase().includes(cleanQuery) ||
           a.biography.toLowerCase().includes(cleanQuery);
  });
}

// Get unique categories list
export function getCategories() {
  const cats = books.map(b => b.category);
  return ["all", ...new Set(cats)];
}
