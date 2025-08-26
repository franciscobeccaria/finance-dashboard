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

**Presus** está en MVP completo con sistema integral de gastos. La aplicación tiene **objetivos duales**:

### 🥇 **PRIORIDAD 1: Uso Personal Septiembre 2025**
> Manejar gastos reales de septiembre 2025 usando Presus con localStorage como storage principal

### 🥈 **PRIORIDAD 2: Lanzamiento Público** 
> Preparar para lanzamiento público (postponed hasta después del uso personal exitoso)

**La aplicación actualmente permite:**

- ✅ **Autenticación Google OAuth** con gestión de sesiones
- ✅ **Sincronización automática** de transacciones desde Gmail (Santander, Naranja X, Mercado Libre)
- ✅ **Gestión completa de presupuestos** (CRUD con backend)
- ✅ **Sistema de medios de pago personalizado** con API backend y gestión visual
- ✅ **Categorización de transacciones** con optimistic updates
- ✅ **Navegación temporal** por meses y años
- ✅ **UI/UX responsive** con sistema de diseño consistente
- ✅ **PWA ready** con manifest y metadatos completos
- ✅ **Sistema completo de Gastos V3** con drag & drop y secciones organizadas
- ✅ **Previsión V2 integrada** con vista horizontal mes-a-mes estilo Excel

### ✅ Completado Recientemente (Agosto 2025)

- **💳 Payment Methods System**: Sistema completo de medios de pago personalizados con API backend
- **🎨 Analytics Dashboard**: Panel de análisis por medio de pago con eliminación optimista
- **⚡ Parallel Data Loading**: Carga paralela de presupuestos y medios de pago para mejor performance
- **🔧 Type Safety**: Mejoras de TypeScript y eliminación de código no utilizado
- **🎨 UX mejorada**: Rediseñado flujo de descripciones con input siempre visible
- **⚡ Notificaciones**: Implementado sistema de toasts con Sonner
- **💰 Sistema de Gastos V3**: Gestión completa con drag & drop y secciones organizadas
- **📊 Previsión V2**: Vista horizontal mes-a-mes estilo Excel integrada
- **🏗️ Arquitectura MonthlyInstance**: Granularidad total por mes/gasto para control máximo
- **🔄 Reorganización de rutas**: V3 como principal, V1 como backup histórico
- **🧹 Código legacy eliminado**: Limpieza completa de duplicaciones y archivos V2

### 🔄 En Planificación (Sprint 3-4)

- **OR-004: Carga de Transacciones vía Imágenes** - Decisiones técnicas tomadas para revolucionar entrada de datos
- **Stack seleccionado**: OpenAI Vision API (gpt-4o-mini con detail:"low") como solución MVP
- **Enfoque específico**: Screenshots de apps bancarias argentinas + parsing de PDFs de resúmenes
- **Costos reales**: $0.0003-$0.0006 por imagen, $0.002-$0.005 por PDF (~centavos por usuario/mes)
- **Capacidad**: Múltiples transacciones por imagen con processing backend distribuido
- **Viabilidad**: Costos de pocos centavos por usuario/mes hacen viable la escala del proyecto

### ✅ Checkpoint Agosto 2025 - Sistema de Gastos Completo

Siguiendo el **Francisco-First approach**, completamos el sistema core de gestión de gastos:

**🎯 Lo que se logró:**
- ✅ **Gastos V3**: Sistema completo reemplazando experimentos V2 con arquitectura sólida
- ✅ **Previsión V2**: Integración perfecta con vista mensual estilo Excel
- ✅ **Arquitectura limpia**: Eliminación total de código legacy y duplicaciones V2
- ✅ **UX mejorada**: Drag & drop, formularios intuitivos, tooltips informativos
- ✅ **Reorganización de rutas**: /gastos → V3, /prevision → V2 como principales

**🔧 Decisiones técnicas clave:**
- **Migración @dnd-kit**: Reemplazo de react-beautiful-dnd para compatibilidad React 19
- **Sistema MonthlyExpenseInstance**: Máxima granularidad mes-a-mes por gasto individual  
- **Tabla unificada**: Una sola tabla con secciones simples (no collapsible como error inicial)
- **Agrupación parent_expense_id**: Previsiones muestran un gasto por fila, meses en columnas
- **localStorage como storage principal**: Gastos locales, backend para presupuestos/transacciones

**📈 Resultado Francisco-First:**
El sistema ahora está listo para **uso personal real en septiembre 2025**, priorizando funcionalidad sobre features avanzadas. Base sólida para futuras iteraciones.

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
- Creación manual con selección de medio de pago
- Categorización con drag & drop
- Display inteligente de nombres de medios de pago
- Edición inline de descripciones
- Filtrado por categoría y método de pago

### 💰 **Medios de Pago**
- Creación y gestión de medios de pago personalizados
- Selector de colores con 18 opciones predefinidas
- Panel de análisis con estadísticas por medio de pago
- Eliminación optimista con rollback automático
- Integración automática con transacciones importadas
- Caché de colores para consistencia visual

### 💰 **Gastos y Previsión**
- **Sistema completo V3** con secciones organizadas: CUOTAS, GASTOS FIJOS, PRESUPUESTOS
- **Drag & drop** para reordenamiento dentro de secciones (@dnd-kit)
- **Previsión V2** con vista Excel-like: una fila por gasto, columnas por mes
- **Formularios mejorados** estilo V1 con prefill options para cuotas comunes
- **Tooltips informativos** para observaciones de pago y detalles adicionales
- **UX diferenciada**: checkbox para cuotas, dialog para gastos variables
- **Arquitectura granular**: BaseExpense → MonthlyExpenseInstance para control mensual
- **Proyección inteligente**: agrupación por parent_expense_id en vista de previsiones
- **Navegación temporal** con control de períodos y meses visibles

### 🎨 **UI/UX**
- Diseño responsive mobile-first
- Sistema de toasts para feedback
- Componentes accesibles (Radix UI)
- PWA con instalación nativa

## 🏗️ Stack Técnico

### **Frontend**
- **Next.js 15** - App Router, Turbopack
- **React 19** - Latest features y hooks
- **TypeScript 5** - Type safety con interfaces estrictas
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible components
- **Zustand** - State management
- **Custom Color System** - 18 colores predefinidos con caché
- **@dnd-kit** - Drag & drop (React 19 compatible)
- **MonthlyExpenseInstance System** - Granularidad mensual total
- **ForecastV2 System** - Agrupación por parent_expense_id

### **Backend Integration**
- **NextAuth.js** - OAuth con Google
- **API Routes** - Server-side logic
- **Gmail API** - Transaction extraction
- **PostgreSQL** - Database (via backend service)
- **Payment Methods API** - CRUD operations con validación
- **Optimistic Updates** - UI instantánea con rollback automático

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

## 🚀 Roadmap y Prioridades

### 🥇 **PRIORIDAD 1: Uso Personal Septiembre 2025**

> **🎯 OBJETIVO**: Usar Presus para manejar gastos reales de septiembre 2025 con localStorage

**SEP-001**: **Testing en Producción Real**  
Usar el sistema completo Gastos V3 + Previsión V2 para gastos personales, identificar pain points y mejoras necesarias durante el uso real.

**SEP-002**: **Integración Backend Híbrida**  
Mantener gastos en localStorage pero conectar más funciones con backend existente (presupuestos + transacciones ya funcionan).

**SEP-003**: **Refinamiento UX Post-Uso**  
Iterar sobre la UX basado en experiencia real: formularios, drag & drop, tooltips, navegación temporal.

### 🥈 **PRIORIDAD 2: Lanzamiento Público (Postponed)**

> **🎯 OBJETIVO**: Preparar la app para lanzamiento público (después del uso personal exitoso)

- **PL-001**: **Frontend Security Review**  
  Revisión manual exhaustiva de frontend para identificar vulnerabilidades XSS, client-side secrets expuestos y validaciones faltantes.

- **PL-002**: **Backend Security Audit**  
  Auditoría completa de backend: SQL injection, token handling, validaciones de entrada y protección de datos financieros.

- **PL-003**: **Google OAuth Compliance**  
  Verificar compliance con políticas de Google OAuth para apps públicas, incluyendo scopes necesarios y verification process.

- **PL-004**: **Rate Limiting & DDoS Protection**  
  Implementar rate limiting robusto en todas las APIs y protecciones contra ataques DDoS.

- **PL-005**: **GDPR/Privacy Implementation**  
  Implementar privacy policy, manejo de datos financieros sensibles y compliance GDPR.

- **PL-006**: **Production Environment Hardening**  
  Configurar ambiente de producción seguro con secrets management, monitoring y logging apropiado.

### 🥈 **PRIORIDAD 2: Features Originales (User-Driven)**

> **🎯 OBJETIVO**: Funcionalidades que realmente mejoren la vida de usuarios reales

#### **🔬 User Research Phase**
- Hablar con 10-15 potenciales usuarios reales
- Identificar pain points genuinos en gestión financiera
- Descubrir features que nadie más tiene
- Validar assumptions sobre uso de la app
- Research de competencia (análisis de apps similares, features diferenciadoras, pricing models)

#### **⚡ Mejoras & Fixes Rápidos**

- **OR-001**: **Toggle de Descripciones en Transacciones**  
  Agregar botón "+" para mostrar/ocultar input de descripción sin romper el flujo actual de edición inline.

- **OR-002**: **Mejora de Layout de Modales**  
  Revisar y estandarizar el diseño de todos los modales para consistencia visual y mejor UX across all views.

- **OR-003**: **Evaluación de Settings**  
  Revisar la sección Settings actual y evaluar si ocultarla temporalmente hasta definir funcionalidades específicas.

- **OR-004**: **Carga de Transacciones vía Imágenes**  
  Implementar funcionalidad para agregar transacciones manuales usando capturas de pantalla y PDFs, con IA para extraer datos.
  
  **OpenAI API – Costos de Procesamiento:**
  - **Imágenes** (capturas de apps financieras): gpt-4o-mini con detail:"low" ~$0.0003–$0.0006 por imagen
  - **200 imágenes/mes por usuario**: ~$0.06–$0.12 USD  
  - **PDFs** (resúmenes de tarjeta): parsing completo ~$0.002–$0.005 por PDF
  - **20 PDFs/mes por usuario**: ~$0.05–$0.10 USD
  - **👉 Costo mensual por usuario**: pocos centavos de dólar, viable para escala del proyecto

- **OR-005**: **WhatsApp Bot para Transacciones**  
  Crear bot de WhatsApp que permita agregar transacciones enviando mensajes, integrando con la API existente.

- **OR-006**: **Fix Filtro Transacciones Belo**  
  Investigar y corregir el filtro de Gmail que no está capturando todas las transacciones de Belo correctamente.

- **OR-007**: **Validación de Fechas Futuras**  
  Agregar validación en el input de fecha para crear transacciones, impidiendo selección de fechas futuras.

- **OR-008**: **Analytics de Usuarios**  
  Implementar sistema para trackear logins, usage metrics y identificar usuarios activos para mejorar product-market fit.

- **OR-009**: **Sistema de Testing**  
  Implementar testing completo (unitario y E2E) usando Jest/React Testing Library y Playwright para garantizar estabilidad con desarrollo IA.

- **OR-010**: **Flujo de Onboarding de Usuario**  
  Crear una secuencia de bienvenida para nuevos usuarios que los guíe en la configuración inicial (crear su primer presupuesto, conectar su primer servicio de correo, etc.).

- **OR-011**: **Flujo de Revisión de Transacciones**  
  Implementar una "bandeja de entrada" o un centro de revisión donde las transacciones importadas automáticamente esperen la aprobación y categorización final del usuario antes de impactar los presupuestos.

- **OR-012**: **Login con Outlook y Apple + Sincronización**  
  Login con Outlook y Apple + Sincronización de Transacciones desde Outlook y Apple. Como hacemos con gmail con filtros, api y parsers.

- **OR-013**: **Login Passwordless (Modo Manual)**  
  Permitir a los usuarios registrarse solo con su email (sin conectar Google/Outlook/Apple) a través de un sistema de "magic links". Esto habilita un modo 100% manual de la aplicación.

- **OR-014**: **Integración APIs Bancarias Argentinas**  
  Conectar directamente con APIs de Mercado Pago, Brubank y Belo para importación automática de transacciones, eliminando dependencia del parsing de Gmail y proporcionando datos más precisos y en tiempo real.

- **OR-015**: **Vista por Cierre de Tarjeta de Crédito**  
  Implementar funcionalidad para filtrar presupuestos y transacciones por períodos de facturación de tarjetas de crédito en lugar del mes calendario tradicional.
  
  **Componentes:**
  - **Enhancement Payment Methods**: Agregar tipo "tarjeta de crédito" y configuración de día de cierre (1-31)
  - **Dashboard Enhancement**: Switch/toggle cerca del selector de mes para alternar entre "Mes Calendario" vs "Período Resumen"
  - **Filtrado Inteligente**: Transacciones agrupadas por período de facturación real con cálculo automático de rangos según cierres
  - **Automatización Futura**: Integración con OR-101 (PDFs parsing) para auto-detección de períodos y validación de transacciones
  
  **Valor**: Permite vista real de gastos por tarjeta según ciclo de facturación, crítico para manejo financiero argentino donde los cierres no coinciden con meses calendario.

#### **📱 Nuevas Páginas Completas**

- **OR-101**: **Unión de Resúmenes PDF**  
  Sistema para cargar PDFs de diferentes tarjetas de crédito y generar tabla unificada con todas las transacciones parsed.

- **OR-102**: **Vista de Cuotas**  
  Página similar a vista Excel "Cuentas" para seguimiento de cuotas: cuánto por mes, cuándo terminan, notificaciones tipo "este mes se terminan estas cuotas".

- **OR-103**: **Dashboard Presupuesto Global**  
  Vista completa estilo Excel con cuotas, gastos fijos, presupuestos, débitos automáticos, ingresos/egresos con histórico y comparación real vs. previsto.

  > Vista global del presupuesto mensual y prevision. Usar mi vista de excel pero con la UI de la app. Quizás no algo tan parecido, pero si una pagina donde se mostraran cuotas, gastos fijos, presupuestos, débitos automáticos, etc. Algo muy similar a mi vista. Donde también se mostrara ingresos y egresos. El problema de mi vista de excel por ejemplo es que es difícil ver el historial, porque oculto la columna, ademas es una prevision, muchos de los gastos quizás se preveen como que van a ser 1000 y terminan siendo 1100 porque aumento el debito automatico, me gustaría ver eso de mejor forma. Pero al final, se puede ver y ordenar todo manera muy similar: presupuestos, cuotas, gastos fijos, débitos automáticos, vista por tarjetas. Al final todo son entities (objetos) unir la data y mostrarla de forma ordenada y que al usuario le sirva. Agregarle opciones que yo ya hago en excel, como ya pague esta cuota, ya pague esto, ya pague lo otro, agrego una nota aca. Este gasto fijo esta previsto en 1000 y termino siendo 1100, mis gastos fijos previstos eran 115000 y fueron 120000, que fallo? Aumentos, superamos presupuestos, etc.

- **OR-104**: **Vista de Caja (Cash Flow)**  
  Página dedicada para manejo de cash flow con proyecciones, entradas/salidas programadas y balance proyectado.

- **OR-105**: **Historial de Servicios**  
  Sistema para almacenar PDFs de servicios, ver histórico y agregar funcionalidad de pago directo estilo Brubank.

#### **🤖 Recomendadas por IA**

- **AI-001**: **Smart Categorization con ML**  
  Implementar ML personalizado para categorización automática de transacciones basado en patrones de usuario.
  
  **Categorización Inteligente en la Revisión**: Mejorar el "Flujo de Revisión de Transacciones" (OR-011). Cuando un usuario categoriza manualmente una transacción de un comercio nuevo (ej. "Rappi" -> "Delivery"), la app podría preguntar: "¿Quieres que todas las futuras transacciones de 'Rappi' se categoricen como 'Delivery'?" y crear una regla automáticamente.

- **AI-002**: **Alertas Predictivas de Gastos**  
  Sistema de alertas inteligentes que predice sobregiros de presupuesto basado en patrones históricos.

- **AI-003**: **Integración Multi-Bancos Argentinos**  
  Conectores para múltiples bancos argentinos (Galicia, Macro, BBVA) para importación directa de transacciones.

- **AI-004**: **Análisis de Patrones Únicos**  
  Dashboard de insights personalizados que identifica patrones de gasto específicos del usuario.

- **AI-005**: **Features Argentina-Específicas**  
  Herramientas específicas para Argentina: tracking inflación, análisis de poder adquisitivo, comparación con índices económicos.

