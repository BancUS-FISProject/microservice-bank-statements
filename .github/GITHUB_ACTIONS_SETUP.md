# GitHub Actions Setup Guide

## ¿Qué hace este Action?

El workflow `.github/workflows/docker-build-push.yml` automáticamente:

1. **Valida** el código (npm audit)
2. **Construye** la imagen Docker
3. **Hace push** a Docker Hub con tags automáticos:
   - `latest` (en branch main)
   - `develop` (en branch develop)
   - Tags semánticos: `v1.0.0` → `1.0.0`, `1.0`

Se ejecuta en:
- ✅ Push a `main` o `develop`
- ✅ Al crear tags de release (`v*.*.*`)
- ✅ Pull requests (solo validación, sin push)

## Configuración requerida

### 1. Agregar secretos a GitHub

Ve a: **Settings → Secrets and variables → Actions**

Agrega dos secretos:

| Nombre | Valor |
|--------|-------|
| `DOCKER_USERNAME` | Tu usuario de Docker Hub |
| `DOCKER_PASSWORD` | Token de Docker Hub (generar en https://hub.docker.com/settings/security) |

### 2. Cómo generar un token en Docker Hub

1. Ve a https://hub.docker.com/settings/security
2. Haz click en "New Access Token"
3. Dale un nombre descriptivo (ej: `github-actions`)
4. Cópialo y úsalo como `DOCKER_PASSWORD`

### 3. Permisos en GitHub

El Action necesita permisos para escribir en el registry. Por defecto está configurado en el YAML.

## Cómo usar

### Push normal (valida, construye y pushea)

```bash
git add .
git commit -m "feat: nuevo endpoint por IBAN"
git push origin main
```

→ El Action construirá y hará push a `edithct/microservice-bank-statements:latest`

### Release con versionado

```bash
git tag v1.0.0
git push origin v1.0.0
```

→ El Action hará push con tags: `1.0.0`, `1.0`, `latest`

### Pull Request (solo validación)

```bash
git checkout -b feature/nuevo-endpoint
git push origin feature/nuevo-endpoint
# Crear PR en GitHub
```

→ El Action valida npm audit y build, pero NO hace push

## Archivos generados

- `.github/workflows/docker-build-push.yml` — Workflow principal
- `.github/workflows/SETUP.md` — Este archivo (opcional)

## Troubleshooting

### ❌ "authentication required"

- Verifica que `DOCKER_USERNAME` y `DOCKER_PASSWORD` estén configurados en GitHub Secrets
- Asegúrate de que el usuario/token tengan permisos para escribir en el repo `edithct/microservice-bank-statements`

### ❌ "Build failed"

- Revisa los logs en GitHub → Actions
- Asegúrate que el Dockerfile sea válido localmente:
  ```bash
  docker build -t test:latest .
  ```

### ❌ "npm audit" falla

- El Action continúa incluso si npm audit encuentra issues (configurado con `continue-on-error: true`)
- Revisa los issues: `npm audit`

## Variables de entorno

Para cambiar:
- Docker registry: edita `REGISTRY` en el YAML
- Nombre de imagen: edita `IMAGE_NAME` en el YAML

Ejemplo para usar GitHub Container Registry (ghcr.io):

```yaml
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}/microservice-bank-statements
```

## Recursos

- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Semantic Versioning](https://semver.org/)
