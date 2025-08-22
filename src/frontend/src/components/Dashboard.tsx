import { useState } from 'react';
import { 
  RefreshCw, 
  MapPin, 
  Thermometer, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TemperatureCard } from './TemperatureCard';
import AlertsView from './AlertsView';
import { TemperatureCharts } from './TemperatureCharts';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorDisplay } from './ui/ErrorDisplay';

export function Dashboard() {
  const { 
    cidades, 
    estatisticas, 
    loading, 
    refreshData 
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'charts'>('overview');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading.isLoading) {
    return <LoadingSpinner />;
  }

  if (loading.error) {
    return <ErrorDisplay error={loading.error} onRetry={refreshData} />;
  }

  const cidadesAtivas = cidades.filter(c => c.ativa);
  const cidadesComTemperatura = cidadesAtivas.filter(c => c.temperatura_atual);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Sistema de Monitoramento Meteorológico
              </h1>
              <p className="text-slate-600">
                Monitoramento em tempo real das condições climáticas
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Visão Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Alertas</span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'charts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Gráficos</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            {estatisticas && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Cidades Monitoradas
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {estatisticas.cidades_ativas}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm text-green-600">
                    <span>
                      {cidadesComTemperatura.length} com dados atuais
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Temperatura Média
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {estatisticas.temp_media_1h?.toFixed(1) || '---'}°C
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Thermometer className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-blue-600">
                      Min: {estatisticas.temp_min_1h?.toFixed(1) || '---'}°C
                    </span>
                    <span className="text-red-600">
                      Max: {estatisticas.temp_max_1h?.toFixed(1) || '---'}°C
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Registros (24h)
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {estatisticas.temperaturas_24h}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm text-slate-600">
                    <span>
                      Última hora: {Math.round(estatisticas.temperaturas_24h / 24)} registros
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Alertas (24h)
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {estatisticas.alertas_24h}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    {estatisticas.alertas_24h > 0 ? (
                      <span className="text-orange-600">Requer atenção</span>
                    ) : (
                      <span className="text-green-600">Tudo normal</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Temperature Cards Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Temperaturas por Cidade
              </h2>
              
              {cidadesComTemperatura.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Thermometer className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">
                    Nenhuma cidade com dados de temperatura disponíveis
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Verifique se as cidades estão ativas e com coleta de dados funcionando
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cidadesComTemperatura.map((cidade) => (
                    <TemperatureCard 
                      key={cidade.id} 
                      cidade={cidade}
                      loading={refreshing}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Status Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Status do Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-sm font-medium text-slate-900">Sistema Online</p>
                  <p className="text-xs text-slate-500">Operando normalmente</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Coleta Ativa</p>
                  <p className="text-xs text-slate-500">Dados atualizados</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                    <RefreshCw className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Auto-refresh</p>
                  <p className="text-xs text-slate-500">A cada 5 minutos</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'alerts' && (
          <AlertsView />
        )}

        {activeTab === 'charts' && (
          <TemperatureCharts />
        )}
      </div>
    </div>
  );
}
