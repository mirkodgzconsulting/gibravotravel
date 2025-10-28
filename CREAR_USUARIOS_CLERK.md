# 🔐 GUÍA: CREAR USUARIOS EN CLERK DASHBOARD

## ⚠️ PROBLEMA ACTUAL

Los usuarios **NO EXISTEN** en Clerk, por eso recibes el error "no autorizado" al intentar iniciar sesión.

## 📋 SOLUCIÓN: CREAR USUARIOS MANUALMENTE

### **PASO 1: Acceder a Clerk Dashboard**

1. Ve a: **https://dashboard.clerk.com**
2. Inicia sesión con tu cuenta de Clerk
3. Selecciona tu aplicación **"gibravotravel"** (o el nombre que le hayas dado)

### **PASO 2: Ir a la sección de Usuarios**

1. En el menú lateral izquierdo, haz clic en **"Users"**
2. Haz clic en el botón **"+ Create user"** (arriba a la derecha)

### **PASO 3: Crear Usuario TI**

Completa el formulario con estos datos:

```
Email address: ti@test.com
Password: test2025//@
First name: TI
Last name: Test
```

- Haz clic en **"Create"**
- **IMPORTANTE:** Copia el **User ID** (clerkId) que aparece (ejemplo: `user_2abc123def456`)

### **PASO 4: Crear Usuario ADMIN**

Repite el proceso:

```
Email address: admin@test.com
Password: 0.vj1yuc3szpA1!
First name: Admin
Last name: Test
```

- Haz clic en **"Create"**
- **IMPORTANTE:** Copia el **User ID** (clerkId)

### **PASO 5: Crear Usuario USER**

Repite el proceso:

```
Email address: user@test.com
Password: test2065//@
First name: User
Last name: Test
```

- Haz clic en **"Create"**
- **IMPORTANTE:** Copia el **User ID** (clerkId)

### **PASO 6: Sincronizar con la Base de Datos**

Después de crear los 3 usuarios en Clerk, ejecuta este comando:

```bash
node scripts/sync-existing-clerk-users.js
```

Este script buscará los usuarios en Clerk y actualizará automáticamente los `clerkId` en la base de datos.

---

## 🎯 VERIFICACIÓN

### **1. Verificar que los usuarios se crearon en Clerk:**
- Ve a Clerk Dashboard → Users
- Deberías ver 3 usuarios:
  - ti@test.com
  - admin@test.com
  - user@test.com

### **2. Verificar sincronización con base de datos:**
```bash
node scripts/view-users.js
```

Deberías ver los 3 usuarios con sus `clerkId` reales (no temporales).

### **3. Probar inicio de sesión:**
1. Inicia el servidor: `npm run dev`
2. Ve a: http://localhost:3000
3. Haz clic en "Sign In"
4. Prueba con cada usuario:
   - ti@test.com / test2025//@
   - admin@test.com / 0.vj1yuc3szpA1!
   - user@test.com / test2065//@

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Problema: "Email address is taken"**
**Causa:** El usuario ya existe en Clerk pero con otro proyecto

**Solución:**
1. Usa emails diferentes, por ejemplo:
   - ti@gibravotravel.test
   - admin@gibravotravel.test
   - user@gibravotravel.test
2. O elimina los usuarios existentes del otro proyecto

### **Problema: "Usuario no autorizado"**
**Causa:** Los `clerkId` no coinciden entre Clerk y la base de datos

**Solución:**
1. Ejecuta: `node scripts/sync-existing-clerk-users.js`
2. Verifica que los `clerkId` se actualizaron correctamente

### **Problema: "Usuario no encontrado"**
**Causa:** El usuario existe en Clerk pero no en la base de datos

**Solución:**
1. Ejecuta: `node scripts/restore-complete-system.js`
2. Luego: `node scripts/update-real-users.js`
3. Finalmente: `node scripts/sync-existing-clerk-users.js`

---

## 📝 ALTERNATIVA: USAR SIGN UP

Si prefieres no crear usuarios manualmente:

1. Ve a http://localhost:3000
2. Haz clic en "Sign Up"
3. Registra cada usuario con los emails y contraseñas proporcionados
4. **IMPORTANTE:** Después de registrarse, actualiza el rol en la base de datos:

```sql
-- Para TI
UPDATE users SET role = 'TI' WHERE email = 'ti@test.com';

-- Para ADMIN
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';

-- Para USER (ya es USER por defecto)
-- No necesita cambios
```

---

## 🎉 ¡LISTO!

Una vez completados estos pasos, podrás:
- ✅ Iniciar sesión con cualquiera de los 3 usuarios
- ✅ Ver diferentes permisos según el rol
- ✅ Crear ventas de prueba
- ✅ Probar todas las funcionalidades del sistema

---

**Fecha:** $(date)
**Estado:** Pendiente creación de usuarios en Clerk Dashboard



