import React from 'react';
import { Bus } from '../../models/transport';

type Props = {
  bus: Bus;
  onEdit?: (b: Bus) => void;
  onDelete?: (id: number) => void;
};

const BusCard: React.FC<Props> = ({ bus, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow p-4 border">
    <div className="flex justify-between">
      <div>
        <h4 className="text-lg font-semibold">{bus.number_plate}</h4>
        <p className="text-sm text-gray-600">{bus.driver_name} — {bus.contact || 'No contact'}</p>
        <p className="text-xs text-gray-500 mt-2">Capacity: {bus.capacity} • Route: {typeof bus.route === 'object' ? (bus.route as any).name : bus.route || '—'}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={() => onEdit && onEdit(bus)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
        <button onClick={() => onDelete && bus.id && onDelete(bus.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
      </div>
    </div>
  </div>
);

export default BusCard;