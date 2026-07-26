# Registro de Control de Asistencia

Programa para computadora que llena el **Registro de Control de Asistencia** en la
pantalla y genera un PDF igual al formato oficial, listo para imprimir o enviar.

En lugar de escribir a mano sobre el formato impreso, escribes en la computadora,
ves el resultado al instante y guardas cada planilla para reutilizarla.

---

# Parte 1 — Guía de uso

Esta parte no requiere conocimientos técnicos. Sigue los pasos en orden.

## Qué necesitas antes de empezar

Una computadora con **Windows** y el programa ya instalado. Si todavía no lo
tienes instalado, salta a la sección [Instalación](#instalación).

## La pantalla de inicio

Al abrir el programa verás dos opciones:

- **Nueva planilla** — empieza una planilla vacía.
- **Abrir existente** — muestra las planillas que guardaste antes. Si nunca has
  guardado ninguna, esta opción aparece apagada y no se puede pulsar.

Si eliges *Abrir existente*, verás la lista de tus planillas. Cada una muestra su
nombre y, debajo, el mes, cuántos días tienen datos y cuándo la guardaste. Puedes:

- **Abrir** — hacer clic en cualquier parte de la planilla para editarla.
- **Renombrar** (icono de lápiz) — el nombre se vuelve escribible; escribe el
  nuevo y presiona Enter.
- **Duplicar** (icono de dos hojas) — crea una copia. Útil para partir de la
  planilla del mes anterior sin modificarla.
- **Eliminar** (icono de basurero) — la borra. Te pide confirmación antes.

## Llenar una planilla

La pantalla se divide en dos: a la izquierda escribes, a la derecha ves el PDF.

### Cabecera

Los datos de arriba: Apellidos y Nombres, Dependencia, Código, Mes y Horas
Semanales. Si configuraste datos por defecto (ver más abajo), varios ya vendrán
llenos y solo tendrás que escribir el mes.

### Firma

Elige cómo quieres que aparezca tu firma en el PDF:

| Opción | Qué hace |
|---|---|
| Dejar en blanco | El PDF sale sin firma y la pones a mano después de imprimir. |
| Imagen de firma | Subes una foto o escaneo de tu firma (PNG o JPG). |
| Dibujar en pantalla | La dibujas con el mouse en el recuadro punteado. |
| Texto | Escribes tu nombre y aparece como texto. |

La firma se estampa sola en cada casilla "Firma" donde hayas registrado una hora.
No tienes que ponerla fila por fila.

### Tabla de días

Una fila por día, con 23 filas disponibles (las mismas que trae el formato
oficial). Deja vacías las que no uses.

**Para la fecha**, puedes escribirla o pulsar el icono de calendario y elegirla de
un calendario desplegable.

El calendario se abre directamente en el mes que hayas escrito en la cabecera. Si
pones `Julio`, se abre en el 1 de julio en lugar de en el día de hoy. Reconoce el
mes escrito de varias formas —`julio`, `JULIO`, `jul`— y entiende tanto
`septiembre` como `setiembre`. Si además escribes el año (`Julio 2025`) lo
respeta; si no, asume el actual.

Con un periodo de dos meses (`Julio - Agosto`) mira la fila de arriba: mientras
vengas llenando fechas de julio abre en julio, y en cuanto una fila pase a agosto
las siguientes se abren en agosto. Si el mes no se reconoce, se comporta como
antes y abre en la fecha de hoy.

**Para las horas**, escribe el número y el programa lo completa solo al salir del
campo:

| Escribes | Queda |
|---|---|
| `8` | `08:00` |
| `13` | `13:00` |
| `9.5` | `09:30` |
| `0900` | `09:00` |

La columna **Horas (auto)** se calcula sola con esta lógica: la hora de salida
final menos la de ingreso, restando el tiempo de refrigerio. Si el número que sale
no te cuadra, puedes escribir otro encima y el programa respeta el tuyo.

**Para reordenar un día**, arrastra el asa de puntos que está al inicio de la fila
y suéltala donde quieras. **Para borrar una fila**, pulsa la X del final: las de
abajo suben una posición.

## Ver, guardar e imprimir

La **vista previa** de la derecha se actualiza sola mientras escribes; no hay que
pulsar nada. Para descargar o imprimir, usa los botones del propio visor de PDF
(arriba a la derecha del panel oscuro). El archivo se guarda con el nombre
`Control de notas` seguido de la fecha, por ejemplo:

```
Control de notas 24-07-2026.pdf
```

El botón **Guardar** de la barra superior conserva la planilla dentro del
programa para poder reabrirla después. Es distinto de descargar el PDF.

> **Importante:** los días que escribas solo se conservan al pulsar Guardar. Si
> intentas volver al inicio con cambios pendientes, el programa te avisa. Cuando
> hay algo sin guardar, aparece `· sin guardar` en la parte superior.

## Configuración

El icono de engranaje, arriba a la derecha, abre dos ajustes.

**Tema** — cambia los colores del programa: Claro, Oscuro, o Sistema (sigue la
apariencia que tenga configurada Windows).

**Datos por defecto** — aquí escribes los datos que se repiten siempre: Apellidos
y Nombres, Dependencia, Código y Horas Semanales, más una firma por defecto. Cada
planilla nueva partirá con esos valores ya puestos.

Si dejas estos campos vacíos, cada planilla nueva empieza completamente en blanco,
sin firma. El **mes no se puede fijar aquí a propósito**, porque cambia en cada
planilla.

**Copia de seguridad** — sirve para llevarte tus planillas a otra computadora o
para no perderlas si formateas.

- **Exportar copia** genera un archivo `.json` con todas tus planillas y ajustes.
  Elige dónde guardarlo (por ejemplo, una memoria USB o tu carpeta de Documentos).
- **Importar copia** abre ese archivo y restaura todo.

> **Cuidado:** al importar se **reemplaza** todo lo que tengas en ese momento; no
> se mezclan las planillas. El programa te dirá cuántas vas a perder y cuántas vas
> a recibir antes de hacerlo, y puedes cancelar.

Todo se guarda automáticamente al escribir; no hay botón de confirmar.

## Preguntas frecuentes

**¿Dónde quedan guardadas mis planillas?**
En tu perfil de usuario de Windows, no en la carpeta del programa. Por eso siguen
ahí aunque muevas o actualices la aplicación.

**¿Puedo tener varias planillas a la vez?**
Sí, las que quieras. Se listan en *Abrir existente*.

**Voy a usar el programa en otra computadora, ¿pierdo mis planillas?**
No, si las exportas antes. En Configuración usa *Exportar copia*, lleva el archivo
`.json` a la otra computadora y ahí usa *Importar copia*.

**¿Y si necesito más de 23 días?**
No es posible: el formato oficial tiene exactamente 23 filas y el programa lo
respeta para que el PDF salga idéntico. Usa una segunda planilla.

**Borré una fila sin querer.**
No hay deshacer. Si no habías guardado, vuelve al inicio sin guardar y los cambios
se descartan.

**El PDF se descarga con un nombre raro.**
No debería: el programa fuerza el nombre `Control de notas` con la fecha. Si ves
otra cosa, revisa que estés usando el botón de descarga del visor.

---

# Parte 2 — Documentación técnica

## Stack tecnológico

| Componente | Tecnología | Versión | Rol |
|---|---|---|---|
| Entorno de escritorio | [Electron](https://electronjs.org) | 31.7.7 | Empaqueta la app web como programa nativo de Windows |
| Motor de ejecución | Node.js | 18+ | Requerido para desarrollo y compilación |
| Generación de PDF | [pdf-lib](https://pdf-lib.js.org) | 1.17.1 | Escribe texto e imágenes sobre la plantilla PDF |
| Iconografía | [Lucide](https://lucide.dev) (fuente web) | 1.26.0 | Iconos monocromáticos de la interfaz |
| Empaquetado | [electron-builder](https://www.electron.build) | 24.13.3 | Genera el instalador NSIS para Windows |
| Interfaz | HTML + CSS + JavaScript | ES2020 | Sin framework ni paso de compilación |

No se usa React, Vue ni ningún bundler. Los archivos se cargan directamente con
etiquetas `<script>`, así que **no hay proceso de build**: editar un archivo y
reiniciar la app es suficiente.

### Dependencias vendorizadas

`pdf-lib` y `Lucide` están copiados dentro de `src/vendor/` en lugar de cargarse
desde `node_modules` o un CDN. Hay dos motivos: la app funciona sin conexión, y el
bloque `build.files` de `package.json` solo empaqueta `main.js`, `preload.js`,
`src/**` y `assets/**` — cualquier cosa fuera de esas rutas no llegaría al
instalador.

## Requisitos de desarrollo

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).

## Instalación

```bash
git clone https://github.com/ryu1uga/Generador-Control-Asistencia.git
cd Generador-Control-Asistencia
npm install       # descarga Electron y las dependencias
npm start         # abre la aplicación
```

### Generar el instalador

```bash
npm run dist          # compila para el sistema donde lo ejecutas
npm run dist:win      # fuerza Windows
npm run dist:mac      # fuerza macOS (solo funciona en una Mac)
```

| Sistema | Resultado en `dist/` |
|---|---|
| Windows | `Control-Asistencia-Setup-1.0.0.exe` (instalador NSIS) |
| macOS | `Control-Asistencia-1.0.0-x64.dmg` y `-arm64.dmg` |

**El empaquetado de macOS solo puede hacerse desde una Mac.** electron-builder
necesita herramientas del propio sistema, así que `dist:mac` fallará en Windows.
Si no tienes acceso a una, GitHub Actions ofrece máquinas macOS gratuitas para
repositorios públicos.

### Distribución sin firma digital

Ninguno de los dos instaladores está firmado, y cada sistema reacciona distinto:

- **Windows** muestra SmartScreen (*"Windows protegió su PC"*). Se continúa con
  **Más información** → **Ejecutar de todas formas**.
- **macOS** es más estricto: dice que la app *"está dañada"*, lo cual es
  engañoso. Se abre con clic derecho → **Abrir**, o quitando la marca de
  cuarentena con `xattr -dr com.apple.quarantine "/Applications/Control de Asistencia.app"`.

Evitarlo requiere un certificado de firma (Windows) o una cuenta de Apple
Developer y notarización (macOS).

> Si `npm install` termina pero la app no arranca con el error *"Electron failed
> to install correctly"*, el binario de Electron se descargó a medias. Borra
> `node_modules/electron` y la caché en `%LOCALAPPDATA%\electron\Cache`, luego
> reinstala.

## Arquitectura

Electron separa el código en dos procesos que no comparten memoria:

```
┌─ Proceso principal (main.js) ──────────────┐
│  Ventana, sistema de archivos, descargas   │
└──────────────────┬─────────────────────────┘
                   │  IPC (canales nombrados)
┌──────────────────┴─────────────────────────┐
│  preload.js — puente seguro                │
│  expone window.api con 3 funciones         │
└──────────────────┬─────────────────────────┘
┌──────────────────┴─────────────────────────┐
│  Renderer (src/) — interfaz y lógica       │
│  index.html · renderer.js · pdf.js         │
└────────────────────────────────────────────┘
```

El renderer corre con `contextIsolation: true` y `nodeIntegration: false`, así que
no tiene acceso directo a Node. Todo pasa por los tres canales de `preload.js`:

| Canal | Dirección | Qué hace |
|---|---|---|
| `get-template` | renderer → main | Devuelve `assets/template.pdf` en base64 |
| `load-data` | renderer → main | Lee las planillas y ajustes guardados |
| `save-data` | renderer → main | Escribe las planillas y ajustes |
| `export-backup` | renderer → main | Diálogo de guardado y escritura del `.json` de copia |
| `import-backup` | renderer → main | Diálogo de apertura y lectura del `.json` de copia |

## Cómo se genera el PDF

La app **no dibuja el formulario**. Usa el PDF oficial en blanco
(`assets/template.pdf`) como fondo y escribe encima en coordenadas exactas.

`src/coords.js` guarda esas coordenadas, extraídas midiendo el PDF original:

- Página A4 horizontal de **841.92 × 595.32 puntos**.
- Centro horizontal de cada columna (`COLS`).
- Banda vertical de la tabla: de 172.8 a 538.1, dividida en **23 filas** de
  ≈15.88 puntos cada una.
- `rowCenterTop(i)` devuelve el centro vertical de la fila *i*.

`src/pdf.js` carga la plantilla, calcula la posición y estampa cada valor con
pdf-lib. Como el origen de coordenadas de pdf-lib está abajo a la izquierda y las
medidas se tomaron desde arriba, la conversión es `y = alto − top − desplazamiento`.

> Si alguna vez se reemplaza `assets/template.pdf` por otra versión del formato,
> hay que volver a medir y actualizar `coords.js`, o el texto caerá fuera de las
> casillas.

## Estructura de archivos

```
Generador-Control-Asistencia/
├─ package.json          Dependencias y configuración de empaquetado
├─ main.js               Proceso principal: ventana, IPC, nombre de descargas
├─ preload.js            Puente seguro renderer ↔ main (window.api)
├─ assets/
│  └─ template.pdf       Formato oficial en blanco (sin anotaciones)
├─ assets/
│  ├─ icon.svg           Fuente del icono (48px en adelante)
│  ├─ icon-small.svg     Variante simplificada (16–32px)
│  ├─ icon.ico           Icono de Windows (7 resoluciones)
│  └─ icon.icns          Icono de macOS (10 resoluciones)
└─ src/
   ├─ index.html         Marcado: inicio, editor y modal de configuración
   ├─ style.css          Estilos y variables de tema (claro / oscuro)
   ├─ coords.js          Coordenadas medidas del PDF oficial
   ├─ pdf.js             Generación del PDF sobre la plantilla
   ├─ renderer.js        Lógica de interfaz, planillas y ajustes
   └─ vendor/
      ├─ pdf-lib.min.js
      └─ icons/          Fuente Lucide (lucide.css + lucide.woff2)
```

## Almacenamiento

Todo se guarda en un único JSON dentro de la carpeta `userData` de Electron:

| Sistema | Ruta |
|---|---|
| Windows | `%APPDATA%\Control de Asistencia\control-asistencia-data.json` |
| macOS | `~/Library/Application Support/Control de Asistencia/control-asistencia-data.json` |


```jsonc
{
  "sheets": [                    // planillas guardadas
    {
      "name": "Control de notas 24-07-2026",
      "header": { "nombres": "...", "dependencia": "...", "codigo": "...",
                  "mes": "...", "horasSemanales": "..." },
      "rows": [                  // siempre 23 posiciones
        { "fecha": "24-07-2026", "ingreso": "08:00", "salidaRef": "13:00",
          "retorno": "14:00", "salidaFinal": "17:00", "tiempo": "8" }
      ],
      "signature": { "method": "draw", "dataUrl": "data:image/png;base64,...",
                     "text": "" },
      "savedAt": "2026-07-24T21:00:00.000Z"
    }
  ],
  "settings": {
    "theme": "system",           // "light" | "dark" | "system"
    "defaults": {                // valores de cada planilla nueva (sin mes)
      "nombres": "", "dependencia": "", "codigo": "", "horasSemanales": "",
      "signature": { "method": "none", "dataUrl": null, "text": "" }
    }
  }
}
```

Cambiar el `productName` de `package.json` mueve esta carpeta y las planillas
dejarían de aparecer. Si se renombra el producto, hay que migrar el archivo.

### Formato de la copia de seguridad

*Exportar copia* escribe el mismo contenido dentro de un envoltorio con metadatos:

```jsonc
{
  "app": "control-asistencia",
  "formato": 1,
  "exportadoEl": "2026-07-24T21:00:00.000Z",
  "datos": { "sheets": [ /* ... */ ], "settings": { /* ... */ } }
}
```

Al importar, `extraerDatos()` acepta tanto ese envoltorio como un archivo de datos
plano, y rechaza cualquier JSON que no tenga `sheets` como arreglo. La importación
**reemplaza** el estado completo; no fusiona planillas.

## Detalles de implementación

**Temas.** Los colores viven en variables CSS bajo `:root` y `[data-theme="dark"]`.
La paleta procede de la web institucional de la Universidad de Lima (naranja
`#F26F21`). Como ese naranja con texto blanco solo alcanza 2.97:1 de contraste
—por debajo del mínimo AA de 4.5:1— los botones rellenos usan un naranja más
oscuro (`#BF530A`, 4.71:1) y el de marca se reserva para logo, bordes e iconos.

**Vista previa.** Se regenera 400 ms después del último cambio y solo mientras el
editor está visible. Cada PDF se sirve como blob y el anterior se libera con
`URL.revokeObjectURL` para no acumular memoria.

**Nombre de la descarga.** El visor de PDF incrustado nombraría el archivo con un
identificador de blob, así que `main.js` intercepta el evento `will-download` de
Electron y fuerza `Control de notas DD-MM-YYYY.pdf`.

**Filas.** Siempre son 23, tantas como el formato. Eliminar una desplaza las
siguientes hacia arriba y añade una vacía al final; reordenar mueve el objeto
dentro del arreglo y vuelve a pintar la tabla, en lugar de mover nodos del DOM.

**Formatos de hora aceptados.** `parseTime()` entiende `09:00`, `9`, `0900` y
`9.5` (decimal de hora). Al salir del campo, el valor se normaliza a `HH:mm`.

**Meses de la cabecera.** `leerPeriodos()` normaliza el texto (minúsculas y sin
tildes) y busca las formas de `MESES`, que incluyen abreviaturas y la grafía
`setiembre`. Devuelve los meses en orden de aparición; si la secuencia retrocede
—`Diciembre - Enero`— asume cruce de año e incrementa el año. `fechaSugerida()`
usa eso para preposicionar el calendario. El `<input type="date">` nativo solo
puede abrirse en **un** mes, así que en periodos compuestos se elige mirando la
primera fila con fecha por encima de la actual.

**Diferencias entre sistemas.** `main.js` concentra las ramas en la constante
`esMac`. En Windows la barra de menús se oculta y el icono se toma del `.ico`; en
macOS la barra es global —no se puede ocultar por ventana—, así que se instala un
menú mínimo en español, el icono lo aporta el paquete `.app`, y cerrar la última
ventana no cierra la aplicación, como manda la convención del sistema.

**Iconos.** Ambos formatos se generan desde los mismos SVG. El `.ico` y el `.icns`
incluyen dos diseños distintos: el detallado a partir de 48px y uno simplificado
en 16–32px, porque a esos tamaños las tres filas de la hoja se vuelven ilegibles.
