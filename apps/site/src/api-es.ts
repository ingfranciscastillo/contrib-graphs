/**
 * Traducciones al español de la referencia de la API (src/data/api.json).
 * La clave es el texto en inglés del JSDoc del paquete: si dos props comparten
 * descripción, comparten traducción. Un test exige que no falte ninguna.
 */
export const apiEs: Record<string, string> = {
  // ------------------------------------------------------------------ componentes
  'The classic weeks × days grid.': 'La cuadrícula clásica de semanas × días.',
  'Circles whose size also encodes intensity, so it still reads in monochrome.':
    'Círculos cuyo tamaño también indica la intensidad, así que se lee incluso en monocromo.',
  "Isometric columns whose height shows each day's activity.": 'Columnas isométricas cuya altura muestra la actividad de cada día.',
  'Real monospace text, for portfolios with a terminal look.': 'Texto monospace real, para portfolios con estética de terminal.',
  'The year as a ring: each week is a slice and each weekday a band.': 'El año como un anillo: cada semana es una porción y cada día de la semana un aro.',
  'One building per week: your year as a city skyline.': 'Un edificio por semana: tu año como la silueta de una ciudad.',
  'A single row with the last N days, for headers, cards and footers.': 'Una sola fila con los últimos N días, para headers, tarjetas y footers.',

  // ------------------------------------------------------------------ props compartidas
  'Days of activity. Missing days count as 0 and duplicate dates are added up.':
    'Días de actividad. Los días que faltan cuentan como 0 y las fechas repetidas se suman.',
  'A preset name or your own theme object.': 'El nombre de un preset o un objeto con tu propio tema.',
  '`auto` follows `prefers-color-scheme`, or `data-theme="light|dark"` on `<html>`.':
    '`auto` sigue `prefers-color-scheme`, o `data-theme="light|dark"` en `<html>`.',
  'Number of weeks to show.': 'Número de semanas a mostrar.',
  'Last day of the calendar. When rendering on the server, always pass it: the server and the browser may be on different days.':
    'Último día del calendario. Con render en servidor pásalo siempre: el servidor y el navegador pueden estar en días distintos.',
  'First day of each column: 0 = Sunday, 1 = Monday.': 'Primer día de cada columna: 0 = domingo, 1 = lunes.',
  'How counts map to the five color levels.': 'Cómo se asignan los conteos a los cinco niveles de color.',
  'Locale for dates and numbers. Fixed by default so server and client HTML match.':
    'Locale para fechas y números. Fijo por defecto para que el HTML del servidor y del cliente coincidan.',
  'Staggered entry animation. Turned off with `prefers-reduced-motion`.': 'Animación de entrada escalonada. Se desactiva con `prefers-reduced-motion`.',
  'Show the Less–More legend.': 'Muestra la leyenda Menos–Más.',
  'Show the header with the total.': 'Muestra el encabezado con el total.',
  'Replaces the whole header text.': 'Reemplaza todo el texto del encabezado.',
  'Singular and plural of the unit being counted.': 'Singular y plural de la unidad que se cuenta.',
  'Text after the total in the header. Can be a function of the weeks shown.':
    'Texto tras el total en el encabezado. Puede ser una función de las semanas mostradas.',
  'Labels at both ends of the legend.': 'Textos en los extremos de la leyenda.',
  'Called when a day is clicked, or with Enter or Space while it is focused.': 'Se llama al hacer clic en un día, o con Enter o Espacio cuando tiene el foco.',
  'Extra class name for the root element.': 'Clase extra para el elemento raíz.',
  'Inline styles for the root element. Theme CSS variables can be overridden here.':
    'Estilos en línea del elemento raíz. Aquí se pueden sobrescribir las variables CSS del tema.',
  'Accessible name of the graph.': 'Nombre accesible del gráfico.',

  // ------------------------------------------------------------------ props por variante
  'Size of each cell in px.': 'Tamaño de cada celda en px.',
  'Space between cells in px.': 'Separación entre celdas en px.',
  'Corner radius in px; use `cellSize / 2` for circles. Classic only.': 'Radio de las esquinas en px; usa `cellSize / 2` para círculos. Solo en Classic.',
  'Corner radius in px.': 'Radio de las esquinas en px.',
  'Show Mon/Wed/Fri labels.': 'Muestra las etiquetas lun/mié/vie.',
  'Show month labels.': 'Muestra las etiquetas de los meses.',
  'Add a glow to the busiest days.': 'Añade un brillo a los días con más actividad.',
  'On narrow screens, `crop` drops the oldest weeks and `scale` shrinks the SVG.':
    'En pantallas angostas, `crop` quita las semanas más antiguas y `scale` encoge el SVG.',
  'Width of each tile in px.': 'Ancho de cada baldosa en px.',
  'Height of the tallest column in px.': 'Altura de la columna más alta en px.',
  '`count` scales columns by the actual count; `level` uses five fixed heights.':
    '`count` escala las columnas según el conteo real; `level` usa cinco alturas fijas.',
  'Show longest streak, current streak and best day in the header.': 'Muestra la racha más larga, la racha actual y el mejor día en el encabezado.',
  'Labels of the three stats.': 'Etiquetas de las tres estadísticas.',
  'Characters for each level: `blocks` (░▒▓█), `squares`, `ascii` or `dots`.': 'Caracteres de cada nivel: `blocks` (░▒▓█), `squares`, `ascii` o `dots`.',
  'Command shown in the first prompt line.': 'Comando que aparece en la primera línea del prompt.',
  'Text before the command.': 'Texto antes del comando.',
  'Color the characters with the theme; `false` is monochrome.': 'Colorea los caracteres con el tema; `false` es monocromo.',
  'On narrow screens, `crop` drops the oldest weeks and `scale` shrinks the text (down to 6px, then crops).':
    'En pantallas angostas, `crop` quita las semanas más antiguas y `scale` reduce el texto (hasta 6px; después recorta).',
  'Diameter in px.': 'Diámetro en px.',
  'Inner radius as a fraction of the outer radius.': 'Radio interior como fracción del radio exterior.',
  'Show month labels around the ring.': 'Muestra las etiquetas de los meses alrededor del anillo.',
  'Show the header with the total. The total is already in the center of the ring.':
    'Muestra el encabezado con el total. El total ya aparece en el centro del anillo.',
  'Height of the tallest building in px.': 'Altura del edificio más alto en px.',
  'Width of each building in px.': 'Ancho de cada edificio en px.',
  'Space between buildings in px.': 'Separación entre edificios en px.',
  'Draw seven windows per building, lit on the days with activity.': 'Dibuja siete ventanas por edificio, encendidas en los días con actividad.',
  'Called when a week is clicked, or with Enter or Space while it is focused.':
    'Se llama al hacer clic en una semana, o con Enter o Espacio cuando tiene el foco.',
  'Number of days to show.': 'Número de días a mostrar.',
  'Show the current streak next to the total.': 'Muestra la racha actual junto al total.',
  'Streak text, given the number of days.': 'Texto de la racha; recibe el número de días.',
  'Text after the total, given the number of days.': 'Texto tras el total; recibe el número de días.',

  // ------------------------------------------------------------------ contrib-graphs/data
  'Lays out days as a weeks × 7 grid with levels, totals and month labels. Dates are handled in UTC.':
    'Organiza los días en una cuadrícula de semanas × 7 con niveles, totales y etiquetas de mes. Las fechas se manejan en UTC.',
  "Total, active days, best day, longest streak and current streak. A current streak isn't broken by a quiet today.":
    'Total, días activos, mejor día, racha más larga y racha actual. La racha actual no se rompe si hoy todavía no hay actividad.',
  "Keeps the last `n` weeks. Levels come from the full calendar, so cropping doesn't change colors.":
    'Conserva las últimas `n` semanas. Los niveles vienen del calendario completo, así que recortar no cambia los colores.',
  "Fetches the last year of contributions from GitHub's GraphQL API. Server only (Node 18+, Deno, Bun, edge runtimes). A classic token with `read:user` includes private contributions.":
    'Obtiene el último año de contribuciones de la API GraphQL de GitHub. Solo en servidor (Node 18+, Deno, Bun, edge runtimes). Un token clásico con `read:user` incluye las contribuciones privadas.',
  "Fetches a GitLab user's calendar. The endpoint is public but sends no CORS headers, so call it from the server or at build time. Pass `baseUrl` for self-hosted instances.":
    'Obtiene el calendario de un usuario de GitLab. El endpoint es público pero no envía cabeceras CORS: llámalo desde el servidor o en build. Pasa `baseUrl` para instancias self-hosted.',
  'Renders the isometric graph as a standalone SVG string: no JavaScript, no external CSS and colors already resolved, so it works as an image in a GitHub README. For light and dark READMEs, render once per `mode` and use a `<picture>` element.':
    'Genera el gráfico isométrico como un SVG autónomo: sin JavaScript, sin CSS externo y con los colores ya resueltos, así que funciona como imagen en un README de GitHub. Para claro y oscuro, genera uno por `mode` y usa un elemento `<picture>`.',
  'Formats an ISO date with `Intl`, in UTC so the day never shifts.': 'Formatea una fecha ISO con `Intl`, en UTC para que el día nunca se corra.',
  'Counts occurrences per day: blog posts, workouts, local commits… Strings are sliced to the date; `Date` objects use the local date.':
    'Cuenta ocurrencias por día: posts, entrenamientos, commits locales… Los strings se recortan a la fecha; los objetos `Date` usan la fecha local.',
  'Converts a GitHub GraphQL response into `{ date, count }` days.': 'Convierte una respuesta GraphQL de GitHub en días `{ date, count }`.',
  'Converts GitLab\'s `{ "2026-03-01": 4 }` calendar into `{ date, count }` days.': 'Convierte el calendario de GitLab `{ "2026-03-01": 4 }` en días `{ date, count }`.',
  'Deterministic sample data: the same seed always gives the same days. Useful for demos and tests.':
    'Datos de ejemplo deterministas: la misma semilla siempre da los mismos días. Útil para demos y tests.',
  'Returns a function that maps a count to a level from 0 to 4 for the given counts and scale.':
    'Devuelve una función que convierte un conteo en un nivel de 0 a 4 según los conteos y la escala.',
  'Adds several sources day by day (for example GitHub plus GitLab), sorted by date.':
    'Suma varias fuentes día por día (por ejemplo GitHub y GitLab), ordenadas por fecha.',
  'Returns the theme object for a preset name or a custom theme; unknown names fall back to `github`.':
    'Devuelve el objeto del tema para un nombre de preset o un tema propio; los nombres desconocidos usan `github`.',
  'Turns a theme into CSS variables (`--cg-l0-light`, `--cg-l0-dark`…); the stylesheet picks light or dark.':
    'Convierte un tema en variables CSS (`--cg-l0-light`, `--cg-l0-dark`…); la hoja de estilos elige claro u oscuro.',
  'GitHub GraphQL query for the contribution calendar. It needs a token even for public data, so run it on the server and never send the token to the browser.':
    'Query GraphQL de GitHub para el calendario de contribuciones. Necesita un token incluso para datos públicos: ejecútala en el servidor y nunca envíes el token al navegador.',
  'Available sample profiles with a short English label.': 'Perfiles de datos de ejemplo disponibles, con una etiqueta corta en inglés.',
  'Names of the built-in themes.': 'Nombres de los temas incluidos.',
  'Built-in themes: `github`, `gitlab`, `frost`, `ember`, `violet` and `mono`.': 'Temas incluidos: `github`, `gitlab`, `frost`, `ember`, `violet` y `mono`.',

  // ------------------------------------------------------------------ defaults que son texto
  today: 'hoy',
  'a summary with the total and the date range': 'un resumen con el total y el rango de fechas',
  "'in the last year' (52+ weeks), otherwise 'in the last {weeks} weeks'": "'in the last year' (52+ semanas); si no, 'in the last {weeks} weeks'",
}

/** Traduce un texto de la API; los valores que son código (`'crop'`, `11`) se quedan igual. */
export const apiText = (text: string, lang: 'en' | 'es') => (lang === 'es' ? (apiEs[text] ?? text) : text)
