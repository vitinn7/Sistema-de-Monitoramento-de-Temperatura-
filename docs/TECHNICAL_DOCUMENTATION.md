# Documentação Técnica - Sistema de Monitoramento de Temperatura

## Arquitetura do Sistema

### Visão Geral Técnica

O Sistema de Monitoramento de Temperatura é uma aplicação web completa construída com arquitetura de microserviços, seguindo os princípios de **Clean Architecture** e **Domain-Driven Design**.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   External      │
│   React/TS      │◄──►│   Node.js/TS     │◄──►│   Services      │
│   Port: 5173    │    │   Port: 3000     │    │   OpenWeather   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   PostgreSQL     │             │
         │              │   Port: 5432     │             │
         │              └──────────────────┘             │
         │                       │                       │
         │              ┌──────────────────┐             │
         └──────────────┤     Redis        │◄────────────┘
                        │   Port: 6379     │
                        └──────────────────┘
```

### Stack Tecnológica Detalhada

#### Frontend
- **Framework:** React 18.2+ com TypeScript 5.0+
- **Build Tool:** Vite 5.0+ para desenvolvimento rápido
- **Styling:** Tailwind CSS 3.4+ para design system
- **Estado:** Context API + useReducer para gerenciamento de estado
- **HTTP Client:** Axios com interceptors para API calls
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier

#### Backend  
- **Runtime:** Node.js 18+ LTS
- **Framework:** Express.js 4.18+ com TypeScript
- **Database ORM:** Camada custom com pg (node-postgres)
- **Cache:** Redis 7+ para otimização de performance
- **Authentication:** JWT (preparado para implementação)
- **Logging:** Winston com formatação estruturada
- **Testing:** Jest + Supertest
- **Security:** Helmet + CORS + Rate Limiting

#### Database
- **RDBMS:** PostgreSQL 15+ 
- **Schema Management:** SQL scripts versionados
- **Backup:** pg_dump automatizado
- **Performance:** Índices otimizados + Views materializadas

#### Infrastructure
- **Containerização:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (recomendado)
- **Monitoring:** Health checks customizados

## Estrutura de Diretórios

```
sistema-monitoramento-temperatura/
├── backend/                          # API Node.js + Express
│   ├── src/
│   │   ├── app.ts                   # Configuração principal Express
│   │   ├── server.ts                # Entry point da aplicação
│   │   ├── config/
│   │   │   └── environment.ts       # Configurações de ambiente
│   │   ├── routes/
│   │   │   ├── cities.routes.ts     # Endpoints de cidades
│   │   │   └── temperatures.routes.ts # Endpoints de temperaturas
│   │   ├── services/
│   │   │   ├── database.service.ts  # Camada de acesso ao BD
│   │   │   ├── redis.service.ts     # Gerenciamento de cache
│   │   │   ├── openweather.service.ts # API OpenWeather
│   │   │   └── alert.service.ts     # Sistema de alertas
│   │   └── utils/
│   │       └── logger.ts            # Sistema de logging
│   ├── tests/                       # Testes Jest
│   ├── logs/                        # Arquivos de log
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/                         # React Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx        # Componente principal
│   │   │   ├── TemperatureCard.tsx  # Card de temperatura
│   │   │   ├── AlertsPanel.tsx      # Painel de alertas
│   │   │   ├── TemperatureCharts.tsx # Gráficos interativos
│   │   │   └── ui/                  # Componentes UI básicos
│   │   ├── contexts/
│   │   │   └── AppContext.tsx       # Context API
│   │   ├── services/
│   │   │   └── api.ts              # Cliente API
│   │   ├── types/
│   │   │   └── index.ts            # Definições TypeScript
│   │   ├── utils/
│   │   │   └── formatters.ts       # Funções de formatação
│   │   └── test/                    # Testes Vitest
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vitest.config.ts
├── database/                         # Scripts PostgreSQL
│   ├── 01_schema.sql               # Schema do banco
│   ├── 02_seeds.sql                # Dados iniciais
│   └── 03_functions.sql            # Procedures/triggers
├── docs/                            # Documentação
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── USER_GUIDE.md
├── docker/                          # Configurações Docker
│   ├── postgres.conf
│   └── redis.conf
├── .github/workflows/               # GitHub Actions
│   └── ci-cd.yml
├── docker-compose.yml               # Desenvolvimento
├── docker-compose.prod.yml          # Produção
└── README.md
```

## API Reference

### Base URL
- **Desenvolvimento:** `http://localhost:3000/api/v1`
- **Produção:** `https://seu-dominio.com/api/v1`

### Authentication
Atualmente o sistema não requer autenticação, mas está preparado para JWT:

```typescript
// Headers opcionais para futuras implementações
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Endpoints Disponíveis

#### Cidades

**GET /api/v1/cidades**
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "São Paulo",
      "codigo_ibge": "3550308",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "openweather_id": 3448439,
      "ativa": true,
      "data_criacao": "2025-01-21T10:00:00.000Z"
    }
  ]
}
```

**GET /api/v1/cidades/:id**
```json
// Response
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "São Paulo",
    "codigo_ibge": "3550308",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "openweather_id": 3448439,
    "ativa": true,
    "data_criacao": "2025-01-21T10:00:00.000Z"
  }
}
```

#### Temperaturas

**GET /api/v1/temperaturas**
```typescript
// Query Parameters
interface QueryParams {
  cidade_id?: number;    // Filtro por cidade
  limit?: number;        // Limite de resultados (padrão: 50)
  offset?: number;       // Offset para paginação
  order?: 'ASC' | 'DESC'; // Ordenação (padrão: DESC)
}
```

```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cidade_id": 1,
      "cidade_nome": "São Paulo",
      "temperatura": 25.5,
      "sensacao_termica": 27.2,
      "umidade": 65,
      "pressao": 1013.25,
      "descricao_tempo": "Partly cloudy",
      "data_hora": "2025-01-21T15:30:00.000Z",
      "data_criacao": "2025-01-21T15:31:00.000Z"
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "hasNext": true
  }
}
```

**GET /api/v1/temperaturas/historico**
```typescript
// Query Parameters
interface HistoricoParams {
  cidade_id?: number;           // Filtro por cidade
  periodo?: string;             // '6h', '24h', '7d', '30d'
  limit?: number;              // Limite de resultados
  intervalo?: 'hora' | 'dia';  // Agrupamento dos dados
}
```

**GET /api/v1/temperaturas/estatisticas**
```json
// Response
{
  "success": true,
  "data": {
    "temperatura_media": 24.8,
    "temperatura_minima": 18.2,
    "temperatura_maxima": 32.1,
    "total_registros": 1250,
    "ultima_atualizacao": "2025-01-21T15:30:00.000Z",
    "cidades_ativas": 3
  }
}
```

#### Alertas

**GET /api/v1/alertas/recentes**
```typescript
// Query Parameters
interface AlertasParams {
  cidade_id?: number;
  severidade?: 'normal' | 'alta' | 'critica' | 'emergencia';
  tipo?: 'alta_temperatura' | 'baixa_temperatura';
  limit?: number;
}
```

```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "temperatura_id": 456,
      "cidade_nome": "São Paulo",
      "tipo_alerta": "alta_temperatura",
      "temperatura_registrada": 38.5,
      "valor_limite": 35.0,
      "severidade": "critica",
      "data_hora": "2025-01-21T15:30:00.000Z",
      "notificado": true,
      "resolvido": false
    }
  ]
}
```

**GET /api/v1/alertas/configuracoes**
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cidade_id": 1,
      "cidade_nome": "São Paulo",
      "tipo_alerta": "alta_temperatura",
      "valor_minimo": null,
      "valor_maximo": 35.0,
      "ativo": true,
      "email_notificacao": "admin@exemplo.com"
    }
  ]
}
```

#### Health Checks

**GET /api/v1/health**
```json
// Response
{
  "status": "healthy",
  "timestamp": "2025-01-21T15:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "openweather": "healthy"
  }
}
```

### Error Responses

Todos os erros seguem o padrão:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parâmetros inválidos",
    "details": "O campo 'cidade_id' deve ser um número positivo",
    "timestamp": "2025-01-21T15:30:00.000Z"
  }
}
```

#### Códigos de Erro Comuns
- `VALIDATION_ERROR` (400): Parâmetros inválidos
- `NOT_FOUND` (404): Recurso não encontrado
- `RATE_LIMIT_EXCEEDED` (429): Muitas requisições
- `INTERNAL_ERROR` (500): Erro interno do servidor
- `SERVICE_UNAVAILABLE` (503): Serviço temporariamente indisponível

## Modelo de Dados

### Diagrama ER

```sql
-- Entidades principais
Cities (Cidades)
├── id (PK)
├── nome
├── codigo_ibge
├── latitude
├── longitude
├── openweather_id
├── ativa
├── data_criacao
└── data_atualizacao

Temperatures (Temperaturas)
├── id (PK)
├── cidade_id (FK → Cities.id)
├── temperatura
├── sensacao_termica
├── umidade
├── pressao
├── descricao_tempo
├── data_hora
└── data_criacao

Alert_Configs (Configurações de Alerta)
├── id (PK)
├── cidade_id (FK → Cities.id)
├── tipo_alerta
├── valor_minimo
├── valor_maximo
├── ativo
├── email_notificacao
├── data_criacao
└── data_atualizacao

Alert_Triggered (Alertas Disparados)
├── id (PK)
├── temperatura_id (FK → Temperatures.id)
├── config_alerta_id (FK → Alert_Configs.id)
├── data_hora
├── notificado
└── resolvido

System_Health (Saúde do Sistema)
├── id (PK)
├── servico
├── status
├── detalhes
├── tempo_resposta
└── verificado_em
```

### Relacionamentos

- **Cities ↔ Temperatures**: One-to-Many (uma cidade tem muitas temperaturas)
- **Cities ↔ Alert_Configs**: One-to-Many (uma cidade tem várias configurações)
- **Temperatures ↔ Alert_Triggered**: One-to-Many (uma temperatura pode gerar vários alertas)
- **Alert_Configs ↔ Alert_Triggered**: One-to-Many (uma config pode gerar vários alertas)

### Índices para Performance

```sql
-- Índices principais
CREATE INDEX idx_temperatures_cidade_data ON temperatures(cidade_id, data_hora DESC);
CREATE INDEX idx_temperatures_data_hora ON temperatures(data_hora DESC);
CREATE INDEX idx_alert_triggered_data ON alert_triggered(data_hora DESC);
CREATE INDEX idx_alert_configs_ativo ON alert_configs(ativo) WHERE ativo = true;

-- Índices compostos para queries frequentes
CREATE INDEX idx_temp_cidade_periodo ON temperatures(cidade_id, data_hora) 
  WHERE data_hora >= NOW() - INTERVAL '30 days';
```

## Configuração de Ambiente

### Variáveis de Ambiente (Backend)

```typescript
interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_VERSION: string;
  
  // Database
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  
  // Redis
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  
  // External APIs
  OPENWEATHER_API_KEY: string;
  OPENWEATHER_BASE_URL: string;
  
  // Security
  JWT_SECRET?: string;
  BCRYPT_ROUNDS: number;
  CORS_ORIGIN: string;
  
  // Email (opcional)
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM?: string;
  
  // Monitoring
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  HEALTH_CHECK_INTERVAL: number;
  METRICS_ENABLED: boolean;
}
```

### Configuração do Frontend

```typescript
interface FrontendConfig {
  VITE_API_BASE_URL: string;
  VITE_APP_TITLE: string;
  VITE_REFRESH_INTERVAL: number;
  VITE_ENABLE_MOCK_DATA: boolean;
}
```

## Sistema de Cache

### Estratégia de Cache (Redis)

```typescript
// Cache keys pattern
const CACHE_KEYS = {
  CITIES: 'cities:all',
  CITY_BY_ID: (id: number) => `city:${id}`,
  TEMPERATURES: (cityId?: number, limit?: number) => 
    `temperatures:${cityId || 'all'}:${limit || 50}`,
  WEATHER_API: (cityId: number) => `weather:${cityId}`,
  HEALTH_STATUS: 'health:status'
};

// TTL (Time To Live) configuration
const CACHE_TTL = {
  CITIES: 24 * 60 * 60,          // 24 horas (dados estáticos)
  TEMPERATURES: 5 * 60,           // 5 minutos (dados dinâmicos)
  WEATHER_API: 10 * 60,          // 10 minutos (API externa)
  HEALTH_STATUS: 1 * 60          // 1 minuto (status do sistema)
};
```

### Invalidação de Cache

```typescript
// Automaticamente invalidado quando:
// 1. Novos dados são inseridos na tabela temperatures
// 2. Configurações de alertas são alteradas
// 3. Status de cidades é modificado
// 4. Health checks falham

class CacheService {
  async invalidateTemperatureCache(cityId?: number): Promise<void> {
    const patterns = [
      `temperatures:${cityId || '*'}:*`,
      'health:status'
    ];
    
    for (const pattern of patterns) {
      await this.redis.del(await this.redis.keys(pattern));
    }
  }
}
```

## Sistema de Logging

### Configuração Winston

```typescript
// Níveis de log
enum LogLevel {
  ERROR = 'error',    // Erros críticos
  WARN = 'warn',      // Avisos importantes
  INFO = 'info',      // Informações gerais
  DEBUG = 'debug'     // Debugging detalhado
}

// Formato estruturado
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

### Arquivos de Log

```bash
backend/logs/
├── combined.log      # Todos os logs
├── error.log        # Apenas erros
└── http.log         # Logs de requisições HTTP
```

### Exemplos de Logs

```json
// HTTP Request Log
{
  "timestamp": "2025-01-21T15:30:00.000Z",
  "level": "info",
  "message": "HTTP GET /api/v1/temperaturas",
  "service": "temperatura-backend",
  "requestId": "req_123456",
  "metadata": {
    "method": "GET",
    "url": "/api/v1/temperaturas",
    "statusCode": 200,
    "responseTime": 145,
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.100"
  }
}

// Error Log
{
  "timestamp": "2025-01-21T15:30:00.000Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "temperatura-backend",
  "metadata": {
    "error": "ECONNREFUSED",
    "host": "localhost",
    "port": 5432,
    "stack": "Error: connect ECONNREFUSED..."
  }
}
```

## Testing Strategy

### Estrutura de Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── services/           # Testes de serviços
│   ├── utils/             # Testes de utilitários
│   └── models/            # Testes de modelos
├── integration/            # Testes de integração
│   ├── api/               # Testes de API
│   └── database/          # Testes de banco
└── e2e/                   # Testes end-to-end
    ├── scenarios/         # Cenários de usuário
    └── fixtures/          # Dados de teste
```

### Cobertura de Testes Atual

```typescript
// Backend (Jest) - 22 testes
describe('Backend Test Suite', () => {
  // ✅ basic.test.ts (3 testes)
  // ✅ utilities.test.ts (13 testes)  
  // ✅ database.enhanced.test.ts (6 testes)
});

// Frontend (Vitest) - 51+ testes
describe('Frontend Test Suite', () => {
  // ✅ TemperatureCharts.test.ts (9 testes)
  // ✅ Dashboard.test.tsx (9 testes)
  // ✅ TemperatureCard.test.tsx (17 testes)
  // ✅ AlertsPanel.test.tsx (16 testes)
  // ✅ ApiService.test.tsx (18+ testes)
});

// Total: 73+ testes passando
```

### Mocking Strategy

```typescript
// Backend mocks
jest.mock('pg', () => mockPostgreSQL);
jest.mock('winston', () => mockLogger);
jest.mock('../config/environment', () => mockConfig);

// Frontend mocks
vi.mock('../services/api', () => mockApiService);
vi.mock('../contexts/AppContext', () => mockAppContext);
vi.mock('axios', () => mockAxios);
```

## Security Considerations

### Backend Security

```typescript
// Security middlewares aplicados
app.use(helmet()); // Headers de segurança
app.use(cors(corsOptions)); // CORS configurado
app.use(rateLimit(rateLimitConfig)); // Rate limiting

// Validação de entrada
const validateTemperatureData = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    cidade_id: Joi.number().integer().positive().required(),
    limit: Joi.number().integer().min(1).max(1000).optional()
  });
  
  // Validação...
};
```

### Configurações Recomendadas

```typescript
// Helmet configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openweathermap.org"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// Rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: "Too many requests from this IP"
};
```

## Performance Optimization

### Database Optimization

```sql
-- Configurações recomendadas para PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET random_page_cost = 1.1;

-- Particionamento da tabela temperatures (para grandes volumes)
CREATE TABLE temperatures_y2025m01 PARTITION OF temperatures
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Application-Level Optimization

```typescript
// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query optimization
const getTemperatures = async (cityId?: number, limit = 50) => {
  // Use prepared statements
  const query = 'SELECT * FROM v_temperatures_recent WHERE ($1::int IS NULL OR cidade_id = $1) LIMIT $2';
  return pool.query(query, [cityId, limit]);
};

// Response compression
app.use(compression());

// Static file optimization
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: true
}));
```

### Frontend Optimization

```typescript
// Code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const AlertsPanel = lazy(() => import('./components/AlertsPanel'));

// Memoization
const TemperatureCard = memo(({ temperature }: TemperatureCardProps) => {
  const formattedTemp = useMemo(() => 
    formatTemperature(temperature.temperatura), [temperature.temperatura]);
  
  return <div>{formattedTemp}</div>;
});

// Virtual scrolling for large datasets
const VirtualizedList = ({ items }: { items: Temperature[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={100}
    >
      {({ index, style }) => (
        <div style={style}>
          <TemperatureCard temperature={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

## Monitoring e Observability

### Health Checks

```typescript
// Endpoint de health check detalhado
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      openweather: await checkOpenWeather()
    }
  };
  
  const overallHealth = Object.values(health.services)
    .every(service => service === 'healthy');
  
  res.status(overallHealth ? 200 : 503).json(health);
});
```

### Métricas Customizadas

```typescript
interface SystemMetrics {
  requests_total: number;
  requests_per_minute: number;
  response_time_avg: number;
  error_rate: number;
  active_connections: number;
  cache_hit_rate: number;
  database_query_time: number;
}

// Coleta de métricas
const metrics = {
  requestsTotal: 0,
  requestTimes: [],
  errors: 0,
  
  recordRequest(duration: number) {
    this.requestsTotal++;
    this.requestTimes.push(duration);
    // Keep only last 1000 requests
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }
  },
  
  getAverageResponseTime() {
    return this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
  }
};
```

## Deployment Architecture

### Docker Compose (Produção)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
      
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## Manutenção e Troubleshooting

### Logs Úteis para Debug

```bash
# Verificar status dos containers
docker compose ps

# Logs do backend
docker compose logs -f backend

# Logs do banco de dados
docker compose logs postgres

# Logs do Nginx
docker exec nginx tail -f /var/log/nginx/error.log

# Performance do banco
docker compose exec postgres pg_stat_activity
```

### Comandos de Manutenção

```bash
# Backup manual do banco
docker compose exec postgres pg_dump -U temperatura_user temperatura_db > backup.sql

# Limpeza de logs antigos
docker compose exec backend find /app/logs -name "*.log" -mtime +7 -delete

# Reiniciar serviço específico
docker compose restart backend

# Verificar uso de recursos
docker stats

# Limpeza do cache Redis
docker compose exec redis redis-cli FLUSHALL
```

Esta documentação técnica serve como referência completa para desenvolvedores e administradores do sistema. Mantenha-a atualizada conforme novas funcionalidades são implementadas.
