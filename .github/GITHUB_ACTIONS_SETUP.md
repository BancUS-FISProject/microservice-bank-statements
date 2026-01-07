# GitHub Actions - Build and Push Docker Image

## ¿Qué hace este Action?

El workflow `.github/workflows/docker-build-push.yml` automáticamente:

1. **Valida** el código con npm audit
2. **Ejecuta** tests internos
3. **Verifica** si existen credenciales de Docker Hub
4. **Construye y publica** imagen Docker (solo si hay credenciales)

Se ejecuta en:
- ✅ Push a `main` o `develop`
- ✅ Tags de release (`v*.*.*`)
- ✅ Pull requests (solo tests, sin build)
- ✅ Ejecución manual (workflow_dispatch)

## Comportamiento adaptativo

### ✅ Con credenciales Docker Hub configuradas:
- Ejecuta tests
- Construye imagen Docker
- Publica a Docker Hub con tags automáticos

### ⚠️ Sin credenciales Docker Hub:
- Ejecuta tests
- Muestra advertencia
- Omite construcción y publicación de Docker

## Configuración (Opcional)

### Agregar secretos para Docker Hub

Si quieres que el workflow publique automáticamente a Docker Hub:

**Ve a:** Settings → Secrets and variables → Actions

**Agrega dos secretos:**

| Nombre | Valor |
|--------|-------|
| `DOCKER_USERNAME` | Tu usuario de Docker Hub |
| `DOCKER_PASSWORD` | Token de Docker Hub |

### Cómo generar un token en Docker Hub

1. Ve a https://hub.docker.com/settings/security
2. Click en "New Access Token"
3. Nombre: `github-actions`
4. Copia el token y úsalo como `DOCKER_PASSWORD`

> **Nota:** Los secretos son opcionales. El workflow funciona sin ellos (solo ejecuta tests).

## Cómo usar

### Push normal

```bash
git add .
git commit -m "feat: nuevo endpoint por IBAN"
git push origin main
```

**Con credenciales:** Tests + Build + Push a `edithct/microservice-bank-statements:latest`  
**Sin credenciales:** Solo tests

### Release con versionado

```bash
git tag v1.0.0
git push origin v1.0.0
```

→ Publica con tags: `1.0.0`, `1.0`, `latest` (si hay credenciales)

### Pull Request

```bash
git checkout -b feature/nuevo-endpoint
git push origin feature/nuevo-endpoint
# Crear PR en GitHub
```

→ Solo ejecuta tests (nunca hace build/push en PRs)

### Construcción manual (alternativa)

Si no tienes credenciales configuradas o prefieres control manual:

```bash
docker buildx build \
  --platform linux/amd64 \
  -t edithct/microservice-bank-statements:1.0.0 \
  -t edithct/microservice-bank-statements:latest \
  --push .
```

## Archivos

- `.github/workflows/docker-build-push.yml` — Workflow principal (tests + Docker)
- `.github/workflows/test.yml` — Workflow de tests con múltiples versiones Node

## Troubleshooting

### ❌ "Tests failed"

- Revisa los logs en GitHub → Actions
- Ejecuta los tests localmente:
  ```bash
  npm run test:internal
  ```

### ⚠️ "Docker credentials not found"

Este es solo un mensaje informativo, no un error. El workflow continúa ejecutando tests.

**Para habilitar build/push automático:**
- Agrega `DOCKER_USERNAME` y `DOCKER_PASSWORD` en GitHub Secrets
- Ver sección "Configuración (Opcional)" arriba

### ❌ "authentication required" (con credenciales)

- Verifica que `DOCKER_USERNAME` y `DOCKER_PASSWORD` estén bien configurados
- Asegúrate de usar un Access Token, no la contraseña de Docker Hub
- Verifica permisos del token (debe permitir push)

### ❌ "npm audit" falla

- El Action continúa incluso si npm audit encuentra issues (`continue-on-error: true`)
- Revisa localmente: `npm audit`

### ❌ "npm ci failed"

- Asegúrate de que `package-lock.json` esté actualizado
- Ejecuta localmente: `npm ci`

## Tests ejecutados

- ✅ Health check
- ✅ Generación de statements
- ✅ Consulta por IBAN
- ✅ Validación de formato IBAN
- ✅ Validación de formato mes
- ✅ Operaciones CRUD

**Total: 8 tests internos**

## Tags automáticos de Docker

Cuando hay credenciales configuradas, el workflow genera tags automáticos:

| Evento | Tags generados |
|--------|---------------|
| Push a `main` | `latest`, `main-{sha}` |
| Push a `develop` | `develop`, `develop-{sha}` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `latest` |

## Recursos

- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Hub Access Tokens](https://docs.docker.com/security/for-developers/access-tokens/)
- [Jest Testing](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
