#!/bin/bash

# Script para probar los tres endpoints principales
# Ejecutar: chmod +x test-endpoints.sh && ./test-endpoints.sh

BASE_URL="http://localhost:3000/v1/bankstatements"
IBAN="ES1111111111111111111111"
# Reemplaza este token con uno válido de tu sistema de autenticación
TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

echo "=========================================="
echo "PRUEBAS DE ENDPOINTS - Bank Statements"
echo "=========================================="
echo ""

echo "1️⃣  TEST: GET /by-iban/:iban - Listar meses disponibles"
echo "   Endpoint: GET ${BASE_URL}/by-iban/${IBAN}"
echo "   Propósito: Obtener lista de meses con statements disponibles"
echo "   ------------------------------------------"
curl -s -X GET "${BASE_URL}/by-iban/${IBAN}" \
  -H "Accept: application/json" \
  -H "Authorization: ${TOKEN}" | jq '.' || echo "Error en request"
echo ""
echo ""

echo "2️⃣  TEST: GET /by-iban?iban&month - Obtener statement específico"
echo "   Endpoint: GET ${BASE_URL}/by-iban?iban=${IBAN}&month=2025-12"
echo "   Propósito: Obtener detalle de un statement existente"
echo "   ------------------------------------------"
curl -s -X GET "${BASE_URL}/by-iban?iban=${IBAN}&month=2025-12" \
  -H "Accept: application/json" \
  -H "Authorization: ${TOKEN}" | jq '.' || echo "Error en request"
echo ""
echo ""

echo "3️⃣  TEST: POST /generate-current - Generar statement mes actual"
echo "   Endpoint: POST ${BASE_URL}/generate-current"
echo "   Propósito: Generar estado de cuenta del mes actual desde transacciones"
echo "   ------------------------------------------"
curl -s -X POST "${BASE_URL}/generate-current" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${TOKEN}" \
  -d "{\"iban\": \"${IBAN}\"}" | jq '.' || echo "Error en request"
echo ""
echo ""

echo "=========================================="
echo "PRUEBAS COMPLETADAS"
echo "=========================================="
echo ""
echo "📝 RESUMEN:"
echo "   - Endpoint 1: Lista meses disponibles (histórico)"
echo "   - Endpoint 2: Obtiene statement ya existente"
echo "   - Endpoint 3: GENERA nuevo statement del mes actual"
echo ""
