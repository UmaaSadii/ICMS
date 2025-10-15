// src/api/libraryService.ts
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api/library";

export const libraryService = {
  getBooks: () => axios.get(`${API_BASE}/books/`),              // GET list
  getBook: (id: number) => axios.get(`${API_BASE}/books/${id}/`),
  createBook: (data: any) => axios.post(`${API_BASE}/books/`, data),
  updateBook: (id: number, data: any) => axios.put(`${API_BASE}/books/${id}/`, data),
  deleteBook: (id: number) => axios.delete(`${API_BASE}/books/${id}/`),
  borrowBook: (id: number) => axios.post(`${API_BASE}/books/${id}/borrow/`),
  returnBook: (id: number) => axios.post(`${API_BASE}/books/${id}/return_book/`)
};