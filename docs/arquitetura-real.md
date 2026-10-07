# Arquitetura implementada — AgroClima Cloud

## Escopo encontrado

O repositório é uma aplicação de front-end estática: HTML, CSS e módulos JavaScript nativos. Não há diretório ou dependência de backend, servidor de API, banco de dados, ORM, controllers HTTP ou DTOs. Por isso, os diagramas mostram a implementação que existe e deixam explícitas as camadas que não existem — não representam um backend hipotético.

## Fluxo real

```text
Pessoa → views/* → events/index.js → modules/* → data/local-repository.js → localStorage do navegador
                                      ↓
                            state/store.js → main.js → renderização da view
```

- `js/views/`: login, shell, páginas do Produtor, Analista e Administrador.
- `js/events/index.js`: recebe ações e envios de formulário por delegação (`data-action` / `data-form`). É um manipulador de eventos da interface, não um controller HTTP.
- `js/modules/`: regras locais de login demonstrativo, RBAC, plantio/colheita, preferências e auditoria.
- `js/data/local-repository.js`: leitura/gravação JSON com prefixo `agroclima:` e fallback em memória quando o navegador não disponibiliza armazenamento.
- `js/state/store.js`: estado transitório da interface e notificações para `js/main.js`.

## Estruturas de dados locais

Não são entidades ORM. São objetos JSON salvos no `localStorage` do navegador atual:

| Chave | Estrutura usada |
| --- | --- |
| `agroclima:plantations` | `{ id, variety, quantity, field, notes, plantedAt, harvestedAt, status, createdBy, harvestedBy? }`. `plantedAt` é atribuído no cadastro; `harvestedAt` começa `null` e só é atribuído na ação de colheita. Status: `Em cultivo` / `Colhida`. |
| `agroclima:rbac` | `{ users: [{ id, name, email, role, status }], rolePermissions: { [role]: string[] } }`. Papéis existentes: Produtor/Exportador, Analista de Dados e Administrador. |
| `agroclima:settings` | `{ general, notifications, appearance, security }`, incluindo tema, região, nome do sistema e preferências da demonstração. |
| `agroclima:audit-events` | Lista de `{ id, user, action, resource, occurredAt, source, status, details }`, limitada a 500 eventos. |

## Inventário das camadas solicitadas

- **Dados/estruturas**: registros JSON de plantio, usuário/papel/permissão, configurações e evento de auditoria descritos acima.
- **Regras/módulos**: `modules/plantations.js`, `modules/access-control.js`, `modules/settings.js`, `modules/audit.js` e `modules/auth.js`.
- **Persistência/repositório**: `data/local-repository.js`, apoiado somente por `localStorage` (por navegador/origem).
- **DTOs, controllers de API, ORM e banco de dados**: não existem neste checkout e, portanto, não foram criados.

## Limites de segurança e dados

A autenticação continua demonstrativa: `modules/auth.js` resolve o papel pelo usuário/e-mail e não valida senha em um servidor. O RBAC controla menus e rotas da SPA, mas pode ser alterado por quem controla o navegador; não é uma barreira de segurança de produção. As opções de política de senha/MFA são preferências locais e não são impostas a um provedor de identidade. As séries climáticas e de mercado continuam sendo valores demonstrativos em `js/data/series.js` e `js/data/varieties.js`; não há chamada real ao ThingSpeak nem a um serviço externo. Os registros criados na área de plantações são persistidos localmente, não compartilhados entre pessoas ou dispositivos.

Antes de produção, é necessário fornecer uma API autenticada, persistência no servidor, autorização RBAC aplicada no servidor, validação de entrada, política de auditoria e integração de dados real. Os PNGs abaixo não fazem essa arquitetura futura parecer existente.

## Diagramas PNG

- `diagrama-seguranca-armazenamento.png`
- `diagrama-analise-dados-dashboard.png`
