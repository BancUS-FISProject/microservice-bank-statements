# GitHub Actions - Testing Workflow

## 📋 Resumen

Se han configurado **2 workflows de GitHub Actions** para el proyecto:

### 1. **test.yml** - Workflow de Tests (NUEVO)
Ejecuta tests automáticamente en cada push o pull request a las ramas principales.

**Características:**
- ✅ Se ejecuta en `push` y `pull_request` a las ramas `main`, `master` y `develop`
- ✅ Ejecuta tests en múltiples versiones de Node.js (20 y 22)
- ✅ Ejecuta `npm run test:internal` (tests sin dependencia de BD)
- ✅ Genera reportes de cobertura de código
- ✅ Ejecuta auditoría de seguridad con `npm audit`
- ✅ Sube reportes de cobertura como artefactos (7 días de retención)

### 2. **docker-build-push.yml** - Workflow de Docker (ACTUALIZADO)
Construye y publica la imagen Docker.

**Actualización:**
- ✅ Ahora ejecuta tests antes de construir la imagen Docker
- ✅ Solo construye la imagen si los tests pasan exitosamente

## 🚀 ¿Cómo funciona?

### Flujo de ejecución en cada commit:

```
1. Push a main/master/develop
   ↓
2. GitHub Actions detecta el cambio
   ↓
3. Ejecuta test.yml:
   - Instala dependencias
   - Ejecuta tests internos en Node 20 y 22
   - Genera cobertura de código
   - Ejecuta npm audit
   ↓
4. Si los tests pasan → Ejecuta docker-build-push.yml:
   - Ejecuta tests nuevamente (validación)
   - Construye imagen Docker
   - Publica a Docker Hub
   ↓
5. ✅ Commit aprobado y desplegado
```

## 📊 Tests Incluidos

### Tests Internos (8 tests)
- Health check (`GET /`)
- Health endpoint (`GET /health`)
- Validación de formato IBAN
- Validación de formato de mes
- Generación de statements
- Consulta por cuenta
- Consulta por IBAN

### Tests Externos (11 tests)
- Todos los endpoints principales
- Operaciones CRUD completas
- Manejo de errores

**Total: 19 tests** ✅

## 🔧 Comandos Locales

```bash
# Ejecutar todos los tests
npm test

# Solo tests internos (sin servidor)
npm run test:internal

# Solo tests externos (requiere servidor corriendo)
npm run test:external

# Tests con cobertura
npm test -- --coverage
```

## 📈 Badges

Agrega estos badges al README.md para mostrar el estado de los tests:

```markdown
[![Run Tests](https://github.com/BancUS-FISProject/microservice-bank-statements/actions/workflows/test.yml/badge.svg)](https://github.com/BancUS-FISProject/microservice-bank-statements/actions)
[![Build and Push Docker Image](https://github.com/BancUS-FISProject/microservice-bank-statements/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/BancUS-FISProject/microservice-bank-statements/actions)
```

## 🎯 Beneficios

1. **Calidad de código**: Tests automáticos en cada commit
2. **Prevención de bugs**: Detecta problemas antes de llegar a producción
3. **Compatibilidad**: Verifica que funcione en múltiples versiones de Node.js
4. **Seguridad**: Auditoría automática de dependencias
5. **Documentación**: Reportes de cobertura de código
6. **Confianza**: Solo se despliega código que pasa todos los tests

## 🔍 Ver Resultados

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Verás todos los workflows ejecutados
4. Click en cualquier workflow para ver detalles

## 📝 Notas

- Los tests internos no requieren MongoDB, por lo que son ideales para CI/CD
- Los reportes de cobertura se guardan como artefactos por 7 días
- Si los tests fallan, la imagen Docker NO se construirá
- El workflow se ejecuta en paralelo en Node.js 20 y 22 para asegurar compatibilidad
