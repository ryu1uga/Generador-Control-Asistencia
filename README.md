# Registro de Control de Asistencia

Aplicativo de escritorio (Electron) para llenar de forma digital el **Registro de
Control de Asistencia** y generar/imprimir un PDF **idéntico** al formato oficial,
con tus datos.

## Cómo funciona

La app usa el PDF oficial en blanco (`assets/template.pdf`) como plantilla y
superpone tus datos en las coordenadas exactas de cada celda con `pdf-lib`. El
resultado impreso es visualmente igual al formulario original.

- **Cabecera**: Apellidos y Nombres, Dependencia, Código, Mes, Horas Semanales.
- **Tabla (23 filas)**: Fecha, Hora Ingreso, Salida a refrigerio, Retorno,
  Salida final y **Tiempo Acumulado** (se calcula solo).
- **Cálculo automático de horas**: `(Salida final − Ingreso) − (Retorno − Salida
  refrigerio)`. Puedes sobrescribir el valor escribiéndolo manualmente. Acepta
  formatos `09:00`, `9`, `0900` o `9.5`.
- **Entrada de datos asistida**: cada fila tiene un calendario 📅 para elegir la
  fecha, y las horas se normalizan solas al salir del campo (`8` → `08:00`).
- **Filas ordenables**: arrastra el asa ⋮⋮ para reordenar una fila y usa ✕ para
  eliminarla (las siguientes suben y se mantienen las 23 ranuras del formato).
- **Vista previa en vivo**: el PDF de la derecha se regenera solo al escribir; se
  descarga o imprime con los botones del propio visor.
- **Firma**: elige el método que prefieras
  - *Dejar en blanco* (firmar a mano tras imprimir)
  - *Imagen* (subes un PNG/JPG de tu firma)
  - *Dibujar en pantalla* (con el mouse)
  - *Texto* (tu nombre)
  La firma se estampa automáticamente en cada celda "Firma" donde haya una hora
  registrada.
- **Guardado**: la cabecera se recuerda entre sesiones y cada planilla se guarda
  para reabrirla o reimprimirla (selector "Planillas guardadas" arriba).

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).

## Instalar y ejecutar (modo desarrollo)

```bash
cd control-asistencia
npm install       # descarga Electron
npm start         # abre la aplicación
```

## Generar un instalador .exe para Windows

```bash
npm run dist
```

El instalador queda en la carpeta `dist/` (`Control-Asistencia-Setup-1.0.0.exe`).

## Uso rápido

1. Completa la cabecera (se guarda automáticamente).
2. Configura tu firma en la sección **Firma**.
3. Llena la tabla: elige la fecha con 📅 y escribe las horas (`8` se convierte en
   `08:00`). Reordena con ⋮⋮ y elimina filas con ✕.
4. La **vista previa** de la derecha se actualiza sola mientras escribes.
5. Descarga o imprime con los botones del visor de PDF. El archivo se guarda como
   `Control de notas DD-MM-YYYY.pdf`.
6. **Guardar** conserva la planilla en el selector superior.

## Estructura

```
control-asistencia/
├─ package.json
├─ main.js            Proceso principal (ventana, guardado, impresión)
├─ preload.js         Puente seguro renderer ↔ main
├─ assets/
│  └─ template.pdf    PDF oficial en blanco (plantilla)
└─ src/
   ├─ index.html      Interfaz
   ├─ style.css       Estilos
   ├─ coords.js       Coordenadas exactas extraídas del PDF
   ├─ pdf.js          Generación del PDF sobre la plantilla
   ├─ renderer.js     Lógica de la interfaz
   └─ vendor/
      └─ pdf-lib.min.js
```

## Notas

- La plantilla original traía datos de muestra incrustados como anotaciones; la
  app los elimina automáticamente al generar cada PDF, dejando el formulario limpio.
- Los datos se guardan en el perfil del usuario (carpeta `userData` de Electron),
  no en la carpeta de la app.
