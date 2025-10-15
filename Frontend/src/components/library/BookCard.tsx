import React from "react";
import { Book } from "../../models/library";

type Props = {
  book: Book;
  onBorrow: (id: number) => Promise<void>;
  onReturn: (id: number) => Promise<void>;
  onEdit?: (book: Book) => void;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
};

const BookCard: React.FC<Props> = ({ book, onBorrow, onReturn, onEdit, onDelete, isAdmin }) => {
  return (
    <div className="bg-white border rounded-xl shadow-md hover:shadow-lg transition p-4">
      {/* Book Info */}
      <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
      <p className="text-sm text-gray-600">Author: {book.author}</p>
      <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
      <p className="text-sm text-gray-600">Category: {book.category || "—"}</p>
      <p className="text-sm text-gray-600">
        Available:{" "}
        <span
          className={
            book.available_copies > 0
              ? "text-green-600 font-medium"
              : "text-red-600 font-medium"
          }
        >
          {book.available_copies}
        </span>
      </p>

      {/* Buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {book.available_copies > 0 ? (
          <button
            onClick={() => onBorrow(book.id)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            Borrow
          </button>
        ) : (
          <button
            disabled
            className="px-3 py-1 bg-gray-300 text-gray-600 text-sm rounded-md cursor-not-allowed"
          >
            Not Available
          </button>
        )}

        <button
          onClick={() => onReturn(book.id)}
          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600"
        >
          Return
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => onEdit && onEdit(book)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete && onDelete(book.id)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookCard;