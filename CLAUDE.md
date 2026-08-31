# Sistema de Gestión Escolar (SaaS Multi-Colegio)

Plataforma SaaS donde 1 a N colegios se registran de forma autoservicio y gestionan tesorería (matrículas, pensiones, boletas/facturas). Módulos futuros: académico, intranet.

**Stack:** Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, RLS) + Tailwind CSS.

---

## 1. Cómo aplicar la base de datos

El SQL ya está escrito en `supabase/schema/` y `supabase/seed/`, numerado en orden de dependencia (correr en ese orden exacto):

```
supabase/schema/00_extensions_and_enums.sql
supabase/schema/01_shared_functions.sql
supabase/schema/10_platform.sql
supabase/schema/11_platform_rls.sql
supabase/schema/20_academic_core.sql
supabase/schema/21_academic_core_rls.sql
supabase/schema/30_identity.sql
supabase/schema/31_identity_rls.sql
supabase/schema/40_tesoreria.sql
supabase/schema/41_tesoreria_rls.sql
supabase/schema/50_talonario.sql
supabase/schema/51_talonario_rls.sql

supabase/seed/01_plans.sql          -- siempre (son los 3 planes reales)
supabase/seed/02_demo_school.sql    -- solo en desarrollo local
```

Pasos:
1. Inicializar el proyecto Supabase (`supabase init`) si no existe `supabase/config.toml`.
2. Copiar cada archivo de `schema/` como una migración (`supabase migration new <nombre>` y pegar el contenido, o `supabase db push` apuntando directo a estos archivos en orden).
3. Correr `supabase/seed/01_plans.sql` en todo ambiente. Correr `02_demo_school.sql` solo en local.
4. Generar tipos TypeScript: `supabase gen types typescript --local > lib/supabase/database.types.ts`.

**Nunca** escribas SQL nuevo que contradiga las reglas de la sección 2 sin antes revisar si ya existe una tabla/función para eso.

---

## 2. Reglas de arquitectura (no negociables)

Estas reglas se decidieron deliberadamente durante el diseño. Si algo parece "más simple" violándolas, es una señal de que falta contexto, no una mejora real.

1. **Multi-tenancy por fila, no por base de datos.** Toda tabla de dominio tiene `school_id`. El aislamiento entre colegios lo garantiza RLS (`has_school_access()`, `has_school_role()`, `is_platform_staff()`), nunca un `WHERE` que el código de la app pueda olvidar escribir.

2. **Ningún estado calculable se guarda como verdad fija.** `invoices.paid_amount` y `invoices.status` **nunca** se escriben directamente desde la aplicación — los mantiene el trigger `recalc_invoice_status()` en base a `payment_document_items`. Si necesitas "marcar una boleta como pagada", inserta un `payment_document_item`, no hagas `UPDATE invoices SET status = 'pagado'`.

3. **Relaciones reales son muchos-a-muchos con atributos propios, no jerarquías forzadas.** `student_guardians` conecta alumnos y apoderados con banderas (`is_billing_responsible`, `lives_with`) — nunca fuerces a un apoderado a pertenecer a un solo "grupo familiar" rígido.

4. **Identidad de usuario es polimórfica vía `memberships`.** Una fila de `memberships` tiene `role` + exactamente una de (`student_id`, `guardian_id`, `staff_id`) según el rol — hace cumplir esto el CHECK `chk_membership_target`. Nunca agregues un `user_id` directo en `students`/`guardians`/`staff_members`; todo login pasa por `memberships`.

5. **Un solo dueño por colegio.** `memberships.is_owner = true` es único por `school_id` (índice parcial `one_owner_per_school`). El owner es intocable por otros admins — solo se transfiere explícitamente, nunca se elimina directo.

6. **Enum vs. tabla catálogo:** usa `enum` de Postgres para valores estables que casi nunca cambian (`student_status`, `invoice_status`). Usa una tabla editable (`document_types`, `payment_origins`) cuando el colegio necesita agregar/editar valores sin una migración.

7. **Borrado siempre lógico en `schools`.** Nunca `DELETE FROM schools`. El botón "eliminar colegio" hace `UPDATE schools SET deleted_at = now()`. Los datos de un colegio (boletas, pagos) tienen valor legal/tributario y no se destruyen.

8. **Login por email o username, ambos resueltos a un solo `auth.users`.** Si el usuario escribe algo sin `@`, resuélvelo primero con `resolve_login_email(username)` antes de llamar `supabase.auth.signInWithPassword`. Nunca crear un sistema de contraseñas propio — Supabase Auth (`auth.users`) es la única fuente de verdad de credenciales.

9. **`user_profiles.contact_email` ≠ `auth.users.email`.** El segundo puede ser sintético (alumnos sin correo real). Los flujos de verificación por correo (`auth_challenges`, dispositivos de confianza) solo funcionan si existe `contact_email`.

10. **Todo cambio de estructura es un archivo nuevo numerado**, nunca un `ALTER TABLE` suelto fuera de `supabase/schema/`. Sigue la convención de huecos (`10`, `20`, `30`...) para insertar módulos futuros (`60_academico.sql`, `70_intranet.sql`) sin renumerar nada existente.

---

## 3. Roles y permisos (resumen)

| Rol | Tabla de identidad | Alcance |
|---|---|---|
| `platform_staff.role = superadmin` | — | Todo, en todos los colegios. Puede suspender/eliminar colegios. |
| `platform_staff.role = support` | — | Ve colegios y datos de plataforma, no elimina ni cambia suscripciones. |
| `memberships.role = admin` | `staff_members` | Todo dentro de su colegio. Uno de ellos tiene `is_owner = true`. |
| `memberships.role = administrativo` | `staff_members` | Gestión operativa del colegio (tesorería, matrículas), sin privilegios de owner. |
| `memberships.role = docente` | `staff_members` | Lectura de alumnos; en el futuro módulo académico, acceso limitado a sus propios cursos (requerirá una tabla `course_teachers` — no construir permisos "de todo el colegio" para docentes). |
| `memberships.role = padre` | `guardians` | Solo los alumnos donde aparece en `student_guardians`. |
| `memberships.role = alumno` | `students` | Solo su propio registro. |

---

## 4. Sistema de diseño — replicar el de Supabase (dashboard.supabase.com)

**No uses ningún otro sistema de referencia.** El objetivo es que la interfaz se sienta como el dashboard real de Supabase: denso, sin decoración innecesaria, con el verde de marca usado con moderación — pero con **modo claro como default**, no oscuro.

### Modo claro / oscuro

- **El tema inicial sigue la preferencia del sistema operativo/navegador** (`prefers-color-scheme`): si el usuario tiene su SO en oscuro, la app abre en oscuro; si está en claro, abre en claro.
- **Si el sistema no puede determinarse** (navegador sin soporte para `prefers-color-scheme`, o el valor viene como `no-preference`), el fallback es **modo claro**.
- Botón de cambio de tema en la **esquina superior derecha del layout principal** (junto al selector de colegio / avatar de usuario), con ícono sol/luna, para que el usuario pueda anular la detección automática en cualquier momento.
- Implementar con `next-themes`: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>`. Este es el comportamiento nativo de la librería: detecta `prefers-color-scheme` automáticamente, y si no logra resolverlo, cae en claro por defecto — no hace falta lógica adicional para el fallback.
- Una vez el usuario toca el botón manualmente, esa elección se guarda (localStorage vía `next-themes`) y tiene prioridad sobre la preferencia del sistema en visitas futuras.

### Colores — modo claro (default)

```css
--background-base: #ffffff;
--surface-card: #ffffff;
--surface-elevated: #fafafa;
--border-subtle: #dfdfdf;
--border-prominent: #cfcfcf;
--border-brand: rgba(36, 180, 126, 0.35);

--brand-green: #3ecf8e;          /* CTAs, fondos de botón — buen contraste en claro */
--brand-green-text: #24b47e;     /* texto/íconos en verde sobre fondo blanco — más contraste que #3ecf8e */
--brand-green-dark: #00c573;     /* hover */

--text-primary: #171717;
--text-secondary: #525252;
--text-muted: #8a8a8a;
```

### Colores — modo oscuro (toggle)

```css
--background-base: #0f0f0f;
--surface-card: #171717;
--surface-elevated: #242424;
--border-subtle: #2e2e2e;
--border-prominent: #393939;
--border-brand: rgba(62, 207, 142, 0.3);

--brand-green: #3ecf8e;
--brand-green-text: #3ecf8e;
--brand-green-dark: #00c573;

--text-primary: #fafafa;
--text-secondary: #b4b4b4;
--text-muted: #898989;
```

Define ambos bloques como variables CSS bajo `:root` (claro) y `.dark` (oscuro) en `globals.css` — es el patrón estándar de shadcn/ui + `next-themes`, no inventar un mecanismo de theming propio.

### Tipografía

- Fuente principal: **Inter** (sustituto libre de "Circular", la fuente propietaria real de Supabase — no está disponible para uso comercial fuera de ellos).
- Fuente monoespaciada (IDs, UUIDs, montos, códigos de documento): fuente mono del sistema (`ui-monospace`, o "JetBrains Mono" si se agrega una).
- Pesos: 400 para casi todo el texto; 500 solo en botones y navegación.

### Principios de layout

- **Sin sombras.** La profundidad se comunica con contraste de bordes (`border-subtle` → `border-prominent`), nunca con `box-shadow`.
- **Radios de borde:** 6–8px en botones, inputs, badges. 12–16px en tarjetas y paneles grandes.
- **Espaciado en grid de 8px** (8, 16, 24, 32, 48, 96px) — no uses valores arbitrarios como `13px` o `22px`.
- **Sidebar de navegación** fijo a la izquierda, íconos + texto, fondo `surface-card`, ítem activo con borde izquierdo verde o fondo `surface-elevated`.
- **Tablas de datos:** filas separadas por `border-subtle` (no zebra-striping fuerte), texto de encabezado en `text-muted`, mayúsculas pequeñas.
- **Badges de estado**, mapeados así:
  - `pendiente` → ámbar/amarillo
  - `parcial` → azul
  - `pagado` → verde de marca
  - `vencido` → rojo
  - `anulado` → gris (`text-muted`)
- **Formularios:** inputs con fondo `surface-elevated`, borde `border-subtle`, foco con `border-brand`.
- **Botón primario:** fondo `brand-green`, texto negro (no blanco — así lo hace Supabase). Botón secundario: transparente con borde `border-subtle`.

### Componentes

Usa **shadcn/ui** como base (ya disponible en este entorno), retemizado con las variables de arriba en `globals.css` — no los estilos default de shadcn. No importar ninguna librería de UI adicional sin necesidad real.

### Formato de moneda

Todos los montos en soles: `Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })` → `S/ 1,234.56`.

---

## 5. Mapa completo de pantallas (qué tabla necesita qué tipo de interfaz)

No todas las tablas necesitan una pantalla propia. Esta tabla dice, para cada una, qué construir:

| Tabla | Tipo de interfaz | Dónde vive |
|---|---|---|
| `students` | **CRUD completo** (lista + panel crear/editar) | Mantenimiento de Alumnos |
| `student_guardians` | Sub-pestaña — agregar/quitar apoderados de un alumno | Dentro de Mantenimiento de Alumnos |
| `academic_years`, `previous_schools` | Sub-pestaña de solo datos (poco uso por ahora) | Dentro de Mantenimiento de Alumnos → "Otros datos" |
| `guardians` | **CRUD completo**, independiente de alumnos | Mantenimiento de Apoderados |
| `staff_members` | **CRUD completo** (filtra por `staff_type`) | Mantenimiento de Personal |
| `memberships` + `membership_invites` | **CRUD completo** — invitar por email/rol, editar rol, desactivar, transferir `is_owner` | Miembros del Colegio (solo `admin`) |
| `tuition_schedule` | **CRUD completo** — precios por año/mes/concepto | Configuración → Lista de Precios |
| `invoices` | **No se crean a mano campo por campo.** Se generan con una acción "Generar cobros del año" (matrícula + pensiones según `tuition_schedule`). Sí son editables individualmente para aplicar `discount_amount`, `mora_amount`, `prorroga_date` | Cobros Pendientes / Estado de Cobros |
| `document_types`, `document_series` | **CRUD completo** | Configuración → Talonario |
| `payment_origins` | **CRUD completo** | Configuración → Orígenes de Pago |
| `payment_documents` + `payment_document_items` | Se crean **solo** vía el flujo de Registrar Pago (nunca INSERT libre) | Registrar Pago |
| `schools` | **CRUD completo** + borrado lógico | Dashboard de Plataforma (`platform_staff`) |
| `plans`, `payment_gateway_accounts` | **CRUD completo** | Dashboard de Plataforma |
| `subscriptions` | Ver + cambiar plan/estado (no se "crea" suelta, nace con el colegio) | Dashboard de Plataforma → detalle de colegio |
| `billing_invoices` | Solo lectura + botón "marcar como pagado" (activación manual) | Dashboard de Plataforma → detalle de colegio |
| `platform_staff` | **CRUD completo** | Dashboard de Plataforma → Equipo |
| `audit_logs` | Solo lectura, sin CRUD | Dashboard de Plataforma → Auditoría |
| `mfa_factors`, `auth_challenges`, `trusted_devices` | El propio usuario las ve/gestiona (revocar dispositivo, activar OTP) | Mi Cuenta → Seguridad |
| `user_profiles` | El propio usuario edita lo suyo | Mi Cuenta |

## 6. Orden de construcción sugerido

**Fase 1 — flujo de tesorería de punta a punta (lo más urgente, es el único módulo que existe hoy):**
1. Login (email o username + contraseña, con selector de colegio si hay >1 membership)
2. Mantenimiento de Alumnos (con sub-pestaña de apoderados vinculados)
3. Mantenimiento de Apoderados
4. Configuración → Lista de Precios (`tuition_schedule`)
5. Configuración → Talonario y Orígenes de Pago
6. Acción "Generar cobros del año" para un alumno
7. Cobros Pendientes / Estado de Cobros
8. Registrar Pago (las 3 pestañas ya diseñadas)

**Fase 2 — administración:**
9. Mantenimiento de Personal
10. Miembros del Colegio (invitaciones, roles, `is_owner`)
11. Mi Cuenta → Seguridad

**Fase 3 — plataforma (para ti, como operador del SaaS):**
12. Dashboard de Plataforma completo (colegios, planes, suscripciones, billing, auditoría, equipo)

No construyas pantallas de módulos académico/intranet todavía — esas tablas no existen aún.
