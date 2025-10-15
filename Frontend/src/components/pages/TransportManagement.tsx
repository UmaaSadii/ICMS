import React, { useEffect, useState } from 'react';
import transportService from '../../api/transportService';
import RouteCard from '../transport/RouteCard';
import BusCard from '../transport/BusCard';
import AddRouteModal from '../transport/AddRouteModel';
import AddBusModal from '../transport/AddBusModel';
import AssignTransportModal from '../transport/AssignTransportModel';
import { TransportRoute, Bus } from '../../models/transport';
import { useAuth } from '../../context/AuthContext';

const TransportManagement: React.FC<{ activeTab?: string }> = ({ activeTab }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);

  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rres, bres] = await Promise.all([transportService.getRoutes(), transportService.getBuses()]);
      setRoutes(rres.data);
      setBuses(bres.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(()=> {
    if (activeTab && activeTab !== 'transport') return;
    fetchAll();
  }, [activeTab]);

  // handlers...
  const handleDeleteRoute = async (id: number) => { if (!window.confirm('Delete route?')) return; await transportService.deleteRoute(id); fetchAll(); };
  const handleDeleteBus = async (id: number) => { if (!window.confirm('Delete bus?')) return; await transportService.deleteBus(id); fetchAll(); };

  if (activeTab && activeTab !== 'transport') return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transport Management</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={()=>{ setEditingRoute(null); setShowRouteModal(true); }} className="px-3 py-2 bg-green-600 text-white rounded">Add Route</button>
            <button onClick={()=>{ setEditingBus(null); setShowBusModal(true); }} className="px-3 py-2 bg-blue-600 text-white rounded">Add Bus</button>
            <button onClick={()=>setShowAssignModal(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Assign</button>
          </div>
        )}
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Routes</h3>
            <div className="grid gap-3">
              {routes.map(r => <RouteCard key={r.id} route={r} onEdit={(x)=>{ setEditingRoute(x); setShowRouteModal(true); }} onDelete={handleDeleteRoute} />)}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Buses</h3>
            <div className="grid gap-3">
              {buses.map(b => <BusCard key={b.id} bus={b} onEdit={(x)=>{ setEditingBus(x); setShowBusModal(true); }} onDelete={handleDeleteBus} />)}
            </div>
          </div>
        </div>
      )}

      {showRouteModal && <AddRouteModal isOpen={showRouteModal} initial={editingRoute || undefined} onClose={()=>{ setShowRouteModal(false); setEditingRoute(null); }} onSaved={()=>fetchAll()} /> }
      {showBusModal && <AddBusModal isOpen={showBusModal} initial={editingBus || undefined} onClose={()=>{ setShowBusModal(false); setEditingBus(null); }} onSaved={()=>fetchAll()} /> }
      {showAssignModal && <AssignTransportModal isOpen={showAssignModal} onClose={()=>setShowAssignModal(false)} onSaved={()=>fetchAll()} />}
    </div>
  );
};

export default TransportManagement;