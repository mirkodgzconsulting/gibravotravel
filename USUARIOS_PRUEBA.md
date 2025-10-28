# 👥 USUARIOS DE PRUEBA - CONFIGURACIÓN COMPLETA

## ✅ ESTADO ACTUAL

La base de datos ha sido restaurada exitosamente con 3 usuarios de prueba:

### 🔧 **USUARIO TI**
- **Email:** `ti@test.com`
- **Password:** `test2025//@`
- **Rol:** TI
- **Permisos:** Acceso total al sistema

### 👑 **USUARIO ADMIN**
- **Email:** `admin@test.com`
- **Password:** `0.vj1yuc3szpA1!`
- **Rol:** ADMIN
- **Permisos:** Gestión completa de tours, ventas y configuración

### 👤 **USUARIO USER (Agente)**
- **Email:** `user@test.com`
- **Password:** `test2065//@`
- **Rol:** USER
- **Permisos:** Registro de ventas, ver solo sus propios registros

---

## 🔐 CONFIGURACIÓN EN CLERK

### **OPCIÓN 1: Crear usuarios manualmente en Clerk Dashboard**

1. **Ve a Clerk Dashboard:**
   - URL: https://dashboard.clerk.com
   - Inicia sesión con tu cuenta de Clerk

2. **Selecciona tu aplicación:**
   - Busca "gibravotravel" o tu aplicación correspondiente

3. **Crear usuarios:**
   - Ve a "Users" en el menú lateral
   - Haz clic en "Create User"
   - Para cada usuario, ingresa:
     - Email
     - Password
     - First Name
     - Last Name

4. **Usuarios a crear:**
   ```
   Usuario 1:
   - Email: ti@test.com
   - Password: test2025//@
   - First Name: TI
   - Last Name: Test

   Usuario 2:
   - Email: admin@test.com
   - Password: 0.vj1yuc3szpA1!
   - First Name: Admin
   - Last Name: Test

   Usuario 3:
   - Email: user@test.com
   - Password: test2065//@
   - First Name: User
   - Last Name: Test
   ```

5. **Copiar ClerkId de cada usuario:**
   - Después de crear cada usuario, haz clic en él
   - Copia el "User ID" (ejemplo: `user_2abc123def456`)
   - Guarda estos IDs para el siguiente paso

6. **Sincronizar con la base de datos:**
   - Edita el archivo `scripts/sync-clerk-users-manual.js`
   - Reemplaza los valores placeholder con los clerkId reales:
     ```javascript
     const clerkUsers = {
       TI: {
         email: 'ti@test.com',
         clerkId: 'user_2abc123def456', // ← Pega aquí el clerkId real
       },
       ADMIN: {
         email: 'admin@test.com',
         clerkId: 'user_2xyz789ghi012', // ← Pega aquí el clerkId real
       },
       USER: {
         email: 'user@test.com',
         clerkId: 'user_2jkl345mno678', // ← Pega aquí el clerkId real
       }
     };
     ```
   - Ejecuta el script:
     ```bash
     node scripts/sync-clerk-users-manual.js
     ```

---

### **OPCIÓN 2: Dejar que Clerk sincronice automáticamente (Recomendado)**

Si tu aplicación tiene configurado el webhook de Clerk o el middleware de sincronización automática:

1. **Simplemente inicia sesión:**
   - Ve a tu aplicación: http://localhost:3000
   - Haz clic en "Sign In"
   - Usa las credenciales de cada usuario

2. **Clerk sincronizará automáticamente:**
   - Al iniciar sesión por primera vez, Clerk creará el usuario si no existe
   - El middleware actualizará automáticamente el clerkId en la base de datos

3. **Verifica la sincronización:**
   - Después de iniciar sesión con cada usuario, verifica en la base de datos:
     ```sql
     SELECT email, "clerkId", role FROM users;
     ```

---

## 🎯 VERIFICACIÓN DEL SISTEMA

### **1. Verificar usuarios en la base de datos:**
```bash
node scripts/view-users.js
```

### **2. Probar inicio de sesión:**
- Ve a: http://localhost:3000
- Inicia sesión con cada usuario
- Verifica que el rol se muestre correctamente en la interfaz

### **3. Probar permisos:**

#### **Como TI (`ti@test.com`):**
- ✅ Debe ver todas las opciones del sidebar
- ✅ Debe poder crear/editar/eliminar tours
- ✅ Debe poder ver todas las ventas de todos los usuarios
- ✅ Debe poder gestionar configuración (métodos de pago, IATA, etc.)

#### **Como ADMIN (`admin@test.com`):**
- ✅ Debe ver todas las opciones del sidebar
- ✅ Debe poder crear/editar/eliminar tours
- ✅ Debe poder ver todas las ventas de todos los usuarios
- ✅ Debe poder gestionar usuarios

#### **Como USER (`user@test.com`):**
- ✅ Debe ver opciones limitadas del sidebar
- ✅ Debe poder registrar ventas
- ✅ Solo debe ver sus propias ventas en BIGLIETTERIA
- ❌ No debe poder crear/editar tours
- ❌ No debe poder gestionar configuración

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Problema 1: "Usuario no autorizado"**
**Causa:** El clerkId en la base de datos no coincide con el clerkId de Clerk

**Solución:**
1. Verifica el clerkId en Clerk Dashboard
2. Actualiza el clerkId en la base de datos:
   ```sql
   UPDATE users SET "clerkId" = 'clerk_id_real' WHERE email = 'ti@test.com';
   ```

### **Problema 2: "Usuario no encontrado"**
**Causa:** El usuario existe en Clerk pero no en la base de datos

**Solución:**
1. Ejecuta el script de restauración nuevamente:
   ```bash
   node scripts/restore-complete-system.js
   ```
2. Actualiza los emails:
   ```bash
   node scripts/update-real-users.js
   ```

### **Problema 3: No puedo iniciar sesión**
**Causa:** El usuario no existe en Clerk

**Solución:**
1. Crea el usuario en Clerk Dashboard
2. Usa las credenciales exactas proporcionadas arriba

### **Problema 4: Los permisos no funcionan correctamente**
**Causa:** El rol del usuario en la base de datos es incorrecto

**Solución:**
1. Verifica el rol en la base de datos:
   ```sql
   SELECT email, role FROM users;
   ```
2. Actualiza el rol si es necesario:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';
   ```

---

## 📊 DATOS DE PRUEBA DISPONIBLES

Después de la restauración, el sistema contiene:

### **✅ Configuración Básica**
- 7 métodos de pago
- 15 códigos IATA
- 8 servicios
- 8 paradas de bus
- 5 estados de bus
- 5 estados de pago

### **✅ Clientes de Ejemplo**
- Mario Rossi (RSSMRA80A01H501Z)
- Giulia Bianchi (BNCGLI85B02H501Z)
- Luca Verdi (VRDLCU90C03H501Z)
- Sofia Ferrari (FRRSFO88D04H501Z)

### **✅ Tours Disponibles**
- **Tour Bus 1:** "Tour Roma - París - Barcelona" (€1500/adulto)
  - 53 asientos disponibles
  - Fecha: 15 Agosto 2024 - 25 Agosto 2024
  
- **Tour Bus 2:** "Tour Italia del Norte" (€800/adulto)
  - 53 asientos disponibles
  - Fecha: 10 Septiembre 2024 - 15 Septiembre 2024

- **Tour Aéreo 1:** "Tour Madrid - Barcelona" (€900/adulto)
  - Meta: 100 pasajeros
  - Fecha: 5 Octubre 2024 - 12 Octubre 2024

- **Tour Aéreo 2:** "Tour París - Londres" (€1200/adulto)
  - Meta: 80 pasajeros
  - Fecha: 15 Noviembre 2024 - 22 Noviembre 2024

---

## 🎯 PRÓXIMOS PASOS

1. **✅ Crear usuarios en Clerk Dashboard** (si no existen)
2. **✅ Sincronizar clerkId** (usando el script o iniciando sesión)
3. **✅ Probar inicio de sesión** con cada usuario
4. **✅ Verificar permisos** de cada rol
5. **✅ Crear ventas de prueba** para validar funcionalidades
6. **✅ Probar gráficos del dashboard** con datos reales
7. **✅ Configurar backups automáticos** para evitar pérdida de datos

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Verifica que los usuarios existen en Clerk Dashboard
2. Verifica que los clerkId coinciden entre Clerk y la base de datos
3. Revisa los logs de la consola del navegador y del servidor
4. Consulta el archivo `ARQUITECTURA_COMPLETA.md` para más detalles

---

**Fecha de creación:** $(date)
**Estado:** ✅ Usuarios configurados - Pendiente sincronización con Clerk


