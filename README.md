# Calculadora Plus

Una calculadora con interfaz responsive, teclado físico y un peculiar modelo de suscripción: el resultado de cada operación queda bloqueado tras pulsar `=`.

## Cómo abrirla

No hace falta instalar nada ni compilar el proyecto. Abre `index.html` en cualquier navegador moderno o sirve esta carpeta con un servidor estático:

```bash
python -m http.server 8000
```

Visita `http://localhost:8000`.

## Publicar en GitHub Pages

El proyecto es estático, por lo que puede alojarse directamente en GitHub Pages si la configuración del repositorio lo permite. En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`. GitHub publicará la web en una URL similar a `https://rit4lin.github.io/calculatorplus/`. La disponibilidad de Pages depende de la visibilidad del repositorio y del plan.

**Nota:** no se ha habilitado GitHub Pages ni ningún despliegue automáticamente.

## Controles

- Números, operaciones `+`, `−`, `×` y `÷`, porcentaje, cambio de signo y decimales.
- `Intro` o `=` para iniciar el cálculo y abrir el bloqueo del resultado.
- `Retroceso` para borrar el último dígito; `Esc` o `Supr` para limpiar.
- `Esc` para cerrar la ventana de suscripción.

La interfaz **no procesa pagos**, **no recopila datos** ni realiza llamadas a servicios externos. Los botones de suscripción/restauración solo muestran mensajes locales. Funciona completamente sin conexión.

## Archivos

- `index.html`: estructura y contenido.
- `styles.css`: diseño responsive y animaciones.
- `app.js`: lógica de operaciones y pantalla de suscripción.
- `favicon.svg`: icono vectorial.

## Licencia

Uso personal. Sin licencia de código abierto definida.
