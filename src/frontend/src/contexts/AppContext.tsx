import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import type { 
  CidadeComTemperatura, 
  TemperaturaAtual, 
  AlertaDisparado,
  EstatisticasGerais,
  LoadingState,
  AppContextType
} from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [cidades, setCidades] = useState<CidadeComTemperatura[]>([]);
  const [temperaturasAtuais, setTemperaturasAtuais] = useState<TemperaturaAtual[]>([]);
  const [alertasRecentes] = useState<AlertaDisparado[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: undefined
  });

  // Combina dados de cidades com temperaturas atuais
  const mergeCidadesWithTemperaturas = useCallback(
    (cidadesData: any[], temperaturasData: TemperaturaAtual[]): CidadeComTemperatura[] => {
      return cidadesData.map(cidade => {
        const temperatura = temperaturasData.find(t => t.cidade_id === cidade.id);
        return {
          ...cidade,
          temperatura_atual: temperatura,
          ultima_atualizacao: temperatura?.data_hora
        };
      });
    },
    []
  );

  // Carrega dados iniciais
  const loadInitialData = useCallback(async () => {
    setLoading({ isLoading: true, error: undefined });

    try {
      console.log('🔄 Carregando dados iniciais...');
      
      // Carregar dados em paralelo
      const [cidadesData, temperaturasData, estatisticasData] = await Promise.all([
        apiClient.getCidades(),
        apiClient.getTemperaturasAtuais(),
        apiClient.getEstatisticas().catch(err => {
          console.warn('Erro ao carregar estatísticas:', err);
          return null;
        })
      ]);

      console.log('📊 Dados carregados:', {
        cidades: cidadesData.length,
        temperaturas: temperaturasData.length,
        estatisticas: !!estatisticasData
      });

      // Combinar e setar dados
      const cidadesComTemperatura = mergeCidadesWithTemperaturas(cidadesData, temperaturasData);
      
      setCidades(cidadesComTemperatura);
      setTemperaturasAtuais(temperaturasData);
      setEstatisticas(estatisticasData);
      
      setLoading({ isLoading: false });
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
      setLoading({ 
        isLoading: false, 
        error: error.message || 'Erro ao carregar dados' 
      });
    }
  }, [mergeCidadesWithTemperaturas]);

  // Atualiza dados de uma cidade específica
  const refreshCidade = useCallback(async (cidadeId: number) => {
    try {
      console.log(`🔄 Atualizando cidade ${cidadeId}...`);
      
      // Marcar cidade como carregando (opcional - para UI feedback)
      setCidades(prev => prev.map(cidade => 
        cidade.id === cidadeId 
          ? { ...cidade, isLoading: true }
          : cidade
      ));

      // Recarregar temperaturas atuais
      const temperaturasData = await apiClient.getTemperaturasAtuais();
      setTemperaturasAtuais(temperaturasData);

      // Atualizar cidades com novas temperaturas
      setCidades(prev => {
        const updated = mergeCidadesWithTemperaturas(prev, temperaturasData);
        return updated.map(cidade => ({ ...cidade, isLoading: false }));
      });

      console.log(`✅ Cidade ${cidadeId} atualizada`);
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar cidade ${cidadeId}:`, error);
      
      // Remover estado de loading da cidade
      setCidades(prev => prev.map(cidade => 
        cidade.id === cidadeId 
          ? { ...cidade, isLoading: false }
          : cidade
      ));
    }
  }, [mergeCidadesWithTemperaturas]);

  // Atualiza todos os dados
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Carrega dados iniciais na montagem do componente
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh executado');
      refreshData();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [refreshData]);

  const contextValue: AppContextType = {
    cidades,
    temperaturasAtuais,
    alertasRecentes,
    estatisticas,
    loading,
    apiClient,
    refreshData,
    refreshCidade
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook para usar o contexto
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};

export default AppContext;
