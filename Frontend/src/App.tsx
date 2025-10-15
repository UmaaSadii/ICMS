import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DepartmentProvider } from './context/DepartmentContext';
import AppRoutes from './routes';

const App = () => {
  return (
    <AuthProvider>
      <DepartmentProvider>
        <AppRoutes />
      </DepartmentProvider>
    </AuthProvider>
  );
};

export default App;
