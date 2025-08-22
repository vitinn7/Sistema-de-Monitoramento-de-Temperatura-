# Documentação da OpenWeather One Call API 3.0

## Visão Geral

A OpenWeather One Call API 3.0 oferece acesso fácil a dados meteorológicos essenciais, previsões de curto e longo prazo e dados meteorológicos agregados. Esta API foi projetada para garantir uma migração fácil da Dark Sky API.

### Recursos Principais

- **5 endpoints** diferentes para diversos tipos de dados meteorológicos
- Baseada no modelo proprietário da OpenWeather
- Atualizada a cada **10 minutos**
- Arquivo histórico de **46+ anos** disponível
- Previsão de até **4 dias** à frente

---

## Estrutura dos Endpoints

A API oferece 5 tipos diferentes de dados meteorológicos:

1. **Clima Atual e Previsões**
2. **Dados Históricos por Timestamp**
3. **Agregação Diária**
4. **Visão Geral do Clima**
5. **Assistente de IA do Clima**

---

## 1. Clima Atual e Previsões

### Descrição
Acesso a clima atual, previsão minutal por 1 hora, previsão horária por 48 horas, previsão diária por 8 dias e alertas governamentais do clima.

### Endpoint
```
GET https://api.openweathermap.org/data/3.0/onecall
```

### Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `lat` | decimal | Latitude (-90; 90) |
| `lon` | decimal | Longitude (-180; 180) |
| `appid` | string | Sua chave única da API |

### Parâmetros Opcionais

| Parâmetro | Tipo | Valores | Descrição |
|-----------|------|---------|-----------|
| `exclude` | string | `current`, `minutely`, `hourly`, `daily`, `alerts` | Exclui partes dos dados (lista separada por vírgulas) |
| `units` | string | `standard`, `metric`, `imperial` | Unidades de medida (padrão: standard) |
| `lang` | string | Códigos de idioma | Idioma da resposta |

### Exemplo de Chamada
```bash
# Chamada completa
https://api.openweathermap.org/data/3.0/onecall?lat=33.44&lon=-94.04&appid={API_KEY}

# Com exclusões
https://api.openweathermap.org/data/3.0/onecall?lat=33.44&lon=-94.04&exclude=hourly,daily&appid={API_KEY}
```

### Estrutura da Resposta

```json
{
  "lat": 33.44,
  "lon": -94.04,
  "timezone": "America/Chicago",
  "timezone_offset": -18000,
  "current": {
    "dt": 1684929490,
    "sunrise": 1684926645,
    "sunset": 1684977332,
    "temp": 292.55,
    "feels_like": 292.87,
    "pressure": 1014,
    "humidity": 89,
    "dew_point": 290.69,
    "uvi": 0.16,
    "clouds": 53,
    "visibility": 10000,
    "wind_speed": 3.13,
    "wind_deg": 93,
    "weather": [
      {
        "id": 803,
        "main": "Clouds",
        "description": "broken clouds",
        "icon": "04d"
      }
    ]
  },
  "minutely": [...],
  "hourly": [...],
  "daily": [...],
  "alerts": [...]
}
```

### Campos da Resposta

#### Dados Atuais (`current`)

| Campo | Descrição | Unidade |
|-------|-----------|---------|
| `dt` | Horário atual (Unix, UTC) | timestamp |
| `sunrise` | Horário do nascer do sol (Unix, UTC) | timestamp |
| `sunset` | Horário do pôr do sol (Unix, UTC) | timestamp |
| `temp` | Temperatura | K/°C/°F |
| `feels_like` | Sensação térmica | K/°C/°F |
| `pressure` | Pressão atmosférica | hPa |
| `humidity` | Umidade | % |
| `dew_point` | Ponto de orvalho | K/°C/°F |
| `uvi` | Índice UV | - |
| `clouds` | Nebulosidade | % |
| `visibility` | Visibilidade | metros |
| `wind_speed` | Velocidade do vento | m/s ou mph |
| `wind_deg` | Direção do vento | graus |

---

## 2. Dados Históricos por Timestamp

### Descrição
Acesso a dados meteorológicos para qualquer timestamp desde 1º de janeiro de 1979 até 4 dias à frente.

### Endpoint
```
GET https://api.openweathermap.org/data/3.0/onecall/timemachine
```

### Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `lat` | decimal | Latitude (-90; 90) |
| `lon` | decimal | Longitude (-180; 180) |
| `dt` | integer | Timestamp Unix (UTC) |
| `appid` | string | Sua chave única da API |

### Exemplo de Chamada
```bash
https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=39.099724&lon=-94.578331&dt=1643803200&appid={API_KEY}
```

