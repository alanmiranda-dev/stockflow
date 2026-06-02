# StockFlow

## Sobre o Projeto

O StockFlow é uma aplicação web de gerenciamento de estoque desenvolvida como atividade prática da disciplina de Redes e Sistemas Distribuídos.

O sistema permite cadastrar, editar, remover e consultar produtos, além de registrar automaticamente todas as operações realizadas através de um sistema de auditoria.

O principal objetivo do projeto é demonstrar a implementação de uma arquitetura distribuída, separando interface, processamento e persistência de dados em servidores independentes.

---

## Funcionalidades

- Cadastro de produtos
- Edição de produtos
- Exclusão de produtos
- Consulta de estoque
- Pesquisa por nome
- Filtro por categoria
- Dashboard com indicadores
- Gráficos estatísticos
- Sistema de auditoria
- Histórico de logs
- Limpeza de logs
- Modo escuro

---

## Arquitetura Distribuída

A aplicação foi construída seguindo uma arquitetura de três camadas:

### Servidor 1 - Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js
- Porta: **8080**

### Servidor 2 - Backend
- Node.js
- Express
- API REST
- Porta: **3000**

### Servidor 3 - Banco de Dados
- PostgreSQL
- Executado em container Docker
- Porta: **5432**

### Fluxo de Comunicação

```text
Frontend (8080)
       ↓ HTTP
Backend (3000)
       ↓ SQL
PostgreSQL (5432)
```

---

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js

### Backend
- Node.js
- Express.js
- PostgreSQL Driver (pg)

### Banco de Dados
- PostgreSQL
- Docker

---

## Estrutura do Projeto

```text
stockflow/
│
├── frontend/
│   ├── index.html
│   ├── logs.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── app.js
│   ├── db.js
│   ├── package.json
│   └── .env
│
└── banco/
    └── PostgreSQL (Docker)
```

---

## Como Executar o Projeto

### 1. Iniciar o Banco de Dados

Verifique se o container PostgreSQL está ativo:

```bash
docker ps
```

Caso esteja parado:

```bash
docker start postgres
```

Verifique se o banco está acessível:

```bash
psql -U postgres -d stockflow
```

---

### 2. Iniciar o Backend

Acesse a pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Inicie a API:

```bash
node app.js
```

A API ficará disponível em:

```text
http://localhost:3000
```

---

### 3. Iniciar o Frontend

Acesse a pasta frontend:

```bash
cd frontend
```

Execute um servidor HTTP local:

```bash
npx http-server
```

ou

```bash
http-server
```

A aplicação ficará disponível em:

```text
http://localhost:8080
```

---

## Endpoints da API

### Status da API

```http
GET /
```

Retorna informações sobre o funcionamento da API e da conexão com o banco.

### Produtos

Listar produtos:

```http
GET /produtos
```

Cadastrar produto:

```http
POST /produtos
```

Atualizar produto:

```http
PUT /produtos/:id
```

Excluir produto:

```http
DELETE /produtos/:id
```

### Auditoria

Listar logs:

```http
GET /logs
```

Limpar logs:

```http
DELETE /logs
```

---

## Sistema de Auditoria

Toda operação realizada sobre produtos gera automaticamente um registro na tabela de auditoria.

Eventos registrados:

- Cadastro de produtos
- Edição de produtos
- Exclusão de produtos

Cada registro armazena:

- Data e hora
- Tipo da operação
- Descrição da ação executada

---

## Conceitos de Sistemas Distribuídos Aplicados

- Arquitetura Cliente-Servidor
- Comunicação via API REST
- Separação de responsabilidades
- Containers Docker
- Banco de dados remoto
- Comunicação TCP/IP
- Processamento distribuído

---

## Demonstração da Arquitetura

Durante a apresentação foram demonstrados:

- Frontend executando na porta 8080
- Backend executando na porta 3000
- PostgreSQL executando em container Docker
- Comunicação entre os serviços
- Persistência dos dados no banco
- Sistema de auditoria registrando operações em tempo real

---

## Equipe

Projeto desenvolvido para a disciplina de Redes e Sistemas Distribuídos.

### Integrantes

- 2304059 - Alan Miranda
- 2208530 - Andre Cicero da Silva
- 2304716 - João Vitor Silva Santana
- 2304706 - Pedro Otavio Oliveira Silva
- 2301617 - Rafael Rueda Ananias
- 2303662 - Renan Manancero de Oliveira