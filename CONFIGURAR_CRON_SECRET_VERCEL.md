# 🔐 Configurar CRON_SECRET en Vercel

## 📋 Instrucciones Paso a Paso

### **Paso 1: Acceder a Vercel Dashboard**

1. Ve a: **https://vercel.com/dashboard**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **`gibravotravel`**

---

### **Paso 2: Agregar Variable de Entorno**

1. En el dashboard del proyecto, click en **"Settings"** (Configuración)
2. En el menú lateral izquierdo, click en **"Environment Variables"**
3. Verás un formulario para agregar variables

---

### **Paso 3: Configurar CRON_SECRET**

Completa el formulario:

```
Key:    CRON_SECRET
Value:  a96655e9ec5db18f88660b263a54157bc16571d1ab2eac0e3c4a7cf7f1338f31
```

**Important**: En el dropdown "Environments", selecciona:
- ✅ **Production**
- ✅ **Preview** (opcional, para testing)
- ❌ No marques "Development" (solo si quieres que aplique en local)

---

### **Paso 4: Guardar**

1. Click en **"Save"** (Guardar)
2. Vercel te preguntará si quieres redeployar
3. Click en **"Yes, redeploy"** para aplicar los cambios inmediatamente

---

### **Paso 5: Verificar**

Después del redeploy, el cron job estará activo. Puedes verificar:

1. Ve a: **Settings** → **Cron Jobs**
2. Verás el cron job: `0 1 * * *` → `/api/cron/notificaciones`
3. Espera a que se ejecute (diariamente a las 1:00 AM UTC) o prueba manualmente

---

## 🧪 Probar Manualmente

### Opción 1: Desde local
```bash
node scripts/test-cron-notificaciones.js
```

### Opción 2: Desde terminal/curl
```bash
curl -X POST https://systems.gibravo.it/api/cron/notificaciones \
  -H "Authorization: Bearer a96655e9ec5db18f88660b263a54157bc16571d1ab2eac0e3c4a7cf7f1338f31"
```

### Opción 3: Desde Vercel Dashboard
1. Ve a: **Settings** → **Cron Jobs**
2. Click en **"Run Now"** junto al cron job

---

## ✅ Verificación Final

Después de configurar, verifica:

1. ✅ Variable `CRON_SECRET` existe en Production
2. ✅ Cron job aparece en **Settings** → **Cron Jobs**
3. ✅ Estado del cron job es "Active"
4. ✅ El cron se ejecuta diariamente a las **1:00 AM UTC** (2:00 AM hora europea)

---

## 📊 Próxima Ejecución

El cron se ejecutará automáticamente:
- **Primera ejecución**: Mañana a las 1:00 AM UTC
- **Siguientes**: Todos los días a la misma hora

---

## 🎯 Cómo Funciona

```
Cron Job (01:00 AM UTC)
    ↓
POST /api/cron/notificaciones
    ↓
Headers: Authorization: Bearer {CRON_SECRET}
    ↓
Verifica el secret ← Tu código lo valida
    ↓
Busca agendas con recordatorios activos
    ↓
Calcula: fechaAgenda - diasAntes
    ↓
¿Hoy es la fecha? → SÍ → Crea notificación
    ↓
Usuario ve badge rojo en el ícono 🔔
```

---

## 📝 Notas Importantes

- ⚠️ **NO compartas el `CRON_SECRET`** públicamente
- ✅ El cron solo funciona en **producción** en Vercel
- ✅ Para local/desarrollo, usa: `node scripts/test-cron-notificaciones.js`
- ✅ Las notificaciones son para **Agendas Personales** solamente
- ✅ Las notificaciones se actualizan cada 30 segundos en el frontend

---

## 🆘 Troubleshooting

### El cron no se ejecuta
1. Verifica que `CRON_SECRET` existe en Production
2. Verifica que el cron job está "Active" en Settings
3. Revisa los logs del deployment en Vercel

### Notificaciones duplicadas
- El sistema tiene protección automática
- Verifica que solo hay UN cron job configurado

### Probar manualmente no funciona
- Verifica el secret en el header Authorization
- Revisa que la URL es correcta: `https://systems.gibravo.it/api/cron/notificaciones`
- Revisa logs del servidor en Vercel

---

**✨ Una vez configurado, el sistema de notificaciones funcionará automáticamente todos los días a las 1:00 AM UTC**

