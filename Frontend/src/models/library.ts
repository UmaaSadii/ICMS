// src/types/library.ts
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category?: string | null;
  available_copies: number;
  created_at?: string;
}