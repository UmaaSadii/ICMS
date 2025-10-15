import React, { useState } from "react";
import { libraryService } from "../../api/libraryService";

type Props = { 
  isOpen: boolean; 
  onClose: () => void; 
  onSaved: () => void; 
  initial?: any 
};

const AddBookModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initial }) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [isbn, setIsbn] = useState(initial?.isbn || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [copies, setCopies] = useState(initial?.available_copies ?? 1);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title, author, isbn, category, available_copies: copies };
      if (initial?.id) await libraryService.updateBook(initial.id, payload);
      else await libraryService.createBook(payload);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 animate-fadeIn"
      >
        {/* Modal Header */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {initial?.id ? "Edit Book" : "Add New Book"}
        </h3>

        {/* Form Fields */}
        <div className="space-y-3">
          <input 
            required 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
            placeholder="Book Title" 
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            required 
            value={author} 
            onChange={e=>setAuthor(e.target.value)} 
            placeholder="Author Name" 
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            required 
            value={isbn} 
            onChange={e=>setIsbn(e.target.value)} 
            placeholder="ISBN" 
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            value={category} 
            onChange={e=>setCategory(e.target.value)} 
            placeholder="Category (optional)" 
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="number" 
            min={0} 
            value={copies} 
            onChange={e=>setCopies(Number(e.target.value))} 
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Available Copies"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookModal;