# Presus. - Finance Dashboard

Una aplicación web moderna para gestión financiera personal con sincronización automática desde Gmail.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js) ![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38bdf8?logo=tailwind-css)

## 📋 Índice

- [🎯 Estado Actual](#-estado-actual)
- [🚀 Prioridades Estratégicas](#-prioridades-estratégicas)
- [✨ Funcionalidades](#-funcionalidades)
- [🏗️ Stack Técnico](#️-stack-técnico)
- [🔧 Desarrollo](#-desarrollo)
- [📊 Roadmap](#-roadmap)

## 🎯 Estado Actual

**Presus** está en MVP completo y funcionalmente listo. La aplicación permite:

- ✅ **Autenticación Google OAuth** con gestión de sesiones
- ✅ **Sincronización automática** de transacciones desde Gmail (Santander, Naranja X, Mercado Libre)
- ✅ **Gestión completa de presupuestos** (CRUD con backend)
- ✅ **Categorización de transacciones** con optimistic updates
- ✅ **Navegación temporal** por meses y años
- ✅ **UI/UX responsive** con sistema de diseño consistente
- ✅ **PWA ready** con manifest y metadatos completos

### ✅ Completado Recientemente (Agosto 2025)

- **🔧 Estabilidad crítica**: Resuelto crash "Maximum update depth exceeded" en DateSelector
- **🎨 UX mejorada**: Rediseñado flujo de descripciones con input siempre visible
- **⚡ Notificaciones**: Implementado sistema de toasts con Sonner
- **🧹 Code quality**: Eliminado código legacy y debug logs (60+ console.log removidos)

## 🚀 Prioridades Estratégicas

### 🥇 **PRIORIDAD 1: Lanzamiento Público (Google Console)**

> **🎯 OBJETIVO**: Preparar la app para que cualquiera pueda acceder de forma segura

**🔒 Security Audit Completo**
- Revisión manual exhaustiva de frontend y backend
- Identificar y eliminar vulnerabilidades (XSS, SQL injection, data exposure)
- Implementar rate limiting robusto y protección DDoS
- Verificar compliance con políticas de Google OAuth para apps públicas
- GDPR/Privacy compliance para datos financieros

**📋 Checklist Pre-Launch**
- [ ] Frontend security review (client-side secrets, XSS vulnerabilities)
- [ ] Backend security review (SQL injection, token handling, validations)
- [ ] Google OAuth verification para apps públicas
- [ ] Rate limiting implementation
- [ ] Privacy policy implementation
- [ ] Production environment hardening

### 🥈 **PRIORIDAD 2: Features Originales (User-Driven)**

> **🎯 OBJETIVO**: Funcionalidades que realmente mejoren la vida de usuarios reales

**🔬 User Research Phase**
- Hablar con 10-15 potenciales usuarios reales
- Identificar pain points genuinos en gestión financiera
- Descubrir features que nadie más tiene
- Validar assumptions sobre uso de la app

**💡 Potential Original Features** (basado en feedback real)
- Smart categorization con ML personalizado
- Alertas predictivas de gastos
- Integración con múltiples bancos argentinos
- Análisis de patrones de gasto únicos
- Features específicas para Argentina (inflación, etc.)

### 🥉 **PRIORIDAD 3: Features Estándar (AI-Suggested)**

> **🎯 OBJETIVO**: Funcionalidades que toda app financiera debería tener

**📊 Analytics y Visualización**
- Gráficos de gastos por categoría
- Reportes mensuales automáticos
- Trends y análisis temporal
- Exportación de datos (CSV/PDF)

**⚙️ Quality of Life**
- Tema oscuro/claro
- Notificaciones push
- Búsqueda avanzada de transacciones
- Validación de formularios robusta
- Offline support

## ✨ Funcionalidades

### 🏠 **Dashboard Principal**
- Resumen de presupuestos con progreso visual
- Tarjeta de total presupuestario
- Navegación por fechas (mes/año)
- Estados de loading elegantes

### 💰 **Gestión de Presupuestos**
- CRUD completo con backend
- Cálculo automático de gastos
- Indicadores visuales (colores semafóricos)
- Sincronización en tiempo real

### 💳 **Transacciones**
- Importación automática desde Gmail
- Creación manual de transacciones
- Categorización con drag & drop
- Edición inline de descripciones
- Filtrado por categoría y método de pago

### 🎨 **UI/UX**
- Diseño responsive mobile-first
- Sistema de toasts para feedback
- Componentes accesibles (Radix UI)
- PWA con instalación nativa

## 🏗️ Stack Técnico

### **Frontend**
- **Next.js 15** - App Router, Turbopack
- **React 19** - Latest features y hooks
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible components
- **Zustand** - State management

### **Backend Integration**
- **NextAuth.js** - OAuth con Google
- **API Routes** - Server-side logic
- **Gmail API** - Transaction extraction
- **PostgreSQL** - Database (via backend service)

### **Tools & Libraries**
- **Sonner** - Toast notifications
- **date-fns** - Date manipulation
- **Lucide React** - Icon system
- **ESLint + TypeScript** - Code quality

## 🔧 Desarrollo

### **Instalación**
```bash
git clone [repository-url]
cd finance-dashboard
npm install
npm run dev
```

### **Scripts**
```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run start    # Production server
npm run lint     # Code linting
```

### **Environment Variables**
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## 📊 Roadmap

### 🚨 **CRÍTICO - Pre-Launch**
- **PFIN-017**: Security Audit Completo
- **PFIN-018**: Google OAuth Compliance Review
- **PFIN-019**: GDPR/Privacy Implementation
- **PFIN-020**: Rate Limiting & DDoS Protection
- **PFIN-021**: User Research & UX Validation

### 🎯 **Post-Launch Features** (basado en user feedback)
- **PFIN-022**: Smart Analytics Dashboard
- **PFIN-023**: Multi-Bank Integration
- **PFIN-024**: Predictive Alerts
- **PFIN-025**: Argentina-specific Features

### 🔧 **Technical Improvements**
- **PFIN-201**: Caching Layer (Redis)
- **PFIN-202**: Structured Logging
- **PFIN-203**: Health Checks
- **PFIN-204**: Database Migrations
- **PFIN-205**: Audit Logging

---

**🎯 Próximo milestone**: Preparación para lanzamiento público en Google Console

*Desarrollado con ❤️ para mejorar la gestión financiera personal*