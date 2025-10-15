import React, { useEffect, useState } from 'react';
import transportService from '../../api/transportService';
import { useAuth } from '../../context/AuthContext';

const StudentTransportPage = () => {
  const { currentUser } = useAuth();
  const [assignment, setAssignment] = useState<any>(null);
  useEffect(()=>{
    const load = async () => {
      if (!currentUser) return;
      try {
        const resp = await transportService.getStudentTransports({ student: currentUser.id });
        setAssignment(resp.data[0] ?? null);
      } catch (err) { console.error(err); setAssignment(null); }
    };
    load();
  }, [currentUser]);

  if (!currentUser) return <p>Please log in</p>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">My Transport</h2>
      {!assignment ? <p className="mt-4">No transport assigned.</p> : (
        <div className="mt-4 bg-white p-4 rounded shadow">
          <p><strong>Bus:</strong> {(assignment.bus as any)?.number_plate || assignment.bus}</p>
          <p><strong>Driver:</strong> {(assignment.bus as any)?.driver_name || '—'}</p>
          <p><strong>Pickup point:</strong> {assignment.pickup_point}</p>
          <p><strong>Route:</strong> {(assignment.bus as any)?.route?.name || '—'}</p>
        </div>
      )}
    </div>
  );
};

export default StudentTransportPage;