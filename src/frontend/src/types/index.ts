// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
  timestamp: string;
  error?: string;
}

// Core Domain Types
export interface Cidade {
  id: number;
  nome: string;
  estado: string;
  pais: string;
  latitude: number;
  longitude: number;
  openweather_id: number;
  ativa: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Temperatura {
  id: number;
  cidade_id: number;
  temperatura: number;
  sensacao_termica?: number;
  umidade?: number;
  pressao?: number;
  velocidade_vento?: number;
  direcao_vento?: number;
  descricao_tempo?: string;
  data_hora: string;
  data_criacao: string;
  fonte?: string;
}

export interface AlertaConfig {
  id: number;
  cidade_id: number;
  tipo_alerta: 'temperatura_alta' | 'temperatura_baixa' | 'umidade_alta' | 'umidade_baixa' | 'vento_forte';
  valor_limite: number;
  ativo: boolean;
  descricao?: string;
  data_criacao: string;
  data_atualizacao?: string;
}

export interface AlertaAtivo {
  id: number;
  alerta_config_id: number;
  cidade_id: number;
  cidade_nome: string;
  tipo_alerta: string;
  valor_limite: number;
  valor_atual: number;
  ativo: boolean;
  criado_em: string;
}

export interface AlertaDisparado {
  id: number;
  temperatura_id: number;
  config_alerta_id: number;
  tipo_alerta: string;
  valor_disparador: number;
  valor_limite: number;
  mensagem?: string;
  data_hora: string;
  notificado?: boolean;
  data_notificacao?: string;
}

// Alert API Types
export interface Alert {
  id: number;
  cidade_id: number;
  cidade_nome: string;
  estado: string;
  tipo_alerta: string;
  valor_limite: number;
  valor_atual: number;
  data_criacao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
}

export interface AlertStats {
  total_alertas_mes: number;
  alertas_ativos: number;
  alertas_pendentes: number;
  alertas_por_tipo: Record<string, number>;
  cidades_com_alertas: number;
  severidade_media: string;
}

// Extended Types for UI
export interface TemperaturaAtual extends Temperatura {
  cidade_nome: string;
  estado: string;
}

export interface CidadeComTemperatura extends Cidade {
  temperatura_atual?: TemperaturaAtual;
  ultima_atualizacao?: string;
}

export interface EstatisticasGerais {
  cidades_ativas: number;
  temperaturas_24h: number;
  alertas_24h: number;
  temp_media_1h: number;
  temp_min_1h: number;
  temp_max_1h: number;
  errors_1h: number;
  timestamp: string;
}

// UI Component Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TemperatureCardProps {
  cidade: CidadeComTemperatura;
  loading?: boolean;
  onRefresh?: (cidadeId: number) => void;
}

export interface AlertBadgeProps {
  alerta: AlertaDisparado;
  variant?: 'default' | 'compact';
}

export interface ChartDataPoint {
  timestamp: string;
  temperatura: number;
  sensacao_termica?: number;
  umidade?: number;
}

// API Client Types
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
}

export interface TemperatureHistoryParams {
  periodo?: '6h' | '12h' | '24h' | '7d' | '30d';
  limit?: number;
}

// Form Types
export interface RefreshParams {
  cidadeIds?: number[];
  forceRefresh?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Context Types
export interface AppContextType {
  cidades: CidadeComTemperatura[];
  temperaturasAtuais: TemperaturaAtual[];
  alertasRecentes: AlertaDisparado[];
  estatisticas: EstatisticasGerais | null;
  loading: LoadingState;
  apiClient: any;
  refreshData: () => Promise<void>;
  refreshCidade: (cidadeId: number) => Promise<void>;
}
