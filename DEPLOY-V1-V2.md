# MoneyConfidence-tabs

## Entrada de la app

**Login** (`/acceso`) → **Posición global** (`/app/posicion-global`).

Sin pantalla push, sin splash de bienvenida ni modal de próximos pagos.

## Desarrollo local

```bash
npm install
npm start
```

Abre [http://localhost:4200](http://localhost:4200) (redirige a `/acceso`).

## Build y Vercel

```bash
npm run build
# o
npm run build:prod
```

- **Build command:** `npm run build` (o vacío si Vercel usa el script por defecto del proyecto).
- **Output directory:** `dist/money-confidence` (override en Vercel; no uses solo `dist`).

## Posición global

Pestañas «Tu saldo total» / «Próximos pagos» en la pantalla de inicio.
