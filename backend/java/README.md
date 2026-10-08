# Backend Java — AgroClima API

API Spring Boot responsável por autenticação JWT, RBAC, usuários, variedades, plantações, configurações, auditoria e persistência PostgreSQL.

## Requisitos locais

- JDK 21;
- Maven 3.9+;
- PostgreSQL 16+ em `localhost:5432`.

Docker não é necessário para iniciar ou desenvolver a API.

## Configuração local

Na raiz do repositório, copie `backend/java/.env.example` para `backend/java/.env` e configure:

- `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` para o PostgreSQL local;
- `JWT_SECRET` e `INTERNAL_API_KEY` como segredos aleatórios independentes com pelo menos 32 bytes;
- `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` para criar o primeiro Administrador;
- `CORS_ALLOWED_ORIGINS` com as origens locais permitidas, sem wildcard;
- `SERVER_ADDRESS=127.0.0.1` para o processo local e `PORT=8080`.

O Spring Boot não lê `.env` automaticamente. Use `bash backend/java/run-local.sh` em Linux/macOS ou `backend/java/run-local.ps1` no PowerShell; os scripts carregam as variáveis e iniciam `mvn spring-boot:run`. Também é possível exportar as variáveis manualmente.

A senha administrativa deve ter pelo menos 8 caracteres, conter letra e número e obedecer ao limite de tamanho. Não versione o `.env` real.

A migration `src/main/resources/db/migration/V1__create_agroclima_schema.sql` cria o schema, papéis/permissões e as cinco variedades existentes no frontend. O Flyway aplica a migration no startup e Hibernate valida o schema.

## Executar e verificar

```bash
bash backend/java/run-local.sh
```

A API local fica em `http://localhost:8080`:

- Swagger UI: `/swagger-ui.html`;
- OpenAPI JSON: `/v3/api-docs`;
- Health: `/actuator/health`.

## Prefixos e proteção

- `/api/auth/**`: login e cadastro público de Produtor;
- `/api/users/**`, `/api/roles/**`, `/api/permissions`, `/api/settings`, `/api/audit-events`: JWT e permissões;
- `/api/plantations/**`: escopo por proprietário, papel e permissões aplicados no servidor; datas controladas pela API;
- `/api/varieties/**`: consulta autenticada; inclusão e desativação somente pelo Administrador;
- `/api/climate/readings/**`: consulta autenticada;
- `/api/internal/climate-readings/**`: integração Python → Java autenticada por `X-Internal-Api-Key`.

A sessão usa JWT stateless; senhas são armazenadas com BCrypt. O logout remove o token do cliente; a validade é controlada por `JWT_TTL_MINUTES`. Falhas consecutivas podem bloquear a conta temporariamente.

## Testes

```bash
cd backend/java
mvn test
```

Testes unitários não precisam de Docker. O teste PostgreSQL/Testcontainers é configurado para ser ignorado se Docker não estiver disponível. Para validar o schema real, inicie o PostgreSQL local e a API.
