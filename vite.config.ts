import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          books: path.resolve(__dirname, 'books.html'),
          book: path.resolve(__dirname, 'book.html'),
          author: path.resolve(__dirname, 'author.html'),
          quotes: path.resolve(__dirname, 'quotes.html'),
          favorites: path.resolve(__dirname, 'favorites.html'),
          about: path.resolve(__dirname, 'about.html'),
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
