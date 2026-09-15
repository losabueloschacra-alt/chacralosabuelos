# Los Abuelos Chacra — reservas

Sistema de reservas para **Los Abuelos Chacra**, construido con Next.js 14 y preparado para GitHub + Vercel. Mantiene el diseño boutique campestre del proyecto original y utiliza Google Sheets mediante Google Apps Script como backend de disponibilidad y reservas.

## Qué incluye

- Página pública responsive, priorizada para celular.
- Logo incluido en `public/logo.png`.
- Calendario Diciembre 2026, Enero 2027 y Febrero 2027.
- Estados públicos: disponible, pendiente, reservado y fechas bloqueadas.
- Fechas especiales configurables en `lib/config.ts`.
- Detección automática de **Fin de semana** cuando el rango es exactamente viernes → domingo.
- **Semana** automática para los demás rangos de estadía.
- **Evento** como modalidad manual y masiva, sin límite de 8 personas.
- Cálculo centralizado de tarifas y seña del 50%.
- Revisión de disponibilidad otra vez en el servidor antes de guardar.
- Bloqueo por concurrencia con `LockService` en Google Apps Script.
- Pantalla final de pago con alias y botón para copiarlo.
- WhatsApp con mensaje prearmado y datos de la reserva.
- Panel `/admin` protegido por cookie HttpOnly y `ADMIN_SECRET`.
- Confirmar, liberar y cancelar reservas.
- Bloqueo manual de rangos por uso personal, mantenimiento u otro motivo.
- `.env.example` sin secretos reales.

## Tarifas actuales

Todas están centralizadas en `lib/config.ts` y duplicadas en la configuración del Apps Script para que el servidor pueda recalcular el importe y evitar manipulación desde el navegador.

- Fin de semana viernes + sábado + domingo: **$280.000**.
- Semana: **$100.000 por día**, mínimo 2 días.
- Evento: **$200.000 por día**, modalidad masiva.
- Navidad (24/12/2026 y 25/12/2026): **$350.000** por grupo especial tocado por la estadía.
- Año Nuevo (31/12/2026 y 01/01/2027): **$400.000** por grupo especial tocado por la estadía.
- Seña: **50%**.
- Capacidad de estadía: **8 personas**.
- Alias: **evelynmaroli**.
- WhatsApp: **5491160115583**.

> Si una estadía toca una fecha especial, el grupo especial se cobra una sola vez y las demás fechas del rango que no pertenezcan a ese grupo se calculan con la tarifa normal. La lógica está centralizada y puede modificarse fácilmente.

## 1. Instalar y ejecutar localmente

Requisitos: Node.js 18.17+ recomendado.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí `http://localhost:3000`.

Para producción local:

```bash
npm run build
npm start
```

## 2. Configurar Google Sheets

1. Creá una Google Sheet, por ejemplo `Los Abuelos Chacra - Reservas`.
2. Abrí **Extensiones → Apps Script**.
3. Pegá el contenido de `google-apps-script/Code.gs`.
4. Guardá el proyecto.
5. Ejecutá `setup()` una vez y aceptá los permisos.
6. Se crearán las hojas `Reservas` y `Bloqueos` con sus encabezados.
7. Elegí **Implementar → Nueva implementación → Aplicación web**.
8. Ejecutá como tu cuenta.
9. Para que Vercel pueda consultar el backend, seleccioná acceso para usuarios que tengan el enlace / acceso público que permita tu configuración de Apps Script.
10. Copiá la URL que termina en `/exec`.
11. Esa URL va en `GOOGLE_SCRIPT_URL`.

### Importante sobre la hoja

No hace falta cargar reservas iniciales. El proyecto está preparado para que, si la hoja está vacía, todas las fechas aparezcan disponibles (excepto bloqueos manuales que agregues desde administración).

## 3. Variables de entorno

Copiá `.env.example` a `.env.local` para desarrollo o cargá las variables directamente en Vercel.

- `GOOGLE_SCRIPT_URL`: URL `/exec` del Web App de Apps Script.
- `ADMIN_SECRET`: clave larga y aleatoria para el administrador.
- `NEXT_PUBLIC_INSTAGRAM_URL`: opcional.

El WhatsApp y el alias principales están centralizados en `lib/config.ts`. Si querés exponer enlaces públicos adicionales, podés agregarlos como variables `NEXT_PUBLIC_*`.

**Nunca subas `.env`, `.env.local` ni credenciales de Google a GitHub.**

## 4. GitHub

```bash
git init
git add .
git commit -m "Sistema de reservas Los Abuelos Chacra"
git branch -M main
git remote add origin TU_REPOSITORIO
 git push -u origin main
```

Reemplazá `TU_REPOSITORIO` por el repositorio real.

## 5. Vercel

1. Entrá a Vercel.
2. Importá el repositorio de GitHub.
3. Detectará Next.js automáticamente.
4. En **Settings → Environment Variables**, agregá `GOOGLE_SCRIPT_URL` y `ADMIN_SECRET`.
5. Agregá `NEXT_PUBLIC_INSTAGRAM_URL` si querés mostrar Instagram.
6. Hacé el deploy.
7. Probá primero una reserva de prueba.
8. Entrá a `https://TU-DOMINIO.vercel.app/admin` y verificá el acceso administrativo.

## 6. Flujo de reserva

1. El cliente consulta disponibilidad.
2. Selecciona ingreso y egreso.
3. El sistema determina automáticamente Fin de semana o Semana cuando corresponde.
4. El cliente puede activar manualmente Evento.
5. Se validan datos y capacidad.
6. El servidor vuelve a consultar disponibilidad y Google Apps Script toma un lock antes de insertar.
7. La reserva se guarda como `PENDIENTE`.
8. Las fechas pendientes quedan bloqueadas para nuevas solicitudes.
9. Se muestra el resumen y el 50% de seña.
10. Se muestra el alias `evelynmaroli` y el botón **COPIAR ALIAS**.
11. El cliente puede abrir WhatsApp con un mensaje prearmado y adjuntar el comprobante.
12. Desde `/admin`, la reserva puede pasar a `CONFIRMADA`, `LIBERADA` o `CANCELADA`.

## 7. Administración

Entrá a `/admin` e ingresá `ADMIN_SECRET`.

El panel permite:

- Ver reservas y todos sus datos operativos.
- Confirmar una reserva pendiente.
- Liberar una reserva pendiente o confirmada.
- Cancelar una reserva confirmada.
- Bloquear manualmente un rango.
- Liberar un bloqueo manual.

La pantalla pública no expone nombre, teléfono, email ni observaciones de las reservas: solo recibe la información mínima necesaria para mostrar disponibilidad.

## 8. Cambiar tarifas, fechas, alias o WhatsApp

Para la interfaz Next.js, editar `lib/config.ts`:

- `PRICING.weekend`
- `PRICING.weekday`
- `PRICING.eventPerDay`
- `PRICING.depositPercent`
- `PRICING.maxPeople`
- `PRICING.special`
- `ALIAS`
- `WHATSAPP`

También actualizá los valores equivalentes en `google-apps-script/Code.gs`, porque Apps Script recalcula el total en servidor antes de guardar.

Después de modificar `Code.gs`, volvé a desplegar la implementación de Apps Script si Google solicita una nueva versión.

## 9. Fechas especiales

Actualmente:

- 24/12/2026 — Navidad.
- 25/12/2026 — Navidad.
- 31/12/2026 — Año Nuevo.
- 01/01/2027 — Año Nuevo.

Son **seleccionables** mientras estén disponibles. El rojo significa **“Fecha especial — tarifa diferencial”**, no reserva.

Si posteriormente una fecha especial queda dentro de una reserva activa, se mostrará como bloqueada por reserva.

## 10. Archivo `index.html`

`index.html` es una versión independiente de visualización. No reemplaza la aplicación Next.js ni tiene conexión con Google Sheets. Sirve para abrir la estética de la web directamente desde un archivo, enviar una captura, revisar el diseño o hacer una demo visual.

La versión funcional para producción es la aplicación Next.js.

## 11. Verificación antes de producción

Se debe probar como mínimo:

- calendario de los tres meses;
- navegación entre meses;
- selección de rango;
- cruce entre meses;
- viernes → domingo = fin de semana;
- otros rangos = semana;
- evento sin límite de 8 personas;
- fechas especiales;
- Navidad $350.000;
- Año Nuevo $400.000;
- seña automática del 50%;
- copia del alias;
- WhatsApp;
- creación pendiente;
- concurrencia / doble reserva;
- confirmación;
- liberación;
- cancelación;
- bloqueo manual;
- responsive móvil.

## Nota de seguridad

El frontend no contiene `ADMIN_SECRET`, credenciales de Google ni API keys. El administrador se autentica en `/api/admin`, que genera una sesión mediante cookie HttpOnly. Las operaciones sensibles pasan por Vercel y Apps Script valida nuevamente disponibilidad y concurrencia.
