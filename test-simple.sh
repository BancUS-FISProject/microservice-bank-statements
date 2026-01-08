#!/bin/bash

# Script de prueba simple para los 3 endpoints principales
# SIN TOKEN - para testing local

BASE_URL="http://localhost:3000/v1/bankstatements"
IBAN="ES1111111111111111111111"
MONTH="2026-01"  # Mes actual

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      PRUEBA DE LOS 3 ENDPOINTS PRINCIPALES                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Test 1
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  GET /by-iban/:iban"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Propósito: Listar meses disponibles para el IBAN"
echo "🔗 URL: ${BASE_URL}/by-iban/${IBAN}"
echo ""
RESPONSE1=$(curl -s -w "\n%{http_code}" "${BASE_URL}/by-iban/${IBAN}")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | sed '$d')

echo "📊 Status: $HTTP_CODE1"
echo "📄 Response:"
echo "$BODY1" | jq '.' 2>/dev/null || echo "$BODY1"
echo ""

# Test 2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  GET /by-iban?iban&month"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Propósito: Obtener statement existente de un mes específico"
echo "🔗 URL: ${BASE_URL}/by-iban?iban=${IBAN}&month=${MONTH}"
echo ""
RESPONSE2=$(curl -s -w "\n%{http_code}" "${BASE_URL}/by-iban?iban=${IBAN}&month=${MONTH}")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

echo "📊 Status: $HTTP_CODE2"
echo "📄 Response:"
echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
echo ""

# Test 3
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  POST /generate-current"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Propósito: GENERAR statement del mes actual desde transacciones"
echo "🔗 URL: ${BASE_URL}/generate-current"
echo "📦 Body: {\"iban\": \"${IBAN}\"}"
echo ""
RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/generate-current" \
  -H "Content-Type: application/json" \
  -d "{\"iban\": \"${IBAN}\"}")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | sed '$d')

echo "📊 Status: $HTTP_CODE3"
echo "📄 Response:"
echo "$BODY3" | jq '.' 2>/dev/null || echo "$BODY3"
echo ""

# Resumen
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    RESUMEN DE RESULTADOS                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Endpoint 1 (Lista meses):    HTTP $HTTP_CODE1"
echo "  Endpoint 2 (Get statement):  HTTP $HTTP_CODE2"
echo "  Endpoint 3 (Generate):       HTTP $HTTP_CODE3"
echo ""
echo "✅ 200/201 = OK  |  ❌ 400/403/404/500 = Error  |  ⚠️  Otros = Verificar"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📝 DIFERENCIAS ENTRE LOS ENDPOINTS:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Endpoint 1 (GET /by-iban/:iban):"
echo "    → Lista los meses que tienen statements guardados"
echo "    → NO genera nada, solo consulta"
echo ""
echo "  Endpoint 2 (GET /by-iban?iban&month):"
echo "    → Obtiene el detalle de un statement YA EXISTENTE"
echo "    → Si no existe, puede intentar generarlo automáticamente"
echo ""
echo "  Endpoint 3 (POST /generate-current):"
echo "    → GENERA un nuevo statement del MES ACTUAL"
echo "    → Llama al microservicio de transacciones"
echo "    → Filtra transacciones del mes actual"
echo "    → Calcula totales y PERSISTE en MongoDB"
echo "    → Es el que usa el botón 'Simular' del frontend"
echo ""
