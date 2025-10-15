import React, { useEffect, useState } from 'react';
import transportService from '../../api/transportService';
import { Bus, StudentTransport } from '../../models/transport';
import { studentService } from '../../api/apiService';

type Props = { isOpen: boolean; onClose: ()=>void; onSaved: ()=>void; initial?: StudentTransport };

const AssignTransportModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initial }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  // ✅ studentId string hamesha (API string bhejti hai)
  const [studentId, setStudentId] = useState<string>(
    typeof initial?.student === "string"
      ? initial.student
      : (initial?.student as any)?.id ?? ""
  );

  // ✅ busId number hamesha
  const [busId, setBusId] = useState<number | null>(
    typeof initial?.bus === "number"
      ? initial.bus
      : (initial?.bus as any)?.id ?? null
  );

  const [pickupPoint, setPickupPoint] = useState(initial?.pickup_point || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    studentService.getAllStudents()
      .then(r => setStudents(r.data))
      .catch(() => setStudents([]));

    transportService.getBuses()
      .then(r => setBuses(r.data))
      .catch(() => setBuses([]));
  }, []);

  useEffect(() => {
    setStudentId(
      typeof initial?.student === "string"
        ? initial.student
        : (initial?.student as any)?.id ?? ""
    );
    setBusId(
      typeof initial?.bus === "number"
        ? initial.bus
        : (initial?.bus as any)?.id ?? null
    );
    setPickupPoint(initial?.pickup_point || "");
  }, [initial]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !busId) return alert("Select student and bus!");
    setSaving(true);
    try {
      // ✅ Student string, Bus number
      const payload: StudentTransport = {
  student: studentId.toString(), 
  bus: busId,
  pickup_point: pickupPoint
};
      if (initial?.id) {
        await transportService.updateStudentTransport(initial.id, payload);
      } else {
        await transportService.assignTransport(payload);
      }
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
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded w-[560px]">
        <h3 className="text-xl font-semibold mb-4">
          {initial?.id ? "Update assignment" : "Assign Transport to Student"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Student select */}
          <select
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="p-2 border col-span-2"
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {/* agar API "id" string bhejti hai to woh show karega */}
                {s.user?.first_name} {s.user?.last_name} ({s.id})
              </option>
            ))}
          </select>

          {/* Bus select */}
          <select
            required
            value={busId ?? ""}
            onChange={(e) => setBusId(e.target.value ? Number(e.target.value) : null)}
            className="p-2 border"
          >
            <option value="">Select bus</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.number_plate} — {typeof b.route === "object" ? (b.route as any).name : b.route}
              </option>
            ))}
          </select>

          {/* Pickup point */}
          <input
            required
            value={pickupPoint}
            onChange={(e) => setPickupPoint(e.target.value)}
            placeholder="Pickup point"
            className="p-2 border col-span-2"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {saving ? "Saving..." : "Assign"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignTransportModal;