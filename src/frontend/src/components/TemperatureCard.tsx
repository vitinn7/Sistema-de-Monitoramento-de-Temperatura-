import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  RefreshCw,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  formatTemperature, 
  formatPercentage, 
  formatPressure, 
  formatWindSpeed,
  formatWindDirection,
  formatRelativeDate,
  getTemperatureColor,
  formatCityName
} from '../utils/formatters';
import type { CidadeComTemperatura } from '../types';

interface TemperatureCardProps {
  cidade: CidadeComTemperatura;
  loading?: boolean;
  onRefresh?: (cidadeId: number) => void;
  className?: string;
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({
  cidade,
  loading = false,
  onRefresh,
  className = ''
}) => {
  const handleRefresh = () => {
    if (onRefresh && !loading) {
      onRefresh(cidade.id);
    }
  };

  const temperatureColor = cidade.temperatura_atual?.temperatura 
    ? getTemperatureColor(cidade.temperatura_atual.temperatura)
    : 'green';

  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white', 
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white'
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            {formatCityName(cidade.nome, cidade.estado)}
          </h3>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!cidade.temperatura_atual ? (
        <div className="text-center py-8">
          <Thermometer className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum dado disponível</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Carregar dados
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Temperature */}
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${colorClasses[temperatureColor]}`}>
              <Thermometer className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {cidade.temperatura_atual.temperatura !== undefined && cidade.temperatura_atual.temperatura !== null 
                  ? formatTemperature(cidade.temperatura_atual.temperatura)
                  : 'N/A°C'
                }
              </div>
              {cidade.temperatura_atual.sensacao_termica !== undefined && cidade.temperatura_atual.sensacao_termica !== null && (
                <div className="text-sm text-gray-600">
                  Sensação: {formatTemperature(cidade.temperatura_atual.sensacao_termica)}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {cidade.temperatura_atual.descricao_tempo && (
            <div className="text-gray-600 capitalize">
              {cidade.temperatura_atual.descricao_tempo}
            </div>
          )}

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Humidity */}
            {cidade.temperatura_atual.umidade !== undefined && cidade.temperatura_atual.umidade !== null && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatPercentage(cidade.temperatura_atual.umidade)}
                  </div>
                  <div className="text-xs text-gray-600">Umidade</div>
                </div>
              </div>
            )}

            {/* Pressure */}
            {cidade.temperatura_atual.pressao !== undefined && cidade.temperatura_atual.pressao !== null && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Eye className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatPressure(cidade.temperatura_atual.pressao)}
                  </div>
                  <div className="text-xs text-gray-600">Pressão</div>
                </div>
              </div>
            )}

            {/* Wind */}
            {cidade.temperatura_atual.velocidade_vento !== undefined && cidade.temperatura_atual.velocidade_vento !== null && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg col-span-2">
                <Wind className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatWindSpeed(cidade.temperatura_atual.velocidade_vento)}
                    {cidade.temperatura_atual.direcao_vento !== undefined && cidade.temperatura_atual.direcao_vento !== null && (
                      <span className="ml-2 text-gray-600">
                        {formatWindDirection(cidade.temperatura_atual.direcao_vento)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">Vento</div>
                </div>
              </div>
            )}
          </div>

          {/* Last Update */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t">
            <Clock className="h-3 w-3" />
            <span>
              Última atualização: {formatRelativeDate(cidade.temperatura_atual.data_hora)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
