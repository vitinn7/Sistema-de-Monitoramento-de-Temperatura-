import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  ApiResponse,
  Cidade,
  TemperaturaAtual,
  EstatisticasGerais,
  TemperatureHistoryParams,
  Temperatura,
  AlertaConfig,
  AppError,
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use((config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): AppError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      return {
        code: `HTTP_${status}`,
        message: data?.error || `Erro ${status}: ${error.message}`,
        details: { status, data }
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexão com o servidor. Verifique sua internet.',
        details: { originalError: error.message }
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Erro desconhecido',
        details: { originalError: error }
      };
    }
  }

  // Cities endpoints
  async getCidades(): Promise<Cidade[]> {
    const response = await this.client.get<ApiResponse<Cidade[]>>('/cidades');
    return response.data.data;
  }

  async getCidadeById(id: number): Promise<Cidade> {
    const response = await this.client.get<ApiResponse<Cidade>>(`/cidades/${id}`);
    return response.data.data;
  }

  async getCidadeTemperatureHistory(
    id: number, 
    params: TemperatureHistoryParams = {}
  ): Promise<{
    city: { id: number; nome: string; estado: string };
    periodo: string;
    limit: number;
    statistics: {
      total_registros: number;
      temperatura_media: number;
      temperatura_minima: number;
      temperatura_maxima: number;
      periodo_inicio: string;
      periodo_fim: string;
    } | null;
    temperatures: Temperatura[];
  }> {
    const queryParams = new URLSearchParams();
    if (params.periodo) queryParams.append('periodo', params.periodo);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.client.get<ApiResponse<any>>(
      `/cidades/${id}/temperaturas?${queryParams.toString()}`
    );
    return response.data.data;
  }

  async getCidadeAlertas(id: number): Promise<{
    city: { id: number; nome: string; estado: string };
    alertConfigs: AlertaConfig[];
  }> {
    const response = await this.client.get<ApiResponse<any>>(`/cidades/${id}/alertas`);
    return response.data.data;
  }

  // Temperature endpoints
  async getTemperaturasAtuais(): Promise<TemperaturaAtual[]> {
    const response = await this.client.get<ApiResponse<TemperaturaAtual[]>>('/temperaturas/atuais');
    return response.data.data;
  }

  async coletarTemperaturas(): Promise<{
    sucessos: number;
    erros: number;
    detalhes: Array<{ cidade: string; status: string; erro?: string }>;
  }> {
    const response = await this.client.post<ApiResponse<any>>('/temperaturas/coletar');
    return response.data.data;
  }

  async getEstatisticas(): Promise<EstatisticasGerais> {
    const response = await this.client.get<ApiResponse<EstatisticasGerais>>('/temperaturas/estatisticas');
    return response.data.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.client.get<ApiResponse<any>>('/health');
    return response.data.data;
  }

  // Generic method for custom requests
  async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.request<ApiResponse<T>>({
      method,
      url,
      data,
    });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
