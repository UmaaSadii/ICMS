import React, { useEffect, useState } from "react";
import { libraryService } from "../../api/libraryService";
import BookCard from "../library/BookCard";
import AddBookModal from "../library/AddBookModel";
import { Book } from "../../models/library";
import { useAuth } from "../../context/AuthContext";

const LibraryManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await libraryService.getBooks();
      setBooks(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBorrow = async (id: number) => {
    try {
      await libraryService.borrowBook(id);
      fetchBooks();
    } catch (err) {
      console.error(err);
      setError("Borrow failed");
    }
  };

  const handleReturn = async (id: number) => {
    try {
      await libraryService.returnBook(id);
      fetchBooks();
    } catch (err) {
      console.error(err);
      setError("Return failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      await libraryService.deleteBook(id);
      fetchBooks();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  };

  // ✅ Stats calculation
  const totalBooks = books.length;
  const availableBooks = books.reduce((sum, b) => sum + b.available_copies, 0);
  const borrowedBooks = totalBooks > 0 ? totalBooks - availableBooks : 0;

  return (
    <div className="space-y-8">
      {/* ✅ Header with gradient like Department */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Library Management</h2>
          <p className="text-green-100">Manage books, borrowing and returning</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingBook(null);
              setShowAdd(true);
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-all"
          >
            + Add Book
          </button>
        )}
      </div>

      {/* ✅ Stats Cards like Department */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Total Books</h3>
          <p className="text-3xl font-bold text-green-600">{totalBooks}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Available</h3>
          <p className="text-3xl font-bold text-blue-600">{availableBooks}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Borrowed</h3>
          <p className="text-3xl font-bold text-red-600">{borrowedBooks}</p>
        </div>
      </div>

      {/* ✅ Error Message */}
      {error && <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>}

      {/* ✅ Books Grid */}
      {loading ? (
        <p className="text-gray-600">Loading books...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {books.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              onBorrow={handleBorrow}
              onReturn={handleReturn}
              onEdit={(bk) => {
                setEditingBook(bk);
                setShowAdd(true);
              }}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* ✅ Modal */}
      {showAdd && (
        <AddBookModal
          isOpen={showAdd}
          initial={editingBook || undefined}
          onClose={() => setShowAdd(false)}
          onSaved={() => fetchBooks()}
        />
      )}
    </div>
  );
};

export default LibraryManagement;