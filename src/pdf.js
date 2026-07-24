// pdf.js — Genera el PDF final superponiendo los datos sobre la plantilla en blanco.
// Usa pdf-lib (UMD, cargado por <script>) y las coordenadas de coords.js.

const PDFGen = (function () {
  const { PDFDocument, StandardFonts, rgb, PDFName } = PDFLib;
  const C = window.COORDS;
  const H = C.PAGE.H;

  let templateBytesCache = null;

  // "Control de notas DD-MM-YYYY" — fecha en que se genera el documento
  function docName() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `Control de notas ${dd}-${mm}-${d.getFullYear()}`;
  }

  async function getTemplateBytes() {
    if (templateBytesCache) return templateBytesCache;
    const b64 = await window.api.getTemplate();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    templateBytesCache = bytes;
    return bytes;
  }

  // Dibuja texto centrado horizontalmente en cx, con baseline calculada desde "top-center".
  function drawCentered(page, font, text, cx, centerTop, size) {
    if (text === undefined || text === null || String(text).trim() === '') return;
    const t = String(text);
    const w = font.widthOfTextAtSize(t, size);
    const y = H - centerTop - size * 0.35; // baseline para centrar verticalmente
    page.drawText(t, { x: cx - w / 2, y, size, font, color: rgb(0, 0, 0) });
  }

  // Dibuja texto alineado a la izquierda con baseline desde "top".
  function drawLeft(page, font, text, x, top, size) {
    if (!text || String(text).trim() === '') return;
    page.drawText(String(text), {
      x, y: H - top - size * 0.85, size, font, color: rgb(0, 0, 0)
    });
  }

  async function embedSignature(pdfDoc, dataUrl) {
    if (!dataUrl) return null;
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (dataUrl.indexOf('image/png') !== -1) return await pdfDoc.embedPng(bytes);
    return await pdfDoc.embedJpg(bytes);
  }

  function drawSigInCell(page, img, cx, centerTop) {
    if (!img) return;
    const scale = Math.min(C.SIG.maxW / img.width, C.SIG.maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const cy = H - centerTop;
    page.drawImage(img, { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
  }

  // sheet = { header:{...}, rows:[{fecha,ingreso,salidaRef,retorno,salidaFinal,tiempo}], signature:{method,dataUrl,text} }
  async function build(sheet) {
    const tpl = await getTemplateBytes();
    const pdfDoc = await PDFDocument.load(tpl);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Título del documento (lo muestra el visor y ayuda al nombrar la descarga)
    pdfDoc.setTitle(docName());

    // La plantilla trae datos de muestra incrustados como anotaciones.
    // Se eliminan todas para partir de un formulario limpio.
    page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([]));

    const h = sheet.header || {};
    // Cabecera
    drawLeft(page, font, h.nombres, C.HEADER.nombres.x, C.HEADER.nombres.top, C.HEADER.nombres.size);
    drawLeft(page, font, h.codigo, C.HEADER.codigo.x, C.HEADER.codigo.top, C.HEADER.codigo.size);
    drawLeft(page, font, h.mes, C.HEADER.mes.x, C.HEADER.mes.top, C.HEADER.mes.size);
    drawLeft(page, font, h.dependencia, C.HEADER.dependencia.x, C.HEADER.dependencia.top, C.HEADER.dependencia.size);
    drawLeft(page, font, h.horasSemanales, C.HEADER.horasSemanales.x, C.HEADER.horasSemanales.top, C.HEADER.horasSemanales.size);

    // Firma (imagen / dibujo)
    const sig = sheet.signature || {};
    let sigImg = null;
    if ((sig.method === 'image' || sig.method === 'draw') && sig.dataUrl) {
      sigImg = await embedSignature(pdfDoc, sig.dataUrl);
    }

    // Filas
    const rows = sheet.rows || [];
    for (let i = 0; i < rows.length && i < C.ROWS; i++) {
      const r = rows[i] || {};
      const ct = C.rowCenterTop(i);
      const size = 8.5;

      drawCentered(page, font, r.fecha, C.COLS.fecha, ct, size);
      drawCentered(page, font, r.ingreso, C.COLS.ingreso, ct, size);
      drawCentered(page, font, r.salidaRef, C.COLS.salidaRef, ct, size);
      drawCentered(page, font, r.retorno, C.COLS.retorno, ct, size);
      drawCentered(page, font, r.salidaFinal, C.COLS.salidaFinal, ct, size);
      drawCentered(page, font, r.tiempo, C.COLS.tiempo, ct, size);

      // Firmas: una por cada tiempo registrado
      const put = (present, col) => {
        if (!present) return;
        if (sig.method === 'image' || sig.method === 'draw') {
          drawSigInCell(page, sigImg, col, ct);
        } else if (sig.method === 'text' && sig.text) {
          drawCentered(page, font, sig.text, col, ct, 7.5);
        }
      };
      put(r.ingreso, C.COLS.firmaIngreso);
      put(r.salidaRef, C.COLS.firmaSalidaRef);
      put(r.retorno, C.COLS.firmaRetorno);
      put(r.salidaFinal, C.COLS.firmaSalidaFinal);
    }

    return await pdfDoc.save();
  }

  return { build };
})();
