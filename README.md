# Finance Dashboard - Mis Finanzas

Una aplicación web moderna para el control y seguimiento de finanzas personales, construida con Next.js 15, React 19 y Tailwind CSS.

![Finance Dashboard](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38bdf8?logo=tailwind-css)

## 📋 Descripción

**Finance Dashboard** es una aplicación de gestión financiera personal que permite a los usuarios:

- ✅ **Gestionar presupuestos por categoría**: Crear, editar y eliminar presupuestos personalizados según necesidades.
- ✅ **Añadir transacciones**: Registrar gastos con información detallada incluyendo comercio, monto, fecha, hora y categoría.
- ✅ **Categorización manual**: Asignar categorías a transacciones importadas desde fuentes externas.
- ✅ **Visualizar progreso de presupuestos**: Ver en tiempo real el porcentaje gastado de cada presupuesto con indicadores visuales.
- ✅ **Presupuesto total destacado**: Visualizar el estado general de todos los presupuestos combinados.
- ✅ **Historial de transacciones**: Consultar todas las transacciones registradas con filtrado por categoría.
- ✅ **Integración API**: Obtención de transacciones reales desde API de correo electrónico.
- ✅ **Interfaz responsive**: Diseño adaptable para dispositivos móviles, tabletas y escritorio.

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico Principal

- **Next.js 15.4.6** - Framework React con App Router y Turbopack
- **React 19.1.0** - Biblioteca de UI con los últimos hooks y características
- **TypeScript 5** - Tipado estático para mejor desarrollo y mantenimiento
- **Tailwind CSS 4** - Framework CSS utility-first para estilos rápidos y consistentes

### Bibliotecas de UI y Componentes

- **Radix UI** - Componentes accesibles y sin estilos:
  - `@radix-ui/react-dialog` - Modales y diálogos
  - `@radix-ui/react-progress` - Barras de progreso
  - `@radix-ui/react-select` - Selectores dropdown
  - `@radix-ui/react-slot` - Composición de componentes
  - `@radix-ui/react-label` - Etiquetas de formulario accesibles
- **Lucide React** - Iconografía SVG moderna y consistente
- **React Day Picker** - Selector de fechas avanzado
- **date-fns** - Manipulación y formato de fechas

### Herramientas de Desarrollo

- **class-variance-authority (CVA)** - Variantes de clases CSS tipadas
- **clsx** - Construcción condicional de clases CSS
- **tailwind-merge** - Merge inteligente de clases Tailwind
- **ESLint** - Linting de código con configuración Next.js
- **PostCSS** - Procesamiento de CSS

## 📁 Estructura del Proyecto

```
finance-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Estilos globales con Tailwind
│   │   ├── layout.tsx          # Layout principal de la aplicación
│   │   ├── page.tsx            # Página principal (Dashboard)
│   │   └── favicon.ico         # Favicon de la aplicación
│   ├── components/             # Componentes React reutilizables
│   │   ├── ui/                 # Componentes base de UI
│   │   │   ├── button.tsx      # Componente Button con variantes
│   │   │   ├── calendar.tsx    # Componente Calendar personalizado
│   │   │   ├── card.tsx        # Componentes Card (Card, CardHeader, etc.)
│   │   │   ├── dialog.tsx      # Componentes Modal/Dialog
│   │   │   ├── input.tsx       # Componente Input estilizado
│   │   │   ├── progress.tsx    # Barra de progreso personalizada
│   │   │   ├── select.tsx      # Componente Select con opciones
│   │   │   └── table.tsx       # Componentes de tabla (Table, TableRow, etc.)
│   │   ├── AddTransactionDialog.tsx    # Modal para añadir transacciones
│   │   ├── BudgetCard.tsx              # Tarjeta de presupuesto individual
│   │   ├── EditBudgetDialog.tsx        # Modal para crear/editar/eliminar presupuestos
│   │   ├── Header.tsx                  # Cabecera principal de la app
│   │   ├── TotalBudgetCard.tsx         # Tarjeta de resumen total de presupuestos
│   │   └── ViewTransactionsDialog.tsx  # Modal para ver y categorizar transacciones
│   └── lib/
│       └── utils.ts            # Utilidades compartidas (clsx + tailwind-merge)
├── public/                     # Archivos estáticos
├── components.json             # Configuración de shadcn/ui
├── package.json                # Dependencias y scripts del proyecto
├── tsconfig.json              # Configuración de TypeScript
├── tailwind.config.js         # Configuración de Tailwind CSS
├── postcss.config.mjs         # Configuración de PostCSS
├── eslint.config.mjs          # Configuración de ESLint
└── next.config.ts             # Configuración de Next.js

## 📱 Servicios y API

```
finance-dashboard/
├── src/
│   ├── services/                # Servicios para comunicación con backend
│   │   └── api.ts              # Cliente para endpoints de API y funciones auxiliares
```

### API de Transacciones

La aplicación se integra con un backend que proporciona datos de transacciones reales a través del endpoint `/gmail/extract`. Este endpoint extrae información de correos electrónicos relacionados con compras y pagos utilizando criterios de búsqueda avanzados:

- **Fuentes de correo**: "Informes Naranja X", "Aviso Santander", "Belo", "Mercado Libre"
- **Asuntos relevantes**: "Ingresó una compra", "Pagaste", "Aviso de operación", etc.
- **Rango de fechas**: Configurable para filtrar por período específico
```

## 🧩 Componentes y Funcionalidades

### 1. **Página Principal (Dashboard)** - `src/app/page.tsx`

La página principal es el corazón de la aplicación y contiene:

- **Estado de la aplicación**: Manejo de estado con React hooks (useState, useEffect, useMemo)
- **Integración API**: Llamadas asíncronas al backend para obtener transacciones reales
- **Gestión de presupuestos**: Sistema para crear, editar y eliminar presupuestos personalizados
- **Categorización de transacciones**: Funcionalidad para asignar categorías manualmente
- **Layout responsivo**: Grid adaptativo que muestra 1-4 columnas según el tamaño de pantalla
- **Estados de carga**: Indicadores visuales durante la carga de datos y manejo de errores
- **Integración de componentes**: Orchestación de múltiples componentes y diálogos

**Presupuestos predefinidos**:
- 8 categorías base: Supermercado, Restaurantes, Transporte, Entretenimiento, Servicios, Salud, Ropa, Otros

### 2. **Gestión de Presupuestos** - `src/components/EditBudgetDialog.tsx`

Componente de diálogo para la gestión completa de presupuestos:

- **Crear nuevos presupuestos**: Interfaz para añadir presupuestos personalizados
- **Editar presupuestos existentes**: Modificar nombre y monto total de presupuestos
- **Eliminar presupuestos**: Opción para eliminar presupuestos con limpieza de categorías asociadas
- **Validación de datos**: Verificación de campos obligatorios y valores numéricos
- **Estados de formulario**: Manejo de estados para diferentes modos (creación/edición)

### 3. **Categorización de Transacciones** - `src/components/ViewTransactionsDialog.tsx`

Componente mejorado para visualizar y categorizar transacciones:

- **Visualización de transacciones**: Tabla con fecha, comercio, monto y categoría
- **Filtrado por categoría**: Selector para filtrar transacciones según su categoría
- **Edición inline de categorías**: Interfaz para asignar categorías a transacciones existentes
- **Indicador visual**: Estilo distintivo para transacciones sin categorizar
- **Estados de transición**: Animaciones y estados de UI para la experiencia de categorización

### 4. **Presupuesto Total** - `src/components/TotalBudgetCard.tsx`

Componente destacado que muestra el estado general de todos los presupuestos:

- **Diseño prominente**: Estilizado con gradientes, bordes y tipografía destacada
- **Cálculo automático**: Suma de todos los montos de presupuestos y gastos
- **Indicadores visuales**: Barra de progreso con colores según nivel de utilización
- **Mensajes contextuales**: Textos informativos basados en el porcentaje de uso
- **Formato de moneda**: Visualización de importes con formato monetario adecuado

### 5. **Header Component** - `src/components/Header.tsx`

Cabecera principal de la aplicación que incluye:

- **Branding**: Título "Mis Finanzas" con styling corporativo
- **Acciones principales**:
  - Botón de configuración (Settings) - preparado para futuras funcionalidades
  - Botón "Añadir Transacción" - abre el modal de nueva transacción
- **Diseño responsive**: Se adapta a diferentes tamaños de pantalla

### 3. **BudgetCard Component** - `src/components/BudgetCard.tsx`

Tarjeta individual que muestra el estado de cada presupuesto:

**Características**:
- **Información del presupuesto**: Nombre, monto gastado, monto total
- **Indicador visual de progreso**: Barra de progreso con colores semafóricos:
  - 🟢 Verde: < 60% gastado
  - 🟡 Amarillo: 60-85% gastado  
  - 🔴 Rojo: > 85% gastado
- **Porcentaje calculado**: Muestra automáticamente el % gastado
- **Formato de moneda**: Valores monetarios formateados con 2 decimales

### 4. **AddTransactionDialog Component** - `src/components/AddTransactionDialog.tsx`

Modal completo para añadir nuevas transacciones:

**Campos del formulario**:
- **Comercio**: Campo de texto libre para el nombre del establecimiento
- **Monto**: Campo numérico con soporte para decimales
- **Presupuesto**: Selector dropdown con categorías predefinidas
- **Fecha**: Selector de calendario personalizado con react-day-picker
- **Hora**: Selector de tiempo con input HTML5 time

**Funcionalidades avanzadas**:
- **Validación de fecha**: Formato localizado con date-fns
- **Estado del calendario**: Toggle para mostrar/ocultar calendario
- **UX optimizada**: Cierre automático del calendario al seleccionar fecha
- **Acciones del modal**: Botones Cancelar y Guardar

### 5. **ViewTransactionsDialog Component** - `src/components/ViewTransactionsDialog.tsx`

Modal para visualizar el historial completo de transacciones:

**Características principales**:
- **Tabla responsive**: Diseño de tabla que se adapta al contenido
- **Filtrado por categoría**: Dropdown para filtrar transacciones por presupuesto
- **Formato de fecha**: Muestra fecha y hora de cada transacción
- **Scroll interno**: Lista scrollable cuando hay muchas transacciones
- **Estado vacío**: Mensaje informativo cuando no hay transacciones para mostrar

**Columnas de la tabla**:
- Fecha (formato dd/MM/yyyy + hora)
- Comercio
- Monto (formato monetario)
- Presupuesto (categoría)

### 6. **Componentes de UI Base** - `src/components/ui/`

Sistema de diseño basado en Radix UI con personalización Tailwind:

- **Button**: Variantes (default, outline, link) y tamaños (default, icon)
- **Card**: Contenedor con header, content y title
- **Dialog**: Modal system con header, content y footer
- **Input**: Campo de entrada estilizado
- **Progress**: Barra de progreso personalizable
- **Select**: Dropdown con trigger, content e items
- **Table**: Sistema completo de tabla con header, body, row y cell
- **Calendar**: Selector de fecha personalizado

## 🎨 Sistema de Diseño

### Paleta de Colores

La aplicación utiliza una paleta de colores coherente basada en Tailwind CSS:

- **Azul corporativo**: `blue-700`, `blue-800` - Títulos y elementos principales
- **Verde**: `green-500`, `green-700` - Estados positivos y acciones secundarias
- **Amarillo**: `amber-500` - Advertencias y estados intermedios
- **Rojo**: `red-500` - Alertas y estados críticos
- **Grises**: Gama completa para textos, fondos y bordes
- **Fondo principal**: `gray-50` - Fondo suave para toda la aplicación

### Tipografía

- **Fuente principal**: Fuente del sistema (font-sans de Tailwind)
- **Jerarquía de títulos**:
  - H1: `text-2xl font-bold` - Título principal
  - H2: `text-xl font-semibold` - Secciones
  - H3: `text-lg` - Títulos de cards
- **Textos**: Variedad de tamaños desde `text-xs` hasta `text-lg`

### Responsive Design

**Breakpoints utilizados**:
- **Mobile first**: Diseño base para móviles
- **sm: 640px**: Tablets pequeñas
- **lg: 1024px**: Tablets grandes y laptops
- **xl: 1280px**: Escritorio

**Grid responsive para presupuestos**:
```css
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

## 🔄 Flujos de Usuario

### Flujo Principal - Visualizar Dashboard

1. **Usuario accede a la aplicación**
2. **Sistema muestra la página principal** con:
   - Header con título y botones de acción
   - Grid de tarjetas de presupuesto
   - Botón para ver todas las transacciones
3. **Usuario puede ver el estado de sus presupuestos** en tiempo real

### Flujo Secundario - Añadir Transacción

1. **Usuario hace clic en "Añadir Transacción"** (Header o FAB)
2. **Sistema abre modal AddTransactionDialog**
3. **Usuario completa el formulario**:
   - Ingresa nombre del comercio
   - Especifica el monto gastado
   - Selecciona la categoría de presupuesto
   - Elige fecha (por defecto: hoy)
   - Establece hora (por defecto: 12:00)
4. **Usuario hace clic en "Guardar"**
5. **Sistema cierra el modal** (funcionalidad de guardado pendiente)

### Flujo Secundario - Ver Historial

1. **Usuario hace clic en "Ver Todas las Transacciones"**
2. **Sistema abre modal ViewTransactionsDialog** con:
   - Lista completa de transacciones
   - Filtro por categoría predeterminado en "Todas las categorías"
3. **Usuario puede filtrar por categoría específica**
4. **Sistema actualiza la tabla** mostrando solo transacciones de la categoría seleccionada
5. **Usuario puede cerrar el modal** haciendo clic fuera o en el botón cerrar

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js**: Versión 18+ recomendada
- **npm**: Incluido con Node.js (versión 9+)

### Pasos de Instalación

1. **Clonar el repositorio**:
```bash
git clone [repository-url]
cd finance-dashboard
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Ejecutar en desarrollo**:
```bash
npm run dev
```

4. **Abrir en el navegador**:
```
http://localhost:3000
```

### Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo con Turbopack
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linting con ESLint
```

## 🔧 Configuración del Proyecto

### Next.js Configuration - `next.config.ts`

El proyecto utiliza la configuración estándar de Next.js 15 con App Router habilitado.

### Tailwind CSS Configuration

Configuración personalizada que incluye:
- Integración con componentes Radix UI
- Variables CSS custom para temas
- Animaciones personalizadas con `tw-animate-css`

### TypeScript Configuration

Configuración estricta de TypeScript con:
- Target: ES2022
- Module: ESNext
- Strict mode habilitado
- Path mapping configurado para imports absolutos con `@/`

### ESLint Configuration - `eslint.config.mjs`

Configuración basada en:
- Reglas estándar de Next.js
- Soporte para TypeScript
- Configuración moderna con ES modules

## 📊 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas (MVP 1.0)

#### 🔐 **Autenticación y Sesión**
- [x] **Google OAuth** - Integración completa con NextAuth.js
- [x] **Token refresh automático** - Renovación automática de tokens (implementado)
- [x] **Gestión de sesiones** - Estados de loading y manejo de errores

#### 💰 **Gestión de Presupuestos**
- [x] **CRUD completo** - Crear, editar y eliminar presupuestos
- [x] **Integración backend** - Sincronización con API servidor
- [x] **Cálculo automático** - Gastos por presupuesto en tiempo real
- [x] **Visualización avanzada** - Cards con progreso y colores semafóricos

#### 💳 **Gestión de Transacciones**
- [x] **Creación manual** - Formulario completo para nuevas transacciones
- [x] **Eliminación selectiva** - Solo transacciones manuales
- [x] **Categorización optimizada** - Asignación con optimistic updates
- [x] **Edición de descripciones** - Modificación inline (con bug menor)
- [x] **Montos negativos** - Soporte para reembolsos con UI diferenciada
- [x] **Filtrado avanzado** - Por categoría y medio de pago
- [x] **Importación automática** - Desde Gmail API

#### 🎨 **UI/UX y Diseño**
- [x] **Responsive design** - Adaptabilidad completa a dispositivos
- [x] **Sistema de loading** - States y skeletons para mejor UX
- [x] **Branding Presus** - Identidad visual completa
- [x] **PWA ready** - Manifest y metadatos para instalación
- [x] **SEO optimizado** - Open Graph, Twitter Cards, metadatos completos

### ✅ Completado Recientemente

#### 🧹 **Limpieza de Código - Sprint de Calidad (17/Ago/2025)**

**UX Improvements:**
- **Fixed description editing flow**: Input siempre visible, botón X para eliminar, UX consistente mobile/desktop
- **Toast notifications**: Implementado Sonner component de shadcn/ui para errores elegantes

**Critical Bug Fixes:**
- **Resolved "Maximum update depth exceeded" crash**: Fixed complex circular dependency between useEffect transformation and useMemo calculations that caused infinite re-render loops during DateSelector usage
- **Stabilized React state management**: Implemented ref-based signature tracking to prevent redundant transformations while preserving initial data load

**Code Quality:**  
- **Removed legacy localStorage functions**: Eliminadas `initializeUserBudgets()`, `saveUserBudgets()` y `DEFAULT_BUDGETS`
- **Console.log cleanup**: Eliminados 60+ statements de debug, manteniendo solo console.error críticos
- **Dead code removal**: Limpiado código comentado y TODOs obsoletos
- **Alert() replacement**: Reemplazados con toast.error() para mejor UX

**Files affected:** `ViewTransactionsDialog.tsx`, `AddTransactionDialog.tsx`, `api.ts`, `page.tsx`, `layout.tsx`

---

### 🚧 Próximas Funcionalidades (Roadmap)

#### 🔥 **Alta Prioridad - Post-MVP Sprint**

- [x] **Fix description editing UX bug** ✅ COMPLETADO
  - Problema RESUELTO: Input ahora siempre visible, flujo simplificado
  - Solución: Input permanente con botón X para eliminar descripción
  - UX mejorada: Mismo comportamiento en mobile y desktop

- [x] **Implementar toast notifications para errores** ✅ COMPLETADO
  - Implementado: Sonner toast component de shadcn/ui
  - Reemplazados todos los `alert()` con `toast.error()`
  - Mejor feedback: Solo errores, no success (UX menos intrusiva)

- [ ] **Crear modal de Settings básico**
  - Descongelar botón comentado en `Header.tsx:61`
  - Settings iniciales: configuraciones de usuario, tema
  - Base para futuras personalizaciones

- [ ] **Test de token refresh en producción**
  - Ubicación: `route.ts:5-7` 
  - Verificar implementación actual con tokens expirados reales
  - Crítico para experiencia de usuario a largo plazo

#### 🟡 **Media Prioridad - Features Futuras**

- [ ] **Validación de formularios** - React Hook Form + Zod para validaciones robustas
- [ ] **Gráficos y analytics** - Visualización de datos con Chart.js o Recharts
- [ ] **Exportar datos** - Funcionalidad para exportar transacciones (CSV, PDF)
- [ ] **Tema oscuro** - Toggle para modo dark/light
- [ ] **Categorías personalizadas** - CRUD avanzado de presupuestos
- [ ] **Búsqueda avanzada** - Filtros múltiples y búsqueda por texto
- [ ] **Offline support** - Service workers para funcionalidad sin conexión
- [ ] **Push notifications** - Alertas de límites de presupuesto

### 🎨 Tareas Pendientes de Assets

#### Iconos y Recursos Visuales
- [ ] **Favicon.ico**: Reemplazar `src/app/favicon.ico` con archivo ICO real usando `public/favicon.svg` como base
- [ ] **Iconos PWA**: Convertir los siguientes SVGs a PNG con las dimensiones correctas:
  - `public/icon-192.svg` → `public/icon-192.png` (192x192px)
  - `public/icon-512.svg` → `public/icon-512.png` (512x512px)  
  - `public/apple-touch-icon.svg` → `public/apple-touch-icon.png` (180x180px)
- [ ] **Screenshots PWA**: Crear capturas de pantalla para mejorar la experiencia PWA:
  - `public/screenshot-wide.png` (1280x720px) - Vista desktop de la aplicación
  - `public/screenshot-mobile.png` (390x844px) - Vista móvil de la aplicación
- [ ] **Actualizar manifest.json**: Cambiar referencias de SVG a PNG una vez creados los archivos finales

#### Herramientas Recomendadas
- **Para conversión SVG→PNG**: Figma, Illustrator, Inkscape, o [RealFaviconGenerator](https://realfavicongenerator.net/)
- **Para favicon.ico**: [Favicon.io](https://favicon.io/) o herramientas de conversión online
- **Para screenshots**: Usar la aplicación en desarrollo y capturar pantallas reales

### 🐛 Issues Conocidos

- **Funcionalidad de guardado**: Los formularios no persisten datos (pendiente implementación)
- **Validación de formularios**: No hay validación del lado del cliente
- **Manejo de errores**: Falta manejo de errores y estados de loading

---

# 📋 Roadmap y Backlog del Proyecto

## MVP v1.0: Lanzamiento Inicial
*El objetivo de esta versión es tener la aplicación funcional, segura y desplegada en un entorno de producción para tu uso personal, mostrando únicamente los datos del mes en curso.*

### 🎯 Prioridades Críticas (Bloqueantes del Despliegue)
- [ ] **PFIN-001: Configurar Base de Datos de Producción** - Crear la instancia de PostgreSQL en la nube (ej. Supabase, Neon) y obtener las credenciales de conexión.
- [ ] **PFIN-002: Crear Política de Privacidad** - Generar una página simple con la política de privacidad de la app, necesaria para la configuración de Google Cloud.
- [ ] **PFIN-003: Configurar Pantalla de Consentimiento de Google** - Añadir el nombre de la aplicación, logo (opcional), y el enlace a la política de privacidad en la Google Cloud Console.
- [ ] **PFIN-004: Actualizar URIs de Redirección en Google Console** - Añadir la URL de callback de tu frontend ya desplegado (ej. `https://<tu-app>.vercel.app/api/auth/callback/google`) a la lista de URIs autorizados.
- [ ] **PFIN-005: Configurar Variables de Entorno de Producción** - Crear y configurar los archivos `.env.production` o la configuración de entorno en Vercel para ambos proyectos con todas las credenciales de producción (DB, Google, JWT, etc.).

### 🚀 Tareas de Despliegue
- [ ] **PFIN-006: Desplegar Backend a Producción** - Publicar la aplicación NestJS en Vercel, asegurando que las variables de entorno estén correctamente configuradas.
- [ ] **PFIN-007: Desplegar Frontend a Producción** - Publicar la aplicación Next.js en Vercel, asegurando que apunte a la URL del backend desplegado.

### ✅ Tareas de Validación Post-Lanzamiento
- [ ] **PFIN-008: Ejecutar Pruebas E2E Manuales** - Realizar un test completo del flujo en el entorno de producción: Login -> Sincronizar -> Crear/Editar Presupuesto -> Asignar Categoría.
- [ ] **PFIN-009: Monitorear Logs Iniciales** - Revisar activamente los logs de Vercel durante las primeras horas/días en busca de errores inesperados.

---

## Post-MVP v1.5: Primeras Mejoras de Valor
*Una vez que el MVP esté estable, el foco se mueve a mejorar la experiencia y la calidad de los datos.*

- [ ] **PFIN-010: Implementar Historial y Navegación de Fechas** - `[FRONTEND/BACKEND]` Permitir al usuario ver y navegar entre diferentes meses y años.
  - **Frontend:** Añadir un componente selector de mes/año en el dashboard. Modificar las llamadas a la API para que usen la fecha seleccionada en lugar de una fija.
  - **Backend:** Asegurar que los endpoints de `transactions` y `budgets` filtren eficientemente por el rango de fechas proporcionado.

- [ ] **PFIN-011: Implementar Parser de Mercado Libre** - `[BACKEND]` Añadir el parser para la fuente de datos más importante que falta, probablemente requiriendo obtener el cuerpo completo del correo.
- [ ] **PFIN-012: Implementar Gestión de Estado Global** - `[FRONTEND]` Integrar una librería como Zustand o React Context para manejar de forma más robusta el estado global.
- [ ] **PFIN-013: Implementar Validación de Formularios** - `[FRONTEND]` Añadir validación del lado del cliente a los modales (ej. con Zod + React Hook Form) para una mejor UX.
- [x] **PFIN-014: Implementar Notificaciones (Toasts)** ✅ COMPLETADO - `[FRONTEND]` Añadido feedback visual con Sonner toast component para errores.
- [ ] **PFIN-015: Implementar Rate Limiting** - `[BACKEND]` Añadir un límite de peticiones a la API para prevenir abusos y controlar costos.
- [x] **PFIN-016: Limpiar Código Legacy del Frontend** ✅ COMPLETADO - `[FRONTEND]` [CHORE] Eliminadas funciones de `localStorage` y datos hardcodeados (DEFAULT_BUDGETS).

