# Instrucciones para Poblar Datos Iniciales de Tour Bus

## Paso 1: Asegúrate de estar logueado como usuario TI

## Paso 2: Ejecuta el siguiente comando en la consola del navegador o usa Postman

### Opción A: Desde la consola del navegador (F12)
```javascript
fetch('/api/seed-bus-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log('✅ Datos sembrados:', data))
.catch(err => console.error('❌ Error:', err));
```

### Opción B: Desde Postman o Thunder Client
- **Method**: POST
- **URL**: `http://localhost:3001/api/seed-bus-data`
- **Headers**: Debes estar autenticado con Clerk

## Datos que se crearán:

### Fermate (13 fermate):
1. Lambrate Stazione
2. Cologno Centro
3. Trezzo Sull'ada
4. Agrate Brianza
5. Bergamo Piazzale Malpensata
6. Bergamo 2 Persone Automunite
7. Brescia
8. Peschiera del Garda
9. Trento Uscita TrentoSud
10. Rovato
11. Vicenza
12. Lomazzo
13. Monza

### Stati (4 estados):
1. Libre
2. Pagado
3. Acconto
4. Prenotato

## Nota:
Si los datos ya existen, no se duplicarán. El endpoint es idempotente.




