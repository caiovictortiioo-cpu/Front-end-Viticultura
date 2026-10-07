# Backend Java — AgroClima API

API Spring Boot responsável por autenticação JWT, RBAC, usuários, tipos de uva, plantações, configurações, auditoria e persistência PostgreSQL.

## Requisitos

- JDK 21;
- Maven 3.9+;
- PostgreSQL 16+;
- Docker opcional para os testes de integração com Testcontainers.

## Configuração

Copie `.env.example` para `.env` e preencha as variáveis localmente. O Spring Boot não lê arquivos `.env` automaticamente; exporte-as no terminal ou use o Docker Compose da raiz quando configurado.

Gere valores aleatórios para `JWT_SECRET` e `INTERNAL_API_KEY` (mínimo de 32 caracteres). Defina `INITIAL_ADMIN_PASSWORD` com pelo menos 8 caracteres, uma letra e um número. Não versione `.env`.

A migration Flyway `src/main/resources/db/migration/V1__create_agroclima_schema.sql` cria o schema, os papéis/permissões iniciais e as cinco variedades já usadas pelo frontend. O Hibernate valida o schema; não cria tabelas fora das migrations.

## Execução

Com PostgreSQL disponível e as variáveis exportadas:

```bash
cd backend/java
mvn spring-boot:run
```

A API escuta em `http://localhost:8080`. O usuário administrativo inicial só é criado se `INITIAL_ADMIN_PASSWORD` estiver configurada.

## Documentação e health

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

## Prefixos e proteção

- `/api/auth/**`: login e cadastro público de Produtor;
- `/api/users/**`, `/api/roles/**`, `/api/permissions`, `/api/settings`, `/api/audit-events`: protegidos por JWT e permissões;
- `/api/plantations/**`: proprietário, papel e permissões são validados no servidor; datas de início/colheita são controladas pela API;
- `/api/varieties/**`: consulta autenticada; inclusão e desativação somente pelo Administrador;
- `/api/climate/readings/**`: consulta autenticada com permissão de monitoramento;
- `/api/internal/climate-readings/**`: integração serviço-a-serviço, protegida por `X-Internal-Api-Key` e `INTERNAL_API_KEY`.

A sessão usa JWT stateless. O logout no cliente remove o token; ele expira conforme `JWT_TTL_MINUTES` ou a preferência de sessão. Senhas são armazenadas com BCrypt. Após falhas consecutivas, a conta entra em bloqueio temporário conforme as variáveis de lockout.
