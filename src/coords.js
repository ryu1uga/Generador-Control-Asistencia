// coords.js — Coordenadas exactas extraídas del PDF plantilla original.
// El PDF mide 841.92 x 595.32 pt (A4 horizontal). pdf-lib usa origen abajo-izquierda.
// Las anclas de cabecera se dan en "top" (distancia desde el borde superior) y se
// convierten a la coordenada de pdf-lib con: y = PAGE.H - top - baselineOffset.

window.COORDS = (function () {
  const PAGE = { W: 841.92, H: 595.32 };

  // --- Cabecera ---  (x = inicio del texto ; top = línea superior del texto)
  // Los valores se escriben sobre los subrayados del formulario:
  //   fila 1 (nombres/código/mes) subrayado en top=82.5
  //   fila 2 (dependencia/horas)  subrayado en top=101.2
  const HEADER = {
    nombres:      { x: 163, top: 74.0,  size: 9,  maxW: 250 },
    codigo:       { x: 490, top: 74.0,  size: 9,  maxW: 90  },
    mes:          { x: 652, top: 74.0,  size: 9,  maxW: 92  },
    dependencia:  { x: 163, top: 92.5,  size: 9,  maxW: 250 },
    horasSemanales:{ x: 652, top: 92.5, size: 9,  maxW: 92  }
  };

  // --- Tabla ---
  // Centros X de cada columna
  const COLS = {
    fecha:       60,
    ingreso:     126,
    firmaIngreso:208,
    salidaRef:   289,
    firmaSalidaRef: 371,
    retorno:     451,
    firmaRetorno:533,
    salidaFinal: 615,
    firmaSalidaFinal: 697,
    tiempo:      778
  };

  // Banda vertical de las filas
  const ROWBAND_TOP = 172.8;     // línea superior de la primera fila
  const ROWBAND_BOTTOM = 538.1;  // línea inferior de la última fila
  const ROWS = 23;
  const ROW_H = (ROWBAND_BOTTOM - ROWBAND_TOP) / ROWS; // ≈ 15.88

  // Devuelve el centro vertical (top-down) de la fila i (0..22)
  function rowCenterTop(i) {
    return ROWBAND_TOP + (i + 0.5) * ROW_H;
  }

  // Tamaño máximo para estampar una firma dentro de una celda
  const SIG = { maxW: 90, maxH: 13 };

  return { PAGE, HEADER, COLS, ROWBAND_TOP, ROWBAND_BOTTOM, ROWS, ROW_H, rowCenterTop, SIG };
})();
