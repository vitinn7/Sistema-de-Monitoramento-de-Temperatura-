import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição no formato brasileiro
 */
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Data inválida';
  }
}

/**
 * Formata uma data como "há X minutos/horas"
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Data inválida';
  }
}

/**
 * Formata temperatura com símbolo de grau
 */
export function formatTemperature(temp: number | string | null | undefined): string {
  const numTemp = typeof temp === 'string' ? parseFloat(temp) : temp;
  if (!isValidNumber(numTemp)) {
    return 'N/A°C';
  }
  return `${numTemp!.toFixed(1)}°C`;
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!isValidNumber(numValue)) {
    return 'N/A%';
  }
  return `${Math.round(numValue!)}%`;
}

/**
 * Formata pressão atmosférica
 */
export function formatPressure(pressure: number | string | null | undefined): string {
  const numPressure = typeof pressure === 'string' ? parseFloat(pressure) : pressure;
  if (!isValidNumber(numPressure)) {
    return 'N/A hPa';
  }
  return `${numPressure!.toFixed(1)} hPa`;
}

/**
 * Formata velocidade do vento
 */
export function formatWindSpeed(speed: number | string | null | undefined): string {
  const numSpeed = typeof speed === 'string' ? parseFloat(speed) : speed;
  if (!isValidNumber(numSpeed)) {
    return 'N/A km/h';
  }
  return `${numSpeed!.toFixed(1)} km/h`;
}

/**
 * Converte direção do vento em graus para texto
 */
export function formatWindDirection(degrees: number | string | null | undefined): string {
  const numDegrees = typeof degrees === 'string' ? parseFloat(degrees) : degrees;
  if (!isValidNumber(numDegrees)) {
    return 'N/A';
  }
  const deg = numDegrees!;
  if (deg >= 337.5 || deg < 22.5) return 'N';
  if (deg >= 22.5 && deg < 67.5) return 'NE';
  if (deg >= 67.5 && deg < 112.5) return 'E';
  if (deg >= 112.5 && deg < 157.5) return 'SE';
  if (deg >= 157.5 && deg < 202.5) return 'S';
  if (deg >= 202.5 && deg < 247.5) return 'SW';
  if (deg >= 247.5 && deg < 292.5) return 'W';
  if (deg >= 292.5 && deg < 337.5) return 'NW';
  return 'N';
}

/**
 * Determina a classe CSS baseada na temperatura
 */
export function getTemperatureClass(temperature: number | string | null | undefined): string {
  const numTemp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
  if (!isValidNumber(numTemp)) {
    return 'temperature-normal';
  }
  const temp = numTemp!;
  if (temp <= 5) return 'temperature-cold';
  if (temp <= 15) return 'temperature-normal';
  if (temp <= 30) return 'temperature-normal';
  if (temp <= 35) return 'temperature-hot';
  return 'temperature-extreme';
}

/**
 * Determina a cor do badge baseada na temperatura
 */
export function getTemperatureColor(temperature: number | string | null | undefined): 'blue' | 'green' | 'yellow' | 'red' {
  const numTemp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
  if (!isValidNumber(numTemp)) {
    return 'green';
  }
  const temp = numTemp!;
  if (temp <= 5) return 'blue';
  if (temp <= 15) return 'green';
  if (temp <= 30) return 'green';
  if (temp <= 35) return 'yellow';
  return 'red';
}

/**
 * Formata nome da cidade com estado
 */
export function formatCityName(nome: string, estado: string): string {
  return `${nome}, ${estado}`;
}

/**
 * Gera uma cor única para uma string (útil para gráficos)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

/**
 * Debounce function para otimizar chamadas de API
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as number;
  };
}

/**
 * Trunca texto com ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formata mensagem de erro de forma user-friendly
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.code) return `Erro ${error.code}`;
  return 'Ocorreu um erro inesperado';
}

/**
 * Valida se é um número válido
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Gera um ID único simples
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Converte objeto para query string
 */
export function objectToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params.toString();
}