- **AI-006**: **Soporte Multi-Moneda**  
  Habilitar el manejo de diferentes monedas (ARS, USD, etc.). El sistema debería poder registrar el monto en su moneda original y mostrar los totales en la moneda de preferencia del usuario, usando un tipo de cambio configurable.

### 🥉 **PRIORIDAD 3: Features Estándar (AI-Suggested)**

> **🎯 OBJETIVO**: Funcionalidades que toda app financiera debería tener

#### **📊 Analytics y Visualización**

- **ST-001**: **Gráficos de Gastos por Categoría**  
  Implementar charts interactivos (pie, bar, line) para visualizar distribución de gastos por presupuestos.

- **ST-002**: **Reportes Mensuales Automáticos**  
  Sistema de generación automática de reportes mensuales con resumen de gastos, savings y comparación vs. mes anterior.

- **ST-003**: **Análisis de Trends Temporal**  
  Vista de análisis temporal con trends de gastos, identificación de patrones estacionales y proyecciones.

- **ST-004**: **Exportación de Datos**  
  Funcionalidad para exportar datos en formatos CSV y PDF con opciones de filtrado por fecha y categoría.

#### **⚙️ Quality of Life**

- **ST-005**: **Tema Oscuro/Claro**  
  Implementar toggle de tema con persistencia de preferencia y detección automática de sistema.

- **ST-006**: **Notificaciones Push**  
  Sistema de notificaciones web para alertas de presupuesto, recordatorios y nuevas transacciones importadas.

- **ST-007**: **Búsqueda Avanzada**  
  Implementar búsqueda global con filtros por monto, fecha, categoría, descripción y múltiples criterios.

- **ST-008**: **Offline Support**  
  Implementar service worker para funcionalidad básica offline con sincronización cuando vuelve la conexión.

### **📈 Funcionalidades Futuras (Post-Septiembre 2025)**

#### **Vista de Cuotas (Nice-to-have)**
> **Evaluación**: Útil para algunos usuarios que quieren seguimiento detallado, pero **no crítico** para funcionalidad core

- **Dashboard especializado** para visualizar cuotas restantes y próximas a vencer
- **Indicadores de finalizaciones** por mes con timeline visual
- **Conexión bidireccional** con páginas Gastos y Previsión principales  
- **Contador intuitivo** similar a Gastos V1 pero completamente integrado
- **Target users**: Usuarios con muchas compras en cuotas que necesitan seguimiento granular

**⏳ Timing**: Solo después del éxito del uso personal de septiembre 2025 y validación de que realmente agrega valor.

## 📅 Roadmap de Desarrollo Detallado (Postponed para Lanzamiento Público)

> ⚠️ **NOTA**: Este roadmap detallado está **postponed** hasta completar el uso personal exitoso en septiembre 2025

### **🎯 Versión 0.5 → 0.75: Estabilización y Features Clave Pre-Lanzamiento**

#### **Sprint 1 (Semana del 18 de Agosto): Mejoras Rápidas y Calidad de Vida (~10h)**
> **Objetivo**: Pulir y estabilizar la versión actual

- **[S, ~2h] OR-006**: Fix Filtro Transacciones Belo - Aumenta la confianza en la data
- **[S, ~2h] OR-007**: Validación de Fechas Futuras - Mejora de calidad de datos simple
- **[S, ~3h] OR-001**: Toggle de Descripciones en Transacciones - Mejora de UX en la tabla
- **[S, ~3h] OR-002**: Mejora de Layout de Modales - Estandariza la consistencia visual

#### **Sprint 2 (Semana del 25 de Agosto): Testing y Analytics (~10h)**
> **Objetivo**: Preparar la base para un lanzamiento robusto y medible

- **[M, ~7h] OR-009**: Sistema de Testing - Implementar Jest/React Testing Library y Playwright para estabilidad
- **[S, ~3h] OR-008**: Analytics de Usuarios - Integrar herramienta simple (Vercel Analytics) para trackear uso

**✅ HITO (Principios de Septiembre)**: La aplicación es estable, testeable y medible

---

### **🚀 Versión 0.75 → 1.0: Revolución de Entrada de Datos y Lanzamiento**
> **Objetivo**: Implementar features más innovadoras y preparar para lanzamiento público

