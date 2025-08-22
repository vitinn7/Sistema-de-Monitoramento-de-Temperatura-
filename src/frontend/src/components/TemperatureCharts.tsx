import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, Thermometer, Droplets, Calendar, MapPin } from 'lucide-react';
import { apiClient } from '../services/api';
import type { ChartDataPoint, Cidade } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorDisplay } from './ui/ErrorDisplay';

interface TemperatureChartsProps {
  cidadeId?: number;
  periodo?: '6h' | '12h' | '24h' | '7d' | '30d';
  className?: string;
}

export const TemperatureCharts: React.FC<TemperatureChartsProps> = ({
  cidadeId,
  periodo = '24h',
  className = ''
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(periodo);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [selectedCidadeId, setSelectedCidadeId] = useState<number | null>(cidadeId || null);

  const fetchCidades = async () => {
    try {
      const response = await apiClient.request<Cidade[]>('GET', '/cidades');
      if (response.success) {
        setCidades(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar cidades:', err);
    }
  };

  const fetchChartData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const endpoint = selectedCidadeId 
        ? `/temperaturas/historico/${selectedCidadeId}` 
        : '/temperaturas/historico';
        
      const response = await apiClient.request<any[]>('GET', endpoint + `?periodo=${selectedPeriod}&limit=100`);

      if (response.success) {
        const data = response.data.map((item: any) => ({
          timestamp: item.data_hora,
          temperatura: item.temperatura,
          sensacao_termica: item.sensacao_termica,
          umidade: item.umidade,
          pressao: item.pressao,
          velocidade_vento: item.velocidade_vento,
          cidade_nome: item.cidade_nome
        }));

        setChartData(data);
      } else {
        setError('Erro ao carregar dados do gráfico');
      }
    } catch (err) {
      setError('Erro ao carregar dados do gráfico');
      console.error('Erro ao carregar dados do gráfico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCidades();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [selectedCidadeId, selectedPeriod]);

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (selectedPeriod === '6h' || selectedPeriod === '12h') {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (selectedPeriod === '24h') {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleString('pt-BR');
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="font-medium text-gray-900 mb-2">
            {formatTooltipLabel(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.dataKey === 'temperatura' || entry.dataKey === 'sensacao_termica' ? '°C' :
               entry.dataKey === 'umidade' ? '%' :
               entry.dataKey === 'pressao' ? ' hPa' :
               entry.dataKey === 'velocidade_vento' ? ' km/h' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatsFromData = () => {
    if (chartData.length === 0) {
      return {
        tempMin: 0,
        tempMax: 0,
        tempMedia: 0,
        umidadeMedia: 0
      };
    }

    // Ensure we're working with numbers, converting strings if necessary
    const temperaturas = chartData
      .map(d => typeof d.temperatura === 'string' ? parseFloat(d.temperatura) : d.temperatura)
      .filter(t => !isNaN(t) && t !== undefined);
      
    const umidades = chartData
      .map(d => typeof d.umidade === 'string' ? parseInt(d.umidade) : d.umidade)
      .filter(u => u !== undefined && u !== null && !isNaN(u)) as number[];
    
    if (temperaturas.length === 0) {
      return {
        tempMin: 0,
        tempMax: 0,
        tempMedia: 0,
        umidadeMedia: 0
      };
    }
    
    return {
      tempMin: Math.min(...temperaturas),
      tempMax: Math.max(...temperaturas),
      tempMedia: temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length,
      umidadeMedia: umidades.length > 0 ? umidades.reduce((a, b) => a + b, 0) / umidades.length : 0
    };
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={customTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="temperatura"
              stroke="#ef4444"
              fill="#fef2f2"
              strokeWidth={2}
              name="Temperatura"
            />
            <Area
              type="monotone"
              dataKey="sensacao_termica"
              stroke="#f97316"
              fill="#fff7ed"
              strokeWidth={2}
              name="Sensação Térmica"
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={customTooltip} />
            <Legend />
            <Bar dataKey="temperatura" fill="#ef4444" name="Temperatura" />
            <Bar dataKey="umidade" fill="#3b82f6" name="Umidade %" />
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={customTooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperatura"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Temperatura"
            />
            <Line
              type="monotone"
              dataKey="sensacao_termica"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              name="Sensação Térmica"
            />
            <Line
              type="monotone"
              dataKey="umidade"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Umidade %"
            />
          </LineChart>
        );
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchChartData} />;

  const stats = getStatsFromData();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Histórico de Temperaturas
          </h2>
          {selectedCidadeId && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {cidades.find(c => c.id === selectedCidadeId)?.nome} - {cidades.find(c => c.id === selectedCidadeId)?.estado}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* City Selector */}
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <select
              value={selectedCidadeId || ''}
              onChange={(e) => setSelectedCidadeId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as Cidades</option>
              {cidades.map((cidade) => (
                <option key={cidade.id} value={cidade.id}>
                  {cidade.nome} - {cidade.estado}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
            {(['6h', '12h', '24h', '7d', '30d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
            {(['line', 'area', 'bar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  chartType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'line' ? 'Linha' : type === 'area' ? 'Área' : 'Barras'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Temp. Máx</span>
            </div>
            <p className="text-xl font-bold text-red-600 mt-1">
              {stats.tempMax.toFixed(1)}°C
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Temp. Mín</span>
            </div>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {stats.tempMin.toFixed(1)}°C
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Temp. Média</span>
            </div>
            <p className="text-xl font-bold text-green-600 mt-1">
              {stats.tempMedia.toFixed(1)}°C
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Umidade Média</span>
            </div>
            <p className="text-xl font-bold text-purple-600 mt-1">
              {stats.umidadeMedia.toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum dado encontrado</p>
              <p className="text-sm">
                Não há dados históricos para o período selecionado.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Info */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {chartData.length} registros do período de {selectedPeriod}
              {selectedCidadeId && ` para ${cidades.find(c => c.id === selectedCidadeId)?.nome}`}
            </span>
            <span>
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