### Estrutura da Resposta
```json
{
  "lat": 52.2297,
  "lon": 21.0122,
  "timezone": "Europe/Warsaw",
  "timezone_offset": 3600,
  "data": [
    {
      "dt": 1645888976,
      "sunrise": 1645853361,
      "sunset": 1645891727,
      "temp": 279.13,
      "feels_like": 276.44,
      "pressure": 1029,
      "humidity": 64,
      "weather": [
        {
          "id": 800,
          "main": "Clear",
          "description": "clear sky",
          "icon": "01d"
        }
      ]
    }
  ]
}
```

---

## 3. Agregação Diária

### Descrição
Dados meteorológicos agregados para uma data específica desde 2 de janeiro de 1979 até 1,5 anos à frente.

### Endpoint
```
GET https://api.openweathermap.org/data/3.0/onecall/day_summary
```

### Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `lat` | decimal | Latitude (-90; 90) |
| `lon` | decimal | Longitude (-180; 180) |
| `date` | string | Data no formato YYYY-MM-DD |
| `appid` | string | Sua chave única da API |

### Exemplo de Chamada
```bash
https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=39.099724&lon=-94.578331&date=2020-03-04&appid={API_KEY}
```

### Estrutura da Resposta
```json
{
  "lat": 33,
  "lon": 35,
  "tz": "+02:00",
  "date": "2020-03-04",
  "units": "standard",
  "cloud_cover": {
    "afternoon": 0
  },
  "humidity": {
    "afternoon": 33
  },
  "precipitation": {
    "total": 0
  },
  "temperature": {
    "min": 286.48,
    "max": 299.24,
    "afternoon": 296.15,
    "night": 289.56,
    "evening": 295.93,
    "morning": 287.59
  },
  "pressure": {
    "afternoon": 1015
  },
  "wind": {
    "max": {
      "speed": 8.7,
      "direction": 120
    }
  }
}
```

---

## 4. Visão Geral do Clima

### Descrição
Visão geral do clima com resumo legível para humanos da previsão de hoje e amanhã, utilizando tecnologias de IA da OpenWeather.

### Endpoint
```
GET https://api.openweathermap.org/data/3.0/onecall/overview
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `lat` | decimal | Sim | Latitude (-90; 90) |
| `lon` | decimal | Sim | Longitude (-180; 180) |
| `appid` | string | Sim | Sua chave única da API |
| `date` | string | Não | Data no formato YYYY-MM-DD |
| `units` | string | Não | Unidades de medida |

### Exemplo de Chamada
```bash
https://api.openweathermap.org/data/3.0/onecall/overview?lat=51.509865&lon=-0.118092&appid={API_KEY}
```

### Estrutura da Resposta
```json
{
  "lat": 51.509865,
  "lon": -0.118092,
  "tz": "+01:00",
  "date": "2024-05-13",
  "units": "metric",
  "weather_overview": "O clima atual está nublado com temperatura de 16°C e sensação térmica de 16°C..."
}
```

---

## 5. Assistente de IA do Clima

### Descrição
Acesso a dados meteorológicos e conselhos relacionados ao clima em formato legível e amigável para humanos.

### Características
- Suporte a mais de 50 idiomas
- Lembra a localização especificada durante a sessão
- Cobertura global
- Considera clima atual, previsão minutal, horária e diária para os próximos 7 dias

### Interface Web
```
https://openweathermap.org/weather-assistant?apikey={API_KEY}
```

### API Endpoints

#### Iniciar Sessão
```
POST https://api.openweathermap.org/assistant/session
```

**Headers:**
```
Content-Type: application/json
X-Api-Key: {API_KEY}
```

**Body:**
```json
{
  "prompt": "Como está o clima em Londres?"
}
```

#### Continuar Sessão
```
POST https://api.openweathermap.org/assistant/session/{session_id}
```

**Body:**
```json
{
  "prompt": "Preciso de um chapéu?"
}
```

### Exemplos de Perguntas
- "Como está o clima em Londres?"
- "É uma boa ideia ir nadar?"
- "Vai chover amanhã em Paris?"
- "O que minha criança de 8 anos deve vestir?"
- "Onde é melhor ir de férias no próximo fim de semana: Londres ou Paris?"

---

## Unidades de Medida

### Tipos Disponíveis

| Tipo | Temperatura | Velocidade do Vento |
|------|-------------|---------------------|
| `standard` (padrão) | Kelvin | m/s |
| `metric` | Celsius | m/s |
| `imperial` | Fahrenheit | mph |

### Exemplos de Uso
```bash
# Padrão (Kelvin, m/s)
api.openweathermap.org/data/3.0/onecall?lat=30.489772&lon=-99.771335&appid={API_KEY}

