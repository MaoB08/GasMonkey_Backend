#!/bin/bash

echo "🔐 Generando certificado de prueba para desarrollo..."

# Crear directorio para certificados
mkdir -p certificates

# Generar clave privada
openssl genrsa -out certificates/private-key.pem 2048

# Generar certificado autofirmado
openssl req -new -x509 -key certificates/private-key.pem -out certificates/certificate.pem -days 365 \
  -subj "/C=CO/ST=Cundinamarca/L=Bogota/O=Universidad XYZ/OU=Estudiantes/CN=Practica Facturacion/emailAddress=estudiante@universidad.edu.co"

# Convertir a formato .p12 (PKCS12)
openssl pkcs12 -export -out certificates/test-certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:test123

echo ""
echo "✅ Certificado de prueba generado en: certificates/test-certificate.p12"
echo "🔑 Password: test123"
echo ""
echo "⚠️  NOTA: Este certificado es SOLO para desarrollo/práctica"
echo "         NO es válido para uso real con la DIAN"