#### **Sprint 3-4 (2 Semanas, 1-14 Sep): Carga por Imagen y Hub de Importación (~20h)**
- **[L, ~20h] OR-004**: Carga de Transacciones vía Imágenes  
  Implementar flujo completo: subir capturas → OCR + IA → transacciones. Crear "Hub de Importación" donde usuario elija método (Gmail, Imagen, etc.)

#### **Sprint 5 (Semana del 15 Sep): Login Passwordless (~10h)**
- **[M, ~10h] OR-013**: Login Passwordless (Modo Manual)  
  Registro/login con "magic links" para habilitar modo 100% manual de la aplicación

#### **Sprint 6-7 (2 Semanas, 22 Sep - 5 Oct): Preparación y Lanzamiento Público (~20h)**
- **[L, ~20h] PL-001 a PL-006**: Hardening y Cumplimiento para Producción  
  Security Audit, Rate Limiting, Privacy Policy, configuración producción y verificación Google

**✅ HITO (Principios de Octubre)**: La aplicación está online, es segura y abierta al público

---

### **📈 Versión 1.0 → 1.25: Expansión de Fuentes de Datos**

#### **Sprint 8-9 (2 Semanas, 6-19 Oct): Unión de Resúmenes PDF (~20h)**
- **[L, ~20h] OR-101**: Unión de Resúmenes PDF  
  Sistema para cargar resúmenes de tarjeta en PDF y extraer transacciones automáticamente

---

### **💡 Versión 1.25 → 1.5: Profundidad Funcional**

#### **Sprint 10-11 (2 Semanas, 20 Oct - 2 Nov): Vista de Cuotas (~20h)**
- **[L, ~20h] OR-102**: Vista de Cuotas  
  Página dedicada para seguimiento detallado de compras en cuotas con timeline y notificaciones

**✅ HITO (Principios de Noviembre)**: La app tiene múltiples formas de entrada de datos y visión profunda de deudas

---

### **🤔 Decisión Estratégica Post-v1.5: Próximo Enfoque**

Una vez alcanzada la v1.5, se plantean dos caminos estratégicos:

**🅰️ Opción A: Profundizar el Valor (Analytics y Visualización)**  
Construir grandes páginas de análisis: Dashboard Presupuesto Global (OR-103), Gráficos (ST-001). Más poder para usuarios existentes.

**🅱️ Opción B: Ampliar el Alcance (Nuevos Usuarios y Canales)**  
Facilitar entrada a nuevos segmentos: Login Outlook/Apple (OR-012), Bot WhatsApp (OR-005). Captar más usuarios.

---

## 🎯 Enfoque Estratégico Francisco-First

Para maximizar el valor personal antes de escalar a otros usuarios, se propone el siguiente enfoque priorizado:

### **🏗️ Foundation: Entity "Gasto"**
La piedra angular del sistema debe ser la **Entity "Gasto"** que unifique:
- **Cuotas**: Compras en cuotas con seguimiento temporal
- **Débitos automáticos**: Servicios, suscripciones, gastos fijos  
- **Gastos fijos**: Alquiler, expensas, gastos predecibles mensuales

### **📊 Flujo de Desarrollo Estratégico**
1. **Construir Entity "Gasto"** con todas sus variantes y lógica de negocio
2. **Implementar páginas core**:
   - OR-102: Vista de Cuotas (timeline y seguimiento)
   - OR-103: Dashboard Presupuesto Global (Excel-like con histórico)
   - OR-104: Vista de Caja (cash flow y proyecciones)

### **🚀 Features Secundarias (Post-Core)**
Una vez completado el core, las siguientes features son **facilidades para otros usuarios**:
- OR-004: Carga de imágenes con IA
- OR-101: Parsing de PDFs 
- OR-005: WhatsApp bot
- OR-014: APIs bancarias múltiples

### **💡 Filosofía de Producto**
**Personal-first approach**: Resolver completamente el problema de Francisco antes de pensar en mass-market. Esto garantiza un producto con real product-market fit para el usuario objetivo inicial.

---

**🎯 Próximo milestone**: Sprint 1 - Estabilización (Semana del 18 de Agosto)

*Desarrollado con ❤️ para mejorar la gestión financiera personal*