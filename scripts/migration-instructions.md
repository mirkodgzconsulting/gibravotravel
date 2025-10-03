# 📋 Instrucciones para Migrar Clientes desde WordPress

## 🎯 Objetivo
Migrar los 3,000 registros de clientes desde WordPress (archivo Excel) a la nueva base de datos PostgreSQL.

## 📁 Preparación

### 1. Estructura de archivos
```
scripts/
├── migrate-clients.js          # Script principal de migración
├── migration-instructions.md   # Este archivo
└── data/                      # Crear esta carpeta
    └── clientes-wordpress.xlsx # Tu archivo Excel aquí
```

### 2. Crear la carpeta de datos
```bash
mkdir -p scripts/data
```

### 3. Colocar tu archivo Excel
- Copia tu archivo Excel de WordPress a: `scripts/data/clientes-wordpress.xlsx`
- Asegúrate de que tenga las columnas exactas:
  - Nome
  - Cognome  
  - Codice Fiscale
  - Indirizzo
  - E-mail
  - Telefono
  - Nato a
  - Data di nascita
  - Documenti

## ⚙️ Configuración

### 1. Instalar dependencias
```bash
npm install xlsx
```

### 2. Obtener tu Clerk User ID
Necesitas el ID de tu usuario administrador para asignar como creador:

1. Ve a tu aplicación en desarrollo
2. Abre las herramientas de desarrollador (F12)
3. En la consola, ejecuta:
```javascript
// Esto te mostrará tu user ID
console.log(window.Clerk.user?.id);
```

### 3. Configurar el script
Edita `scripts/migrate-clients.js` y cambia:
```javascript
const ADMIN_USER_ID = 'tu-clerk-user-id'; // Reemplaza con tu ID real
const EXCEL_FILE_PATH = './data/clientes-wordpress.xlsx'; // Verifica la ruta
```

## 🚀 Ejecutar la Migración

### 1. Ejecutar el script
```bash
cd scripts
node migrate-clients.js
```

### 2. Monitorear el progreso
El script mostrará:
- ✅ Registros insertados exitosamente
- ⚠️ Registros saltados (duplicados o datos incompletos)
- ❌ Errores (con detalles)

### 3. Revisar resultados
Al final verás un resumen completo y un archivo `migration-errors.log` si hay errores.

## 🔍 Verificación

### 1. Verificar en la base de datos
```bash
npx prisma studio
```

### 2. Verificar en la aplicación
- Ve a la página de clientes
- Verifica que aparezcan los datos
- Prueba la búsqueda y paginación

## 🛠️ Solución de Problemas

### Error: "No se encontró el archivo"
- Verifica que el archivo esté en `scripts/data/clientes-wordpress.xlsx`
- Verifica que el nombre del archivo sea exacto

### Error: "Datos incompletos"
- Revisa que todas las filas tengan al menos: Nome, Cognome, E-mail
- Las filas incompletas se saltarán automáticamente

### Error: "Email ya existe"
- El script detecta emails duplicados automáticamente
- Los duplicados se saltarán

### Error de conexión a la base de datos
- Verifica que tu `DATABASE_URL` esté configurado
- Verifica que la base de datos esté accesible

## 📊 Resultados Esperados

Con 3,000 registros, deberías ver algo como:
```
📊 RESUMEN DE MIGRACIÓN:
✅ Registros insertados exitosamente: 2,850
⚠️  Registros saltados: 120
❌ Errores: 30
📈 Total procesados: 3,000
```

## 🔄 Re-ejecutar la Migración

Si necesitas re-ejecutar:
1. El script detectará emails duplicados automáticamente
2. Solo insertará registros nuevos
3. Puedes ejecutarlo múltiples veces sin problemas

## 📞 Soporte

Si encuentras problemas:
1. Revisa el archivo `migration-errors.log`
2. Verifica que el formato de Excel sea correcto
3. Asegúrate de tener permisos de escritura en la base de datos
