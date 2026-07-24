// renderer.js — Lógica de la interfaz
(function () {
  const ROWS = window.COORDS.ROWS; // 23
  const $ = (id) => document.getElementById(id);

  // Estado en memoria
  let store = { header: {}, sheets: [] }; // persistente
  let current = null; // planilla en edición

  // ---------------- Utilidades de tiempo ----------------
  function parseTime(v) {
    if (!v) return null;
    v = String(v).trim();
    let m = v.match(/^(\d{1,2}):(\d{2})$/);
    if (m) return (+m[1]) * 60 + (+m[2]);
    m = v.match(/^(\d{1,2})\.(\d{1,2})$/); // 9.5 = 9h30
    if (m) return Math.round((+m[1]) * 60 + (+('0.' + m[2])) * 60);
    m = v.match(/^(\d{1,2})$/); // "9" -> 09:00
    if (m) return (+m[1]) * 60;
    m = v.match(/^(\d{2})(\d{2})$/); // "0900"
    if (m) return (+m[1]) * 60 + (+m[2]);
    return null;
  }

  function fmtHours(mins) {
    if (mins == null || mins <= 0) return '';
    const h = mins / 60;
    return Number.isInteger(h) ? String(h) : h.toFixed(1);
  }

  function computeRowHours(r) {
    const ing = parseTime(r.ingreso);
    const fin = parseTime(r.salidaFinal);
    if (ing == null || fin == null) return '';
    let worked = fin - ing;
    const sr = parseTime(r.salidaRef);
    const rt = parseTime(r.retorno);
    if (sr != null && rt != null) worked -= (rt - sr);
    return fmtHours(worked);
  }

  // ---------------- Conversión de formatos para pickers ----------------
  // Texto de fecha (dd-mm-yyyy, dd/mm/yyyy, etc.) -> ISO (yyyy-mm-dd) para el <input type="date">
  function textDateToISO(txt) {
    if (!txt) return '';
    const m = String(txt).trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (!m) return '';
    let [, d, mo, y] = m;
    if (y.length === 2) y = '20' + y;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // ISO (yyyy-mm-dd) del picker -> texto en el formato de la app (dd-mm-yyyy)
  function isoToTextDate(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
  }
  // minutos -> HH:mm para el <input type="time">
  function minsToHHMM(mins) {
    if (mins == null) return '';
    const h = Math.floor(mins / 60), mm = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // ---------------- Construcción de la tabla ----------------
  const FIELDS = ['fecha', 'ingreso', 'salidaRef', 'retorno', 'salidaFinal'];
  const TIME_FIELDS = ['ingreso', 'salidaRef', 'retorno', 'salidaFinal'];

  function buildTable() {
    const body = $('rowsBody');
    body.innerHTML = '';
    for (let i = 0; i < ROWS; i++) {
      const tr = document.createElement('tr');
      tr.dataset.rowindex = i;
      tr.innerHTML =
        `<td class="col-num"><span class="drag-handle" title="Arrastra para reordenar">⋮⋮</span></td>` +
        FIELDS.map(f => {
          if (f === 'fecha') {
            // Fecha: campo de texto + botón de calendario
            return `<td class="col-fecha"><div class="dt-cell">` +
              `<input class="dt-text" data-row="${i}" data-field="${f}" type="text" />` +
              `<input class="dt-native" data-row="${i}" data-field="${f}" type="date" tabindex="-1" aria-hidden="true" />` +
              `<button type="button" class="dt-pick" title="Elegir fecha">📅</button>` +
              `</div></td>`;
          }
          // Horas: solo campo de texto (se autoformatea a HH:mm)
          return `<td class="col-hora"><input data-row="${i}" data-field="${f}" type="text" /></td>`;
        }).join('') +
        `<td class="calc col-horas"><input data-row="${i}" data-field="tiempo" type="text" placeholder="—" /></td>` +
        `<td class="col-del"><button type="button" class="row-del" title="Eliminar fila">✕</button></td>`;
      body.appendChild(tr);
    }
    body.addEventListener('input', onCellInput);
    body.addEventListener('click', onRowButtons);
    body.addEventListener('change', onNativeChange);
    // Autoformatea las horas cuando el campo pierde el foco (8 -> 08:00)
    body.addEventListener('focusout', onTimeBlur);
    initRowDrag(body);
  }

  // ---------------- Reordenar filas con drag ----------------
  let dragFrom = null;

  function initRowDrag(body) {
    // El <tr> solo se vuelve arrastrable al presionar el asa, para no
    // interferir con la selección de texto dentro de los inputs.
    body.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.drag-handle');
      const tr = e.target.closest('tr');
      if (tr) tr.draggable = !!handle;
    });

    body.addEventListener('dragstart', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || !tr.draggable) return;
      dragFrom = +tr.dataset.rowindex;
      tr.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(dragFrom)); // requerido por Firefox
    });

    body.addEventListener('dragover', (e) => {
      if (dragFrom == null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const tr = e.target.closest('tr');
      body.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
      if (tr && +tr.dataset.rowindex !== dragFrom) tr.classList.add('drop-target');
    });

    body.addEventListener('drop', (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      if (tr && dragFrom != null) moveRow(dragFrom, +tr.dataset.rowindex);
      cleanupDrag(body);
    });

    body.addEventListener('dragend', () => cleanupDrag(body));
  }

  function cleanupDrag(body) {
    dragFrom = null;
    body.querySelectorAll('.dragging, .drop-target')
      .forEach(el => el.classList.remove('dragging', 'drop-target'));
    body.querySelectorAll('tr').forEach(tr => { tr.draggable = false; });
  }

  // Clicks dentro de la tabla: calendario 📅 o eliminar fila ✕
  function onRowButtons(e) {
    const del = e.target.closest('.row-del');
    if (del) {
      deleteRow(+del.closest('tr').dataset.rowindex);
      return;
    }
    onPickClick(e);
  }

  // Abre el calendario nativo al pulsar el botón 📅
  function onPickClick(e) {
    const btn = e.target.closest('.dt-pick');
    if (!btn) return;
    const cell = btn.closest('.dt-cell');
    const textEl = cell.querySelector('.dt-text');
    const nativeEl = cell.querySelector('.dt-native');
    nativeEl.value = textDateToISO(textEl.value); // precarga lo escrito a mano
    if (typeof nativeEl.showPicker === 'function') {
      nativeEl.showPicker();
    } else {
      nativeEl.focus();
      nativeEl.click();
    }
  }

  // Cuando el usuario elige una fecha en el calendario, la vuelca al campo de texto
  function onNativeChange(e) {
    const nativeEl = e.target.closest('.dt-native');
    if (!nativeEl || !nativeEl.value) return;
    const textEl = nativeEl.closest('.dt-cell').querySelector('.dt-text');
    textEl.value = isoToTextDate(nativeEl.value);
    textEl.dispatchEvent(new Event('input', { bubbles: true })); // recalcula y autosave
  }

  // Convierte lo escrito en una hora a HH:mm (8 -> 08:00, 9.5 -> 09:30, 0900 -> 09:00)
  function onTimeBlur(e) {
    const el = e.target;
    if (!el.dataset || !TIME_FIELDS.includes(el.dataset.field)) return;
    const raw = el.value.trim();
    if (!raw) return;
    const mins = parseTime(raw);
    if (mins == null) return;
    const hhmm = minsToHHMM(mins);
    if (hhmm !== raw) {
      el.value = hhmm;
      el.dispatchEvent(new Event('input', { bubbles: true })); // guarda el valor normalizado
    }
  }

  let tiempoManual = {}; // filas donde el usuario sobrescribió las horas

  function onCellInput(e) {
    const el = e.target;
    if (!el.dataset.field) return;
    if (el.classList.contains('dt-native')) return; // el picker se maneja en onNativeChange
    const i = +el.dataset.row;
    const f = el.dataset.field;
    if (!current.rows[i]) current.rows[i] = {};
    current.rows[i][f] = el.value;

    if (f === 'tiempo') {
      tiempoManual[i] = el.value.trim() !== '';
    } else if (!tiempoManual[i]) {
      const auto = computeRowHours(current.rows[i]);
      current.rows[i].tiempo = auto;
      const tEl = document.querySelector(`input[data-row="${i}"][data-field="tiempo"]`);
      if (tEl) tEl.value = auto;
    }
    scheduleAutosaveHeader();
  }

  function renderRows() {
    for (let i = 0; i < ROWS; i++) {
      const r = current.rows[i] || {};
      [...FIELDS, 'tiempo'].forEach(f => {
        const el = document.querySelector(`input[data-row="${i}"][data-field="${f}"]`);
        if (el) el.value = r[f] || '';
      });
      tiempoManual[i] = false;
    }
    scheduleLivePreview(); // cambios estructurales (nueva/cargar/autollenar/limpiar)
  }

  // ---------------- Cabecera ----------------
  const HEADER_IDS = ['nombres', 'dependencia', 'codigo', 'mes', 'horasSemanales'];

  function readHeader() {
    const h = {};
    HEADER_IDS.forEach(id => h[id] = $(id).value.trim());
    return h;
  }
  function writeHeader(h) {
    HEADER_IDS.forEach(id => $(id).value = (h && h[id]) || '');
  }

  let autosaveTimer = null;
  function scheduleAutosaveHeader() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      store.header = readHeader();          // recuerda la cabecera globalmente
      store.header.signature = getSignature();
      persist();
    }, 500);
    scheduleLivePreview(); // refresca la vista previa al cambiar cabecera/celdas/firma
  }

  // ---------------- Firma ----------------
  let sigDataUrl = null;

  function getSignature() {
    return { method: $('sigMethod').value, dataUrl: sigDataUrl, text: $('sigText').value.trim() };
  }
  function applySignatureUI() {
    const m = $('sigMethod').value;
    $('sigImageBox').classList.toggle('hidden', m !== 'image');
    $('sigDrawBox').classList.toggle('hidden', m !== 'draw');
    $('sigTextBox').classList.toggle('hidden', m !== 'text');
    const showPrev = (m === 'image' || m === 'draw') && sigDataUrl;
    $('sigPreview').classList.toggle('hidden', !showPrev);
    if (showPrev) $('sigPreviewImg').src = sigDataUrl;
  }

  function initSignature() {
    $('sigMethod').addEventListener('change', () => { applySignatureUI(); scheduleAutosaveHeader(); });
    $('sigText').addEventListener('input', scheduleAutosaveHeader);
    $('sigFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { sigDataUrl = reader.result; applySignatureUI(); scheduleAutosaveHeader(); };
      reader.readAsDataURL(file);
    });
    initCanvas();
    $('btnClearSig').addEventListener('click', () => {
      const c = $('sigCanvas'); c.getContext('2d').clearRect(0, 0, c.width, c.height);
      sigDataUrl = null; applySignatureUI(); scheduleAutosaveHeader();
    });
  }

  function initCanvas() {
    const c = $('sigCanvas');
    const ctx = c.getContext('2d');
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    let drawing = false;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    c.addEventListener('mousedown', (e) => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    c.addEventListener('mousemove', (e) => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    window.addEventListener('mouseup', () => {
      if (!drawing) return; drawing = false;
      sigDataUrl = c.toDataURL('image/png'); applySignatureUI(); scheduleAutosaveHeader();
    });
  }

  // ---------------- Planillas (persistencia) ----------------
  function persist() { window.api.saveData(store); }

  function refreshSheetSelect() {
    const sel = $('sheetSelect');
    sel.innerHTML = '';
    store.sheets.forEach((s, idx) => {
      const o = document.createElement('option');
      o.value = idx; o.textContent = s.name || `Planilla ${idx + 1}`;
      sel.appendChild(o);
    });
    if (current && current._idx != null) sel.value = current._idx;
  }

  function newSheet() {
    current = {
      name: '',
      header: Object.assign({}, store.header),
      rows: [],
      _idx: null
    };
    delete current.header.signature;
    writeHeader(current.header);
    // restaura firma global
    if (store.header && store.header.signature) {
      const s = store.header.signature;
      $('sigMethod').value = s.method || 'none';
      sigDataUrl = s.dataUrl || null;
      $('sigText').value = s.text || '';
    }
    applySignatureUI();
    for (let i = 0; i < ROWS; i++) current.rows[i] = {};
    renderRows();
    toast('Nueva planilla');
  }

  function saveSheet() {
    current.header = readHeader();
    current.signature = getSignature();
    // nombre por defecto
    if (!current.name) {
      current.name = (current.header.mes || 'Planilla') + ' — ' + new Date().toLocaleDateString('es-PE');
    }
    current.savedAt = new Date().toISOString();
    if (current._idx == null) {
      current._idx = store.sheets.length;
      store.sheets.push(current);
    } else {
      store.sheets[current._idx] = current;
    }
    store.header = Object.assign({}, current.header, { signature: current.signature });
    persist();
    refreshSheetSelect();
    toast('Planilla guardada');
  }

  function loadSheet(idx) {
    const s = store.sheets[idx];
    if (!s) return;
    current = JSON.parse(JSON.stringify(s));
    current._idx = idx;
    writeHeader(current.header);
    const sig = current.signature || {};
    $('sigMethod').value = sig.method || 'none';
    sigDataUrl = sig.dataUrl || null;
    $('sigText').value = sig.text || '';
    applySignatureUI();
    if (!current.rows) current.rows = [];
    for (let i = 0; i < ROWS; i++) if (!current.rows[i]) current.rows[i] = {};
    renderRows();
  }

  function deleteSheet() {
    if (current._idx == null) { newSheet(); return; }
    if (!confirm('¿Eliminar esta planilla guardada?')) return;
    store.sheets.splice(current._idx, 1);
    persist();
    refreshSheetSelect();
    if (store.sheets.length) loadSheet(0); else newSheet();
    toast('Planilla eliminada');
  }

  // ---------------- Operaciones sobre filas ----------------
  // Elimina una fila: las de abajo suben y se mantiene el total de 23 ranuras
  function deleteRow(i) {
    current.rows.splice(i, 1);
    current.rows.push({});
    while (current.rows.length < ROWS) current.rows.push({});
    tiempoManual = {};
    renderRows();
    scheduleAutosaveHeader();
  }

  // Mueve la fila `from` a la posición `to` (reordenar por drag)
  function moveRow(from, to) {
    if (from === to || from == null || to == null) return;
    const [moved] = current.rows.splice(from, 1);
    current.rows.splice(to, 0, moved);
    while (current.rows.length < ROWS) current.rows.push({});
    tiempoManual = {};
    renderRows();
    scheduleAutosaveHeader();
  }

  function clearRows() {
    if (!confirm('¿Limpiar todas las filas?')) return;
    for (let i = 0; i < ROWS; i++) current.rows[i] = {};
    tiempoManual = {};
    renderRows();
  }

  // ---------------- PDF ----------------
  function currentSheetForPdf() {
    current.header = readHeader();
    current.signature = getSignature();
    return current;
  }

  async function buildBytes() {
    return await PDFGen.build(currentSheetForPdf());
  }

  let lastBlobUrl = null;
  async function preview() {
    const bytes = await buildBytes();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    $('previewEmpty').classList.add('hidden');
    $('pdfFrame').src = url;
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl); // libera el anterior
    lastBlobUrl = url;
  }

  // Vista previa automática (con retraso para no regenerar el PDF en cada tecla)
  let previewTimer = null;
  function scheduleLivePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => { preview().catch(() => {}); }, 400);
  }

  // ---------------- Toast ----------------
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
  }

  // ---------------- Init ----------------
  async function init() {
    buildTable();
    initSignature();

    // Botones
    $('btnNew').addEventListener('click', newSheet);
    $('btnSave').addEventListener('click', saveSheet);
    $('btnDelete').addEventListener('click', deleteSheet);
    $('btnClearRows').addEventListener('click', clearRows);
    $('sheetSelect').addEventListener('change', (e) => loadSheet(+e.target.value));
    HEADER_IDS.forEach(id => $(id).addEventListener('input', scheduleAutosaveHeader));

    // Carga persistencia
    store = await window.api.loadData();
    if (!store.header) store.header = {};
    if (!store.sheets) store.sheets = [];

    refreshSheetSelect();
    if (store.sheets.length) {
      loadSheet(store.sheets.length - 1);
      $('sheetSelect').value = current._idx;
    } else {
      newSheet();
    }
    // aplica firma guardada globalmente si es planilla nueva
    if (current._idx == null && store.header.signature) {
      const s = store.header.signature;
      $('sigMethod').value = s.method || 'none';
      sigDataUrl = s.dataUrl || null;
      $('sigText').value = s.text || '';
      applySignatureUI();
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
