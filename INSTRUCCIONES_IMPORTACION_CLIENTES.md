# 📥 Instrucciones de Importación de Clientes desde Excel

## 📋 Descripción

Este script importa clientes desde el archivo `dataClientes.xlsx` ubicado en `/public` hacia la tabla `clients` en la base de datos.

## 📊 Estructura del Archivo Excel

El archivo `dataClientes.xlsx` debe contener las siguientes columnas:

| Columna Excel | Mapeo Base de Datos | Requerido | Notas |
|--------------|---------------------|-----------|-------|
| Nome | firstName | ✅ Sí | Campo obligatorio |
| Cognome | lastName | ⚠️ Parcial | Si está vacío, se guarda como string vacío `""` |
| Codice Fiscale | fiscalCode | ⚠️ Parcial | Si está vacío, se guarda como string vacío `""` |
| Telefono | phoneNumber | ⚠️ Parcial | Si está vacío, se guarda como string vacío `""` |

## 🔧 Campos Generados Automáticamente

Los siguientes campos son requeridos por el modelo `Client` pero no están en el Excel:

- **email**: Se genera automáticamente usando `sinemail@gmail.com` con números incrementales (`sinemail1@gmail.com`, `sinemail2@gmail.com`, etc.) para mantener la unicidad. (Este campo es obligatorio y único, por lo que debe generarse automáticamente. Los emails se actualizarán gradualmente desde el sistema)
- **address**: Se guarda como string vacío `""` (se completará gradualmente desde el sistema)
- **birthPlace**: Se guarda como string vacío `""` (se completará gradualmente desde el sistema)
- **birthDate**: Se guarda como `1900-01-01` (fecha muy antigua para indicar que no está disponible, se completará gradualmente desde el sistema)
- **createdBy**: Se obtiene del primer usuario activo o se puede especificar con `--user-email`

**Importante:** Los campos vacíos se guardan como strings vacíos `""` o valores por defecto mínimos, no se llenan automáticamente con datos ficticios. Esto permite completar la información gradualmente desde el sistema.

## 🚀 Uso del Script

### Importación Normal (guardará en la base de datos)

```bash
npm run import:clientes
```

### Dry Run (solo mostrará qué se importaría, sin guardar)

```bash
npm run import:clientes:dry-run
```

### Especificar Usuario Creador

```bash
node scripts/import-clientes-excel.js --user-email=usuario@example.com
```

### Combinar Opciones

```bash
node scripts/import-clientes-excel.js --user-email=usuario@example.com --dry-run
```

## 📝 Ejemplo de Ejecución

```bash
$ npm run import:clientes:dry-run

📥 IMPORTAR CLIENTES DESDE EXCEL

   Modo: 🔍 DRY RUN (no guardará datos)

📄 Leyendo archivo: D:\gibravotravel\public\dataClientes.xlsx
✅ Encontradas 150 filas en el archivo

👤 Usuario creador (por defecto): admin@gibravo.it (user_abc123...)

📊 Procesando datos...

✅ Fila 2: Creado - Mario Rossi (mario.rossi@temp.gibravo.it)
✅ Fila 3: Creado - Giuseppe Verdi (giuseppe.verdi@temp.gibravo.it)
⏭️  Fila 4: Omitida (sin Nome)

==================================================
📋 RESUMEN DE IMPORTACIÓN

   Total de filas:        150
   Procesadas:            149
   [DRY RUN] Se crearían:  149
   Omitidas:              1
   Duplicados:            0
   Errores:               0

💡 Para guardar los datos, ejecuta sin --dry-run
==================================================
```

## ⚠️ Consideraciones Importantes

1. **Emails Únicos**: El script genera emails únicos automáticamente. Si un email ya existe, se intentará con un sufijo numérico.

2. **Datos Faltantes**: Los campos requeridos que no están en el Excel se completan con valores por defecto. Es importante revisar y completar estos datos posteriormente desde el sistema.

3. **Validación**: Solo se importan las filas que contengan al menos el campo `Nome`. Las demás se omiten.

4. **Duplicados**: Si un cliente con el mismo email ya existe, se marca como duplicado y se omite.

5. **Entornos**: El script funciona tanto en local como en producción. Solo necesitas tener acceso a la base de datos y el archivo Excel.

## 🔍 Verificar Importación

Después de importar, puedes verificar los clientes importados:

1. Desde la interfaz web: Ve a `/clienti`
2. Desde Prisma Studio: `npm run db:studio`
3. Desde la base de datos: Consulta la tabla `clients`

## 🐛 Resolución de Problemas

### Error: "No se encuentra el archivo"
- Verifica que `dataClientes.xlsx` esté en la carpeta `/public`
- Verifica la ruta del archivo

### Error: "No hay usuarios en la base de datos"
- Crea al menos un usuario en el sistema
- O especifica un usuario con `--user-email=email@example.com`

### Error: "Email duplicado"
- El script maneja automáticamente los emails duplicados agregando un número
- Si persiste el error, revisa manualmente los emails en la base de datos

## 📌 Próximos Pasos

Después de la importación, es recomendable:

1. ✅ Revisar los clientes importados en la interfaz web
2. ✅ Completar los campos con valores por defecto (address, birthPlace, birthDate)
3. ✅ Verificar que los emails temporales se actualicen con emails reales
4. ✅ Agregar documentos si es necesario

