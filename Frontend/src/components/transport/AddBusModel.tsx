import React, { useState, useEffect } from 'react';
import transportService from '../../api/transportService';
import { Bus, TransportRoute } from '../../models/transport';

type Props = { isOpen: boolean; onClose: ()=>void; onSaved: ()=>void; initial?: Bus };

const AddBusModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initial })=> {
  const [number_plate, setNumberPlate] = useState(initial?.number_plate || '');
  const [capacity, setCapacity] = useState(initial?.capacity ?? 30);
  const [driver_name, setDriverName] = useState(initial?.driver_name || '');
  const [contact, setContact] = useState(initial?.contact || '');
  const [route, setRoute] = useState<number | undefined>(typeof initial?.route === 'number' ? initial?.route : (initial?.route as any)?.id);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    transportService.getRoutes().then(r=>setRoutes(r.data)).catch(()=>setRoutes([]));
  }, []);

  useEffect(()=> {
    setNumberPlate(initial?.number_plate || '');
    setCapacity(initial?.capacity ?? 30);
    setDriverName(initial?.driver_name || '');
    setContact(initial?.contact || '');
    setRoute(typeof initial?.route === 'number' ? initial?.route : (initial?.route as any)?.id);
  }, [initial]);

  if (!isOpen) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Bus = { number_plate, capacity, driver_name, contact, route };
      if (initial?.id) await transportService.updateBus(initial.id, payload);
      else await transportService.createBus(payload);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-6 rounded w-[520px]">
        <h3 className="text-xl font-semibold mb-4">{initial?.id ? 'Edit Bus' : 'Add Bus'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <input required value={number_plate} onChange={(e)=>setNumberPlate(e.target.value)} placeholder="Number plate" className="p-2 border" />
          <input type="number" required value={capacity} onChange={(e)=>setCapacity(Number(e.target.value))} placeholder="Capacity" className="p-2 border" />
          <input required value={driver_name} onChange={(e)=>setDriverName(e.target.value)} placeholder="Driver name" className="p-2 border col-span-2" />
          <input value={contact} onChange={(e)=>setContact(e.target.value)} placeholder="Contact" className="p-2 border" />
          <select value={route ?? ''} onChange={(e)=>setRoute(Number(e.target.value) || undefined)} className="p-2 border">
            <option value="">Select route (optional)</option>
            {routes.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddBusModal;