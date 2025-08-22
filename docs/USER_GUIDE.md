# Manual do Usuário - Sistema de Monitoramento de Temperatura

## Bem-vindo ao Sistema de Monitoramento de Temperatura

Este sistema permite monitorar as condições meteorológicas de múltiplas cidades brasileiras em tempo real, configurar alertas personalizados e analisar dados históricos através de gráficos interativos.

## Acessando o Sistema

### URL de Acesso
- **Desenvolvimento:** http://localhost:5173
- **Produção:** https://seu-dominio.com

### Compatibilidade
- **Navegadores:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Dispositivos:** Desktop, tablet e mobile (design responsivo)

## Interface Principal

### Dashboard Overview

O dashboard principal apresenta três seções principais acessíveis através de abas:

1. **Overview** - Visão geral das temperaturas atuais
2. **Alertas** - Sistema de monitoramento e configuração de alertas
3. **Gráficos** - Análise histórica através de gráficos interativos

## Seção Overview

### Cards de Temperatura

Cada cidade monitorada é apresentada em um card contendo:

**Informações Principais:**
- 🌡️ **Temperatura atual** (em Celsius)
- 🌡️ **Sensação térmica**
- 💧 **Umidade relativa** (percentual)
- 📊 **Pressão atmosférica** (hPa)
- 🌤️ **Descrição do tempo** (ex: "Ensolarado", "Nublado")
- 🕒 **Horário da última atualização**

**Indicadores Visuais:**
- **Cores dos Cards:**
  - 🔴 Vermelho: Temperatura muito alta (>35°C)
  - 🟠 Laranja: Temperatura alta (30-35°C)
  - 🟢 Verde: Temperatura normal (15-29°C)
  - 🔵 Azul: Temperatura baixa (5-14°C)
  - 🟣 Roxo: Temperatura muito baixa (<5°C)

### Estatísticas Gerais

No topo do dashboard, você encontra:
- **Temperatura Média:** Média de todas as cidades
- **Temperatura Mínima:** Menor temperatura registrada
- **Temperatura Máxima:** Maior temperatura registrada
- **Última Atualização:** Horário da última coleta de dados

## Seção Alertas

### Visualização de Alertas Ativos

#### Aba "Alertas Recentes"
Mostra alertas disparados recentemente com:
- **Tipo de alerta:** Alta ou baixa temperatura
- **Cidade afetada**
- **Temperatura registrada**
- **Severidade:** Normal, Alta, Crítica, Emergência
- **Horário do disparo**
- **Status:** Ativo ou Resolvido

#### Cores de Severidade:
- 🟢 **Normal:** Situação controlada
- 🟡 **Alta:** Atenção necessária  
- 🔴 **Crítica:** Ação imediata requerida
- 🟣 **Emergência:** Situação extrema

### Configuração de Alertas

#### Aba "Configurações"
Permite configurar alertas personalizados:

**Configurações por Cidade:**
- **São Paulo:**
  - Alerta de calor: >35°C
  - Alerta de frio: <5°C
- **Rio de Janeiro:**
  - Alerta de calor: >38°C  
  - Alerta de frio: <8°C
- **Brasília:**
  - Alerta de calor: >36°C
  - Alerta de frio: <2°C

**Opções de Notificação:**
- ✅ Email: Receber alertas por email
- ✅ Dashboard: Exibir alertas na interface
- ⚙️ Frequência: Configurar intervalo de verificação

### Filtros de Alertas

Use os filtros para organizar a visualização:
- **Por Severidade:** Normal, Alta, Crítica, Emergência
- **Por Tipo:** Alta temperatura, Baixa temperatura
- **Por Cidade:** São Paulo, Rio de Janeiro, Brasília
- **Por Data:** Últimas 24h, 7 dias, 30 dias

## Seção Gráficos

### Tipos de Gráficos Disponíveis

#### 1. Gráfico de Linha
- **Uso:** Visualizar tendências de temperatura ao longo do tempo
- **Ideal para:** Análise de variações diárias/horárias

#### 2. Gráfico de Área  
- **Uso:** Mostrar volume de dados e tendências preenchidas
- **Ideal para:** Comparação visual entre períodos

#### 3. Gráfico de Barras
- **Uso:** Comparar temperaturas entre diferentes horários
- **Ideal para:** Análise de picos e médias

### Controles dos Gráficos

**Filtro por Cidade:**
- 🏙️ Todas as cidades
- 🏙️ São Paulo
- 🏙️ Rio de Janeiro  
- 🏙️ Brasília

**Período de Análise:**
- ⏰ Últimas 6 horas
- ⏰ Últimas 24 horas
- ⏰ Últimos 7 dias
- ⏰ Últimos 30 dias

**Métricas Disponíveis:**
- 🌡️ Temperatura
- 🌡️ Sensação térmica
- 💧 Umidade
- 📊 Pressão atmosférica

### Interação com Gráficos

- **Zoom:** Use o mouse para ampliar áreas específicas
- **Tooltip:** Passe o mouse sobre pontos para ver dados detalhados
- **Legenda:** Clique nos itens da legenda para mostrar/ocultar séries
- **Download:** Botão para exportar gráfico como imagem PNG

## Funcionalidades Gerais

### Atualização Automática

O sistema atualiza automaticamente:
- **Dados de temperatura:** A cada 10 minutos
- **Alertas:** Verificação contínua em tempo real
- **Gráficos:** Atualizados conforme novos dados chegam

### Indicadores de Status

**Conexão com API:**
- 🟢 Verde: Conectado e funcionando
- 🟡 Amarelo: Reconectando
- 🔴 Vermelho: Sem conexão

**Última Atualização:**
- Timestamp visível em cada seção
- Atualização automática do horário

### Estados de Carregamento

**Loading Spinner:** Exibido durante:
- Carregamento inicial da página
- Atualização de dados
- Aplicação de filtros
- Geração de gráficos

**Mensagens de Erro:**
- Erro de conexão com API
- Dados indisponíveis temporariamente
- Problemas na OpenWeather API

## Troubleshooting - Problemas Comuns

### Dados Não Carregam
1. Verifique sua conexão com internet
2. Atualize a página (F5 ou Ctrl+R)
3. Limpe o cache do navegador
4. Verifique se o JavaScript está habilitado

### Gráficos Não Aparecem
1. Aguarde o carregamento completo da página
2. Tente alterar o tipo de gráfico
3. Verifique se há dados para o período selecionado
4. Use um navegador compatível

### Alertas Não Funcionam
1. Verifique as configurações de alertas
2. Confirme se os thresholds estão corretos
3. Verifique se o email está configurado corretamente

### Performance Lenta
1. Feche outras abas do navegador
2. Selecione períodos menores nos gráficos
3. Desabilite extensões do navegador temporariamente

## Dicas de Uso

### Para Melhor Experiência
- **Use Chrome ou Firefox** para melhor compatibilidade
- **Monitore regularmente** os alertas configurados
- **Analise tendências** usando gráficos de períodos longos
- **Compare cidades** usando filtros nos gráficos

### Interpretação dos Dados
- **Sensação térmica** pode diferir da temperatura real
- **Umidade alta** pode intensificar a sensação de calor
- **Pressão baixa** pode indicar mudanças climáticas
- **Variações bruscas** merecem atenção especial

### Configuração de Alertas
- **Seja realista** com os thresholds (não muito baixos)
- **Configure email** para receber notificações importantes
- **Monitore alertas críticos** com frequência
- **Ajuste configurações** baseado no histórico

## Dados das Cidades Monitoradas

### São Paulo, SP
- **População:** ~12 milhões (região metropolitana)
- **Clima:** Subtropical úmido
- **Temperatura típica:** 15°C a 28°C
- **Características:** Variações por poluição e urbanização

### Rio de Janeiro, RJ  
- **População:** ~6,7 milhões (região metropolitana)
- **Clima:** Tropical atlântico
- **Temperatura típica:** 18°C a 30°C
- **Características:** Influência oceânica, alta umidade

### Brasília, DF
- **População:** ~3,1 milhões (distrito federal)
- **Clima:** Tropical de altitude com estações seca/chuvosa
- **Temperatura típica:** 12°C a 28°C
- **Características:** Amplitude térmica maior, baixa umidade no inverno

## Contato e Suporte

### Suporte Técnico
- **Email:** suporte@sistema-temperatura.com
- **Horário:** Segunda a sexta, 9h às 18h
- **Tempo de resposta:** Até 24 horas

### Reportar Problemas
Ao reportar problemas, inclua:
- Navegador e versão utilizada
- Sistema operacional  
- Descrição detalhada do problema
- Prints de tela (se aplicável)
- Horário em que ocorreu

### Sugestões de Melhorias
Envie sugestões para: melhorias@sistema-temperatura.com

---

**Versão do Manual:** 1.0  
**Última Atualização:** Janeiro 2025  
**Sistema:** Monitoramento de Temperatura v1.0
