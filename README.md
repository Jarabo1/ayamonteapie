# AYAMONTE A PIE

Aplicación web progresiva (PWA) para consultar rutas, realizar caminatas con GPS y consultar estadísticas personales en Ayamonte (Huelva).

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

## Producción

```bash
npm run build
npm run preview
```

Los archivos de producción se generan en `dist/`.

## Instalación en Android (PWA)

1. Publica la carpeta `dist/` en un alojamiento HTTPS (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).
2. Abre la URL en Chrome para Android.
3. Menú ⋮ → "Añadir a pantalla de inicio" o "Instalar aplicación".

La aplicación funciona sin conexión para los recursos cacheados (mapa base bajo demanda).

## Publicación gratuita con HTTPS

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Netlify
Arrastra la carpeta `dist/` a https://app.netlify.com/drop o usa la CLI.

### GitHub Pages
Sube el contenido de `dist/` a una rama `gh-pages` o configura Actions para construir y desplegar.

## Estructura

- `src/pages` – pantallas principales.
- `src/components` – componentes reutilizables (mapa, layout).
- `src/utils` – geolocalización, almacenamiento (IndexedDB), exportación.
- `src/data/routes.ts` – catálogo de rutas con trazados reales (OSRM/OpenStreetMap).
- `public/` – iconos PWA.

## Notas

- Las distancias de las rutas se han calculado sobre cartografía real mediante OSRM (OpenStreetMap). Los desniveles se marcan como pendientes de verificar al no disponer de datos fiables.
- El seguimiento GPS depende del navegador y puede interrumpirse si Android suspende la app. Mantén la pantalla activa durante la caminata.
- El almacenamiento es local (IndexedDB). La estructura permite añadir sincronización con backend en el futuro.

## Licencia

Uso libre para fines educativos y personales. Cartografía © OpenStreetMap contributors (ODbL).