import { useState, useEffect } from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';

function AlertsView() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Sistema de Alertas</h2>
      </div>
      
      <div className="text-center text-gray-500 py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum alerta ativo</p>
        <p className="text-sm">Sistema funcionando normalmente</p>
      </div>
    </div>
  );
}

export default AlertsView;