---

## Futuro (v2.0+): Expansión de Funcionalidades
*Características más grandes que expanden significativamente las capacidades de la aplicación.*

- [ ] **PFIN-017: Implementar Gráficos y Analytics** - `[FRONTEND]` Añadir una sección de reportes con gráficos básicos (ej. gastos por categoría).
- [ ] **PFIN-018: Implementar Jobs en Segundo Plano** - `[BACKEND]` Mover la sincronización con Gmail a un proceso en segundo plano para que el usuario no tenga que esperar en la UI.
- [ ] **PFIN-019: Soporte para Más Bancos** - `[BACKEND]` Añadir parsers para otras entidades financieras (ej. BBVA, Macro).
- [ ] **PFIN-020: Limpieza Avanzada de `merchant`** - `[BACKEND]` Crear un sistema para estandarizar nombres de comercios (ej. "DLO*Rappi" y "RAPPI" deben ser "Rappi").
- [ ] **PFIN-021: Exportar Datos a CSV** - `[BACKEND/FRONTEND]` Crear un endpoint y un botón en la UI para permitir la descarga del historial de transacciones.
- [ ] **PFIN-022: Implementar Tema Oscuro (Dark Mode)** - `[FRONTEND]` Añadir la capacidad de cambiar entre tema claro y oscuro.

---

## Backlog Técnico (Tareas de Madurez)
*Mejoras continuas que no son features visibles pero aumentan la calidad y mantenibilidad del sistema.*

- [ ] **PFIN-201: Implementar Sistema de Caché** - `[BACKEND]` Añadir una capa de caché (ej. con Redis) para acelerar las respuestas de la API.
- [ ] **PFIN-202: Implementar Logging Estructurado** - `[BACKEND]` Configurar un sistema de logging más robusto para facilitar la depuración en producción.
- [ ] **PFIN-203: Añadir Health Checks** - `[BACKEND]` Crear un endpoint `/health` que verifique la conexión a la base de datos y otros servicios.
- [ ] **PFIN-204: Implementar Sistema de Migraciones Formal** - `[BACKEND]` Pasar de `auto-sync` de TypeORM a un sistema de migraciones manuales para un control total sobre el esquema de la base de datos.
- [ ] **PFIN-205: Implementar Audit Logging** - `[BACKEND]` Crear un registro de auditoría para acciones sensibles (ej. cambios en presupuestos, eliminación de transacciones).
- [ ] **PFIN-206: Mover Google App a Producción** - `[INFRAESTRUCTURA]` Pasar la aplicación en la Google Console de "Pruebas" a "Producción" para eliminar el límite de 100 usuarios y el banner de "app no verificada".

---

## 🤝 Contribución

### Convenciones de Código

- **Componentes**: PascalCase con sufijo descriptivo (ej: `AddTransactionDialog`)
- **Props interfaces**: PascalCase con sufijo `Props` (ej: `HeaderProps`)
- **Archivos**: camelCase para utilities, PascalCase para componentes
- **Estilos**: Utility-first con Tailwind CSS, evitar CSS custom
- **Imports**: Orden: React, bibliotecas externas, componentes locales, tipos

### Git Workflow

1. **Crear feature branch** desde `main`
2. **Desarrollar funcionalidad** con commits descriptivos
3. **Ejecutar linting** antes de commit: `npm run lint`
4. **Push y crear Pull Request** hacia `main`

## 📄 Licencia

Este proyecto es privado y está desarrollado para uso personal/educativo.

---

**Desarrollado con ❤️ usando Next.js, React y Tailwind CSS**

*Última actualización: Agosto 2025*
