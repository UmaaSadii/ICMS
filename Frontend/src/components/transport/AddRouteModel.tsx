import React, { useState } from "react";
import  transportService  from "../../api/transportService";

type Props = { isOpen: boolean; onClose: () => void; onSaved: () => void; initial?: any };

const AddRouteModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initial }) => {
  const [name, setName] = useState(initial?.name || "");
  const [start, setStart] = useState(initial?.start_point || "");
  const [end, setEnd] = useState(initial?.end_point || "");
  const [stops, setStops] = useState(initial?.stops || "");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, start_point: start, end_point: end, stops };
      if (initial?.id) await transportService.updateRoute(initial.id, payload);
      else await transportService.createRoute(payload);
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded w-96">
        <h3 className="text-lg font-semibold mb-2">{initial?.id ? "Edit Route" : "Add Route"}</h3>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Route Name" required className="w-full mb-2 p-2 border" />
        <input value={start} onChange={e=>setStart(e.target.value)} placeholder="Start Point" required className="w-full mb-2 p-2 border" />
        <input value={end} onChange={e=>setEnd(e.target.value)} placeholder="End Point" required className="w-full mb-2 p-2 border" />
        <input value={stops} onChange={e=>setStops(e.target.value)} placeholder="Stops (comma separated)" className="w-full mb-2 p-2 border" />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRouteModal;