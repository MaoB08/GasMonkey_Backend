# 🔧 GasMonkey Backend - API REST

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.18-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)

Backend del sistema GasMonkey - API REST construida con Node.js, Express y PostgreSQL.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Modelos de Base de Datos](#-modelos-de-base-de-datos)
- [Servicios](#-servicios)
- [Scripts Útiles](#-scripts-útiles)

---

## ✨ Características

- ✅ **API RESTful** con Express.js
- ✅ **ORM Sequelize** para PostgreSQL
- ✅ **Autenticación JWT** con bcrypt
- ✅ **Facturación Electrónica DIAN** con validaciones locales
- ✅ **Generación de PDFs** con PDFKit y pdf-lib
- ✅ **Códigos QR** para facturas
- ✅ **Envío de emails** con Nodemailer
- ✅ **Firma digital** de documentos XML
- ✅ **CORS** configurado para frontend
- ✅ **Validaciones** de datos
- ✅ **Manejo de errores** centralizado

---

## 🛠️ Tecnologías

### Core
- **Node.js** ^18.0.0 - Runtime de JavaScript
- **Express** ^4.18.2 - Framework web
- **Sequelize** ^6.35.0 - ORM para PostgreSQL
- **PostgreSQL** ^8.11.0 - Driver de base de datos

### Seguridad
- **bcrypt** ^5.1.1 - Encriptación de contraseñas
- **jsonwebtoken** ^9.0.2 - Autenticación JWT
- **cors** ^2.8.5 - Control de acceso CORS
- **dotenv** ^16.3.1 - Variables de entorno

### Facturación DIAN
- **xmlbuilder2** ^4.0.0 - Construcción de XML
- **node-forge** ^1.3.1 - Firma digital
- **adm-zip** ^0.5.16 - Compresión de archivos

### Generación de Documentos
- **pdfkit** ^0.17.2 - Generación de PDFs
- **pdf-lib** ^1.17.1 - Manipulación de PDFs
- **qrcode** ^1.5.4 - Generación de códigos QR

### Utilidades
- **axios** ^1.13.2 - Cliente HTTP
- **nodemailer** ^7.0.10 - Envío de emails
- **moment** ^2.30.1 - Manejo de fechas
- **chalk** ^5.6.2 - Colores en consola

### Desarrollo
- **nodemon** ^3.0.1 - Auto-reload en desarrollo

---

## 📁 Estructura del Proyecto

```
gas-monkey-project-backend/
├── src/
│   ├── config/                    # Configuración
│   │   ├── db.js                  # Conexión a PostgreSQL
│   │   ├── mailer.js              # Configuración de email
│   │   └── validation-rules.json  # Reglas de validación DIAN
│   │
│   ├── controllers/               # Controladores (lógica de negocio)
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── clientController.js
│   │   ├── customerController.js
│   │   ├── discountController.js
│   │   ├── inventoryProductController.js
│   │   ├── invoiceController.js
│   │   ├── passwordResetController.js
│   │   ├── paymentMethodController.js
│   │   ├── saleController.js
│   │   ├── saleReturnController.js
│   │   ├── staffController.js
│   │   ├── supportController.js
│   │   ├── taxConfigController.js
│   │   └── usuarioController.js
│   │
│   ├── models/                    # Modelos Sequelize
│   │   ├── Category.js
│   │   ├── City.js
│   │   ├── Client.js
│   │   ├── Company.js
│   │   ├── CreditNote.js
│   │   ├── Customer.js
│   │   ├── Discount.js
│   │   ├── InventoryProduct.js
│   │   ├── Invoice.js
│   │   ├── InvoiceItem.js
│   │   ├── PasswordResetToken.js
│   │   ├── PaymentMethod.js
│   │   ├── Product.js
│   │   ├── Resolution.js
│   │   ├── Sale.js
│   │   ├── SaleDetail.js
│   │   ├── SalePayment.js
│   │   ├── SaleReturn.js
│   │   ├── TaxConfiguration.js
│   │   ├── TestSetValidation.js
│   │   ├── User.js
│   │   ├── VerificationCode.js
│   │   └── index.js               # Relaciones entre modelos
│   │
│   ├── routes/                    # Rutas de API
│   │   ├── analytics.js
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── cities.js
│   │   ├── clients.js
│   │   ├── customers.js
│   │   ├── discounts.js
│   │   ├── inventoryProducts.js
│   │   ├── invoices.js
│   │   ├── passwordReset.js
│   │   ├── paymentMethods.js
│   │   ├── saleReturns.js
│   │   ├── sales.js
│   │   ├── staff.js
│   │   ├── support.js
│   │   ├── taxConfig.js
│   │   └── usuarios.js
│   │
│   ├── services/                  # Servicios
│   │   ├── dianService.js         # Integración con DIAN
│   │   ├── dianValidator.js       # Validaciones DIAN
│   │   ├── emailService.js        # Envío de emails
│   │   ├── invoiceXmlBuilder.js   # Construcción de XML
│   │   ├── pdfGenerator.js        # Generación de PDFs
│   │   ├── qrGenerator.js         # Generación de QR
│   │   └── signatureService.js    # Firma digital
│   │
│   ├── middlewares/               # Middlewares
│   │   └── authMiddleware.js      # Autenticación JWT
│   │
│   ├── scripts/                   # Scripts de utilidad
│   │   ├── seedCities.js          # Importar ciudades
│   │   └── ...
│   │
│   └── app.js                     # Configuración de Express
│
├── index.js                       # Punto de entrada
├── package.json
└── .env.example                   # Ejemplo de variables de entorno
```

---

## 🚀 Instalación

### 1. Requisitos Previos

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

### 2. Clonar e Instalar

```bash
cd gas-monkey-project-backend
npm install
```

### 3. Configurar Base de Datos

```sql
CREATE DATABASE GasMonkey;
```

### 4. Configurar Variables de Entorno

> [!IMPORTANT]
> **Debes configurar las variables de entorno antes de ejecutar el proyecto.**

Copia el archivo de ejemplo y edítalo con tus credenciales:

```bash
cp .env.example .env
```

Luego abre el archivo `.env` y configura todas las variables necesarias. **Consulta la sección [Configuración](#️-configuración) más abajo para detalles de cada variable.**

**Variables críticas que DEBES configurar:**
- `DATABASE_URL` - Conexión a tu base de datos PostgreSQL
- `JWT_SECRET` - Genera una clave segura de al menos 32 caracteres
- `EMAIL_USER` y `EMAIL_PASSWORD` - Para envío de emails

**Ejemplo de configuración mínima para desarrollo:**

```env
DATABASE_URL=postgresql://postgres:tu_contraseña@localhost:5432/GasMonkey
PORT=3000
NODE_ENV=development
JWT_SECRET=genera_una_clave_aleatoria_segura_de_al_menos_32_caracteres
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion_gmail
DEMO_MODE=true
DIAN_ENABLED=false
```

> [!TIP]
> Para generar un `JWT_SECRET` seguro, ejecuta:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> [!WARNING]
> **Nunca subas el archivo `.env` a Git.** Este archivo contiene credenciales sensibles y ya está incluido en `.gitignore`.

```env
# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/GasMonkey

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_minimo_32_caracteres

# Email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicación_gmail

# DIAN (Facturación Electrónica)
DIAN_TEST_SET_ID=tu_test_set_id
DIAN_SOFTWARE_ID=tu_software_id
DIAN_SOFTWARE_PIN=tu_software_pin
DIAN_CERTIFICATE_PATH=./certificates/certificate.p12
DIAN_CERTIFICATE_PASSWORD=tu_contraseña_certificado

# URLs
FRONTEND_URL=http://localhost:5173
```

### 5. Ejecutar Migraciones (Automático)

Las tablas se crean automáticamente al iniciar el servidor en modo desarrollo.

### 6. (Opcional) Importar Datos Iniciales

```bash
# Importar ciudades colombianas
node src/scripts/seedCities.js
```

---

## ⚙️ Configuración

### Variables de Entorno Detalladas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` o `production` |
| `JWT_SECRET` | Clave secreta para JWT | Mínimo 32 caracteres aleatorios |
| `EMAIL_USER` | Email para envío de notificaciones | `ejemplo@gmail.com` |
| `EMAIL_PASS` | Contraseña de aplicación de Gmail | Ver [Google App Passwords](https://support.google.com/accounts/answer/185833) |
| `DIAN_TEST_SET_ID` | ID del Test Set de DIAN | Proporcionado por DIAN |
| `DIAN_SOFTWARE_ID` | ID del software registrado | Proporcionado por DIAN |
| `DIAN_SOFTWARE_PIN` | PIN del software | Proporcionado por DIAN |
| `DIAN_CERTIFICATE_PATH` | Ruta al certificado digital | `./certificates/cert.p12` |
| `DIAN_CERTIFICATE_PASSWORD` | Contraseña del certificado | Proporcionada al crear certificado |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` |

---

## 🎯 Uso

### Modo Desarrollo

```bash
npm run dev
```

El servidor se reiniciará automáticamente con cada cambio.

### Modo Producción

```bash
npm start
```

### Verificar Estado

Accede a `http://localhost:3000/` para ver el estado de la API y los endpoints disponibles.

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Iniciar sesión | No |
| POST | `/register` | Registrar usuario | No |
| POST | `/verify-code` | Verificar código 2FA | No |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/listar` | Listar usuarios | Sí |
| POST | `/` | Crear usuario | Sí |
| PUT | `/:id` | Actualizar usuario | Sí |
| DELETE | `/:id` | Eliminar usuario | Sí |

### Clientes (`/api/clients`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar clientes | Sí |
| GET | `/:id` | Obtener cliente | Sí |
| POST | `/` | Crear cliente | Sí |
| PUT | `/:id` | Actualizar cliente | Sí |
| DELETE | `/:id` | Eliminar cliente | Sí |

### Búsqueda de Clientes (`/api/customers`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/search?document=123` | Buscar por documento | Sí |

### Categorías (`/api/categories`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar categorías | Sí |
| POST | `/` | Crear categoría | Sí |
| PUT | `/:id` | Actualizar categoría | Sí |
| DELETE | `/:id` | Eliminar categoría | Sí |

### Productos de Inventario (`/api/inventory-products`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar productos | Sí |
| GET | `/:id` | Obtener producto | Sí |
| POST | `/` | Crear producto | Sí |
| PUT | `/:id` | Actualizar producto | Sí |
| DELETE | `/:id` | Eliminar producto | Sí |
| GET | `/preview-code` | Previsualizar código | Sí |

### Ventas (`/api/sales`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar ventas | Sí |
| GET | `/:id` | Obtener venta | Sí |
| POST | `/` | Crear venta | Sí |
| POST | `/:id/payment` | Registrar pago | Sí |

### Devoluciones (`/api/sale-returns`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar devoluciones | Sí |
| POST | `/` | Crear devolución | Sí |

### Facturas (`/api/invoices`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar facturas | Sí |
| GET | `/:id` | Obtener factura | Sí |
| POST | `/` | Crear factura | Sí |
| POST | `/:id/validate` | Validar factura | Sí |
| POST | `/:id/send-dian` | Enviar a DIAN | Sí |
| GET | `/:id/pdf` | Descargar PDF | Sí |

### Analytics (`/api/analytics`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Métricas del dashboard | Sí |
| GET | `/sales` | Análisis de ventas | Sí |
| GET | `/products` | Productos más vendidos | Sí |

### Configuración

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/payment-methods` | Métodos de pago | Sí |
| GET | `/api/discounts` | Descuentos | Sí |
| GET | `/api/tax-config` | Configuración de impuestos | Sí |
| GET | `/api/cities` | Ciudades colombianas | No |

### Soporte (`/api/support`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/send` | Enviar ticket | Sí |

### Recuperación de Contraseña (`/api/password-reset`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/request` | Solicitar reset | No |
| POST | `/verify` | Verificar token | No |
| POST | `/reset` | Cambiar contraseña | No |

---

## 🗄️ Modelos de Base de Datos

### User
```javascript
{
  user_id: UUID (PK),
  name: STRING,
  surname: STRING,
  document: STRING (UNIQUE),
  email: STRING (UNIQUE),
  password: STRING (hashed),
  role: ENUM('admin', 'employee'),
  is_active: BOOLEAN,
  created_at: DATE,
  updated_at: DATE
}
```

### Client
```javascript
{
  client_id: INTEGER (PK),
  name: STRING,
  surname: STRING,
  document: STRING (UNIQUE),
  phone: STRING,
  email: STRING,
  address: STRING,
  city_id: INTEGER (FK),
  created_at: DATE,
  updated_at: DATE
}
```

### Category
```javascript
{
  category_id: INTEGER (PK),
  name: STRING (UNIQUE),
  description: TEXT,
  prefix: STRING (UNIQUE),
  created_at: DATE,
  updated_at: DATE
}
```

### InventoryProduct
```javascript
{
  product_id: INTEGER (PK),
  code: STRING (UNIQUE),
  name: STRING,
  description: TEXT,
  category_id: INTEGER (FK),
  price: DECIMAL,
  cost: DECIMAL,
  stock: INTEGER,
  min_stock: INTEGER,
  is_active: BOOLEAN,
  created_at: DATE,
  updated_at: DATE
}
```

### Sale
```javascript
{
  cod_sale: INTEGER (PK),
  client_id: INTEGER (FK),
  user_id: UUID (FK),
  sale_type: ENUM('CONTADO', 'APARTADO'),
  payment_status: ENUM('PENDIENTE', 'PAGADO', 'PARCIAL'),
  total_amount: DECIMAL,
  paid_amount: DECIMAL,
  remaining_amount: DECIMAL,
  invoice_type: ENUM('NORMAL', 'ELECTRONICA_DIAN'),
  invoice_id: INTEGER (FK),
  created_at: DATE,
  updated_at: DATE
}
```

### Invoice
```javascript
{
  invoice_id: INTEGER (PK),
  invoice_number: STRING (UNIQUE),
  customer_id: INTEGER (FK),
  issue_date: DATE,
  due_date: DATE,
  subtotal: DECIMAL,
  tax_amount: DECIMAL,
  total_amount: DECIMAL,
  status: ENUM('draft', 'sent', 'paid'),
  dian_status: ENUM('pending', 'sent', 'accepted', 'rejected'),
  cufe: STRING,
  qr_code: TEXT,
  xml_content: TEXT,
  pdf_path: STRING,
  created_at: DATE,
  updated_at: DATE
}
```

Para ver todos los modelos y sus relaciones, consulta `src/models/index.js`.

---

## 🔧 Servicios

### DIAN Service (`dianService.js`)
- Envío de facturas a DIAN
- Consulta de estado
- Generación de CUFE
- Integración con Test Set

### DIAN Validator (`dianValidator.js`)
- Validación local de facturas
- 10 categorías de validación
- Prevención de rechazos

### PDF Generator (`pdfGenerator.js`)
- Generación de PDFs de facturas
- Diseño profesional
- Código QR integrado
- Información fiscal completa

### Email Service (`emailService.js`)
- Envío de emails transaccionales
- Recuperación de contraseña
- Notificaciones de ventas
- Soporte técnico

### Invoice XML Builder (`invoiceXmlBuilder.js`)
- Construcción de XML para DIAN
- Cumplimiento de estándares
- Validación de estructura

### Signature Service (`signatureService.js`)
- Firma digital de XML
- Certificados digitales
- Validación de firmas

### QR Generator (`qrGenerator.js`)
- Generación de códigos QR
- Información de factura
- Validación DIAN

---

## 📜 Scripts Útiles

### Importar Ciudades Colombianas

```bash
node src/scripts/seedCities.js
```

Importa todas las ciudades y municipios de Colombia a la base de datos.

### Crear Usuario Administrador

```bash
node src/scripts/createAdmin.js
```

### Limpiar Base de Datos

```bash
node src/scripts/cleanDatabase.js
```

---

## 🔐 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para autenticación.

### Flujo de Autenticación

1. **Login**: `POST /api/auth/login`
   ```json
   {
     "email": "usuario@ejemplo.com",
     "password": "contraseña"
   }
   ```

2. **Respuesta**:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "user_id": "uuid",
       "name": "Nombre",
       "email": "email@ejemplo.com",
       "role": "admin"
     }
   }
   ```

3. **Uso del Token**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar con cobertura
npm run test:coverage
```

---

## 📝 Notas de Desarrollo

### Sincronización de Modelos

En desarrollo, los modelos se sincronizan automáticamente con `{ alter: true }`. En producción, usa migraciones.

### CORS

El CORS está configurado para permitir solicitudes desde `http://localhost:5173`. Actualiza en `src/app.js` para producción.

### Logging

Los logs de Sequelize están desactivados. Actívalos en `src/config/db.js` para debugging.

---

## 🚨 Troubleshooting

### Error de Conexión a Base de Datos

```bash
❌ Error al iniciar servidor: SequelizeConnectionError
```

**Solución**: Verifica que PostgreSQL esté corriendo y que `DATABASE_URL` sea correcta.

### Error de JWT

```bash
❌ JsonWebTokenError: invalid signature
```

**Solución**: Verifica que `JWT_SECRET` sea la misma en todas las instancias.

### Error de Email

```bash
❌ Error sending email: Invalid login
```

**Solución**: Usa una contraseña de aplicación de Gmail, no tu contraseña normal.

---

## 📚 Recursos Adicionales

- [Documentación de Sequelize](https://sequelize.org/)
- [Documentación de Express](https://expressjs.com/)
- [Documentación DIAN](https://www.dian.gov.co/)
- [JWT.io](https://jwt.io/)

---

**Desarrollado con ❤️ para GasMonkey**
