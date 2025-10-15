import React from 'react';
import { TransportRoute } from '../../models/transport';

type Props = {
  route: TransportRoute;
  onEdit?: (r: TransportRoute) => void;
  onDelete?: (id: number) => void;
};

const RouteCard: React.FC<Props> = ({ route, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow p-4 border">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="text-lg font-semibold">{route.name}</h4>
        <p className="text-sm text-gray-600">{route.start_point} → {route.end_point}</p>
        <p className="text-xs text-gray-500 mt-2">Stops: {route.stops || '—'}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={() => onEdit && onEdit(route)} className="text-sm px-2 py-1 bg-blue-600 text-white rounded">Edit</button>
        <button onClick={() => onDelete && route.id && onDelete(route.id)} className="text-sm px-2 py-1 bg-red-600 text-white rounded">Delete</button>
      </div>
    </div>
  </div>
);

export default RouteCard;