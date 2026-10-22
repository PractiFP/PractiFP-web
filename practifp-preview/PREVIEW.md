# PractiFP — Preview local (sin instalar nada salvo Node.js)

Esto es una forma rápida de **ver y usar la aplicación de verdad en tu navegador**,
sin tener que instalar MySQL ni ejecutar `npm install`.

## Cómo arrancarla

Necesitas tener [Node.js](https://nodejs.org) 22 o superior instalado. Luego:

```
node start.mjs
```

Y abre **http://localhost:5173** en tu navegador.

Cuentas de ejemplo:
- Alumno: `alumno@demo.es` / `alumno123`
- Empresa: `empresa@techsevilla.es` / `empresa123`
- Admin: `admin@practifp.es` / `admin123`

Para parar, `Ctrl+C` en la terminal. **Los datos viven solo en memoria**: cada vez que
reinicies `node start.mjs`, vuelven a su estado de partida (con los ejemplos sembrados).

## ¿Qué es exactamente esto?

Es tu código real de `backend/src` (el mismo que en `practifp-fullstack.zip`, sin
modificar ni una línea) y el frontend de React ya compilado. Para que funcione sin
MySQL ni `npm install`, el backend usa aquí una base de datos SQLite en memoria y unas
versiones mínimas de Express, mysql2, bcrypt, JWT, etc. en vez de las librerías reales
— es decir, la **lógica de negocio es la de verdad**, pero la infraestructura de abajo
es una versión ligera pensada solo para probar rápido.

## Para la versión real (producción)

Usa el `practifp-fullstack.zip` con las instrucciones de su `README.md`: Node + MySQL +
`npm install` de verdad, con `express`, `mysql2`, etc. tal cual se instalarían en
cualquier proyecto. Esta carpeta de preview **no está pensada para desplegar**, solo
para que puedas probar la aplicación ahora mismo sin montar nada.
