# Pizarra comercial · Culligan Biofy

Pizarra para la TV de la reunión matinal de comerciales: ranking por total neto, podio, vistas Global / Córdoba / Alicante y leyenda de comisiones. Publicada en GitHub Pages.

- La página pide contraseña. Sin ella no se ve ningún dato.
- Este repositorio es **público** y solo tiene el código: **ni nombres, ni ventas, ni comisiones, ni fotos**.
- Los datos viven en el repositorio **privado** `pizarra-datos`, carpeta `pizarra/`:
  - `config.json`: comerciales que salen, su equipo, quién se excluye, valor de RECU y leyenda de comisiones.
  - `index.json` y `versiones/`: una versión por cada PDF guardado (solo totales por comercial).
  - `fotos/`: fotos de los comerciales (jpg 360×360).

## Uso diario (administrador)
1. Descargar de WhatsApp el PDF «Estadísticas».
2. Abrir la pizarra › ⚙ › contraseña de administrador › «Subir el PDF del día».
3. Revisar los avisos (las tablas tienen que cuadrar con su TOTAL) y el día de los datos, y pulsar «Guardar versión».
La TV carga sola la última versión (se pone al día cada 5 minutos).

Solo se lee la **página 1** del PDF: tablas BIOFY y OFERTAS RECU (cada venta RECU cuenta 0,5).

## Contraseñas
- **Ver:** para la TV y los dispositivos. Solo la última versión y claro/oscuro. Opción «Recordar este dispositivo» durante 2 semanas.
- **Administrador:** subir PDF, elegir y borrar versiones, y poner fotos.

## Montar la página
```
export PATH=$HOME/bin:$PATH
cd scripts
node build.mjs --secrets /ruta/fuera/pizarra-secretos.json --out ../index.html
```
El formato de `pizarra-secretos.json` está al principio de `scripts/build.mjs`. Después: commit y push.

Para probar en el ordenador sin nube (versiones y fotos en el navegador):
```
node build.mjs --local --config ../datos-locales/config.json --out ../datos-locales/prueba.html
```

## Qué hay aquí
| Ruta | Qué es |
|---|---|
| `index.html` | La página publicada (montada, con las claves cifradas) |
| `src/pizarra.html` | Código fuente, sin claves |
| `src/logo-vertical-*.svg` | Logo vertical (azul para el tema claro, blanco para el oscuro) |
| `scripts/build.mjs`, `scripts/encrypt.mjs` | Montaje y cifrado |