# Métrico (Celsius, m/s)
api.openweathermap.org/data/3.0/onecall?lat=30.489772&lon=-99.771335&units=metric&appid={API_KEY}

# Imperial (Fahrenheit, mph)
api.openweathermap.org/data/3.0/onecall?lat=30.489772&lon=-99.771335&units=imperial&appid={API_KEY}
```

---

## Suporte Multilíngue

### Idiomas Suportados

| Código | Idioma | Código | Idioma |
|--------|--------|--------|--------|
| `pt` | Português | `en` | Inglês |
| `pt_br` | Português Brasil | `es` | Espanhol |
| `fr` | Francês | `de` | Alemão |
| `it` | Italiano | `ru` | Russo |
| `zh_cn` | Chinês Simplificado | `ja` | Japonês |
| `ar` | Árabe | `hi` | Hindi |

### Exemplo de Uso
```bash
https://api.openweathermap.org/data/3.0/onecall?lat=30.489772&lon=-99.771335&lang=pt_br&appid={API_KEY}
```

---

## Planos de Assinatura

### One Call by Call
- **Incluído:** 1.000 chamadas/dia gratuitas
- **Modelo:** Pague apenas pelas chamadas realizadas
- **Padrão:** 2.000 chamadas/dia configuradas por padrão
- **Gerenciamento:** Ajuste limites na aba "Planos de cobrança" da conta

### Como Começar

1. **Cadastre-se** no serviço OpenWeather
2. **Obtenha** sua chave da API
3. **Assine** o One Call API 3.0
4. **Configure** os limites desejados
5. **Faça** suas chamadas de API

---

## Códigos de Erro

### Estrutura do Erro
```json
{
  "cod": 400,
  "message": "Formato de data inválido",
  "parameters": ["date"]
}
```

### Códigos Comuns

| Código | Descrição |
|--------|-----------|
| `400` | Solicitação incorreta |
| `401` | Chave de API inválida |
| `404` | Dados não encontrados |
| `429` | Limite de taxa excedido |
| `5xx` | Erro interno do servidor |

---

## Alertas Meteorológicos

A API fornece alertas meteorológicos nacionais dos principais sistemas de alerta do mundo, incluindo:

- **Brasil:** Instituto Nacional de Meteorologia (INMET)
- **EUA:** National Weather Service
- **Europa:** Serviços meteorológicos nacionais
- **Outros países:** Mais de 100 agências meteorológicas

### Estrutura dos Alertas
```json
{
  "alerts": [
    {
      "sender_name": "NWS Philadelphia",
      "event": "Small Craft Advisory",
      "start": 1684952747,
      "end": 1684988747,
      "description": "Descrição detalhada do alerta...",
      "tags": []
    }
  ]
}
```

---

## Exemplos Práticos

### 1. Obter Clima Atual do Rio de Janeiro
```bash
curl "https://api.openweathermap.org/data/3.0/onecall?lat=-22.9068&lon=-43.1729&units=metric&lang=pt_br&appid={API_KEY}"
```

### 2. Previsão Horária para São Paulo
```bash
curl "https://api.openweathermap.org/data/3.0/onecall?lat=-23.5505&lon=-46.6333&exclude=current,minutely,daily,alerts&units=metric&appid={API_KEY}"
```

### 3. Dados Históricos do Carnaval 2024
```bash
curl "https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=-22.9068&lon=-43.1729&dt=1707609600&units=metric&appid={API_KEY}"
```

### 4. Usar o Assistente de IA
```bash
curl -X POST "https://api.openweathermap.org/assistant/session" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: {API_KEY}" \
  -d '{"prompt": "Como está o tempo no Rio de Janeiro? É bom para ir à praia?"}'
```

---

## Melhores Práticas

### Otimização de Chamadas
- Solicite dados a cada 10 minutos para informações mais atualizadas
- Use o parâmetro `exclude` para reduzir dados desnecessários
- Configure limites apropriados para seu uso

### Tratamento de Erros
- Implemente retry logic para códigos 5xx
- Verifique a validade da chave da API
- Monitore o limite de chamadas

### Performance
- Cache dados quando apropriado
- Use compressão gzip nas requisições
- Processe dados assincronamente quando possível

---

## Suporte e Recursos

- **Documentação completa:** [docs.openweathermap.org](https://docs.openweathermap.org)
- **Suporte:** [support.anthropic.com](https://support.anthropic.com)
- **Preços:** Consulte a página de preços
- **FAQ:** Pergunte à Ulla, assistente de IA da OpenWeather