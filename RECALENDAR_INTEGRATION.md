# ReCalendar Integration - rmfakecloud

## Resumen

Integración de ReCalendar en rmfakecloud como un provider dentro de la sección **Integrations**. Permite configurar cómo se conectan fuentes externas (Vikunja, ICS, etc.) con el calendario PDF generado por ReCalendar.

---

## Commits

| Commit | Descripción |
|--------|-------------|
| `ac24275` | fix: fix recalendar PDF generation and font loading |
| `a66e0a4` | feat: add daily page types (Agenda/Tasks/Notes) and language selector |
| `ffcb1c5` | feat: ReCalendar integration with 4-tab config, Vikunja API, CORS proxy |

---

## Cómo funciona

### Integrations → New Integration → ReCalendar

Al crear o editar una integración con provider **"ReCalendar"**, se muestra un formulario con **4 pestañas**:

### Tab 0: General
- **PDF Selection**: Lista todos los PDFs del servidor (Documents). Al seleccionar uno, se resalta en azul.
- **Page Type Detection**: Botón "Scan PDF" que detecta qué page types hay en el PDF (Agenda, Tasks, Notes). Las pestañas correspondientes se habilitan.
- **Timezone**: Selector de zona horaria (21 opciones, default: Madrid).
- **Refresh Frequency**: Cada 1h / 3h / 24h.
- **Refresh Time**: Hora del primer refresco del día (time picker, default: 06:00).

### Tab 1: Agenda (Coming Soon)
- Placeholder para integración ICS.
- Detecta integraciones ICS existentes en rmfakecloud.
- URL manual ICS (deshabilitado por ahora).

### Tab 2: Tasks (Vikunja)
- **Vikunja URL**: URL base de la instancia Vikunja.
- **API Token**: Se almacena encriptado (AES-GCM en HTTPS, plain en HTTP via crypto.subtle fallback).
- **Test Connection**: Valida URL + token contra la API de Vikunja.
- **Select Project**: Lista los proyectos disponibles tras conectar.
- **Task Preview**: Muestra las primeras 10 tareas del proyecto seleccionado (título, prioridad, fecha, estado).
- **Save Connection**: Botón full-width que guarda la config a localStorage. Badge naranja "Connected (unsaved)" → verde "Connected".

### Tab 3: Notes (Coming Soon)
- Placeholder para integraciones de notas (Obsidian, Notion, OCR, etc.).

---

## Comportamiento de tabs

1. **Al abrir nueva integración**: Agenda, Tasks, Notes arrancan **deshabilitados** (gris).
2. **Al hacer Scan PDF**: Se habilitan solo las pestañas detectadas.
3. **Al cambiar de PDF**: Los tabs vuelven a deshabilitarse hasta nuevo scan.
4. **Al reabrir integración guardada**: Los tabs se restauran según el scan previo.

---

## Persistencia

- **Config guardada en**: `localStorage` key `recalendar_config` (clave fija, no depende del ID de integración).
- **Al crear nueva integración**: Se limpia `localStorage` para empezar limpio.
- **Al editar existente**: Se carga la config guardada, se reconecta Vikunja automáticamente, se restauran tabs.

---

## CORS Proxy

El navegador bloquea requests cross-origin de rmfakecloud (HTTP) a Vikunja (HTTPS/HTTP distinto). Solución:

- **Archivo**: `cors-proxy.js` (Node.js, puerto 8899)
- **Inicio**: `setsid node cors-proxy.js` (independiente del backend)
- **Uso**: El frontend envía requests a `http://<hostname>:8899` con header `x-target-url` apuntando a Vikunja.
- **Detección**: Solo se usa proxy en contextos HTTP. En HTTPS se llama directo a Vikunja.

---

## Archivos nuevos/modify

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `cors-proxy.js` | Proxy CORS Node.js para Vikunja API |
| `ui/src/pages/Integrations/recalendar/ReCalendarForm.jsx` | Formulario principal con 4 tabs |
| `ui/src/pages/ReCalendarIntegration/index.jsx` | Página standalone (ruta /recalendar-integration) |
| `ui/src/pages/ReCalendarIntegration/tabs/GeneralTab.jsx` | Tab General standalone |
| `ui/src/pages/ReCalendarIntegration/tabs/AgendaTab.jsx` | Tab Agenda placeholder |
| `ui/src/pages/ReCalendarIntegration/tabs/TasksTab.jsx` | Tab Tasks standalone |
| `ui/src/pages/ReCalendarIntegration/tabs/NotesTab.jsx` | Tab Notes placeholder |
| `ui/src/pages/ReCalendarIntegration/utils/encrypt.js` | Encriptación de tokens (AES-GCM / fallback) |
| `ui/src/pages/ReCalendarIntegration/utils/vikunja-api.js` | Cliente API Vikunja con proxy CORS |
| `ui/src/pages/ReCalendarIntegration/utils/timezone-utils.js` | Timezones, frecuencias, config load/save |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `ui/src/App.jsx` | Import + ruta `/recalendar-integration` |
| `ui/src/components/Navigation.jsx` | Nav link "Recalendar" → `/recalendar-integration` |
| `ui/src/pages/Integrations/IntegrationModal.jsx` | Provider "recalendar" renderiza ReCalendarForm |
| `ui/src/pages/Integrations/NewIntegrationModal.jsx` | Provider "recalendar" como default, renderiza ReCalendarForm |

---

## Build

```bash
# UI
cd ui && pnpm install && pnpm build

# Go binario (necesita Go 1.24.1+)
go build -o rmfakecloud ./cmd/rmfakecloud

# Backend
PORT=3000 DATADIR=./data LOCAL_USER=user@example.com LOCAL_PASSWORD=change-me JWT_SECRET_KEY=$(openssl rand -hex 32) HOST=0.0.0.0 ./rmfakecloud

# CORS Proxy
setsid node cors-proxy.js
```

---

## Notas técnicas

- **Encriptación de tokens**: `crypto.subtle` solo funciona en HTTPS. En HTTP, el token se almacena sin encriptar (fallback explícito con `isSecureContext()` check).
- **CORS**: Vikunja no emite headers CORS. El proxy Node.js los agrega (`Access-Control-Allow-Headers: *`).
- **Go binario**: El UI está embebido en el binario (`//go:embed dist/*`). Cada cambio de UI requiere `pnpm build` + `go build`.
- **Go version**: Se requiere Go 1.24.1+. Verificar con `go version`.
