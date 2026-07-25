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
        `<td class="col-num"><span class="drag-handle" title="Arrastra para reordenar"><i class="icon-grip-vertical"></i></span></td>` +
        FIELDS.map(f => {
          if (f === 'fecha') {
            // Fecha: campo de texto + botón de calendario
            return `<td class="col-fecha"><div class="dt-cell">` +
              `<input class="dt-text" data-row="${i}" data-field="${f}" type="text" />` +
              `<input class="dt-native" data-row="${i}" data-field="${f}" type="date" tabindex="-1" aria-hidden="true" />` +
              `<button type="button" class="dt-pick" title="Elegir fecha"><i class="icon-calendar"></i></button>` +
              `</div></td>`;
          }
          // Horas: solo campo de texto (se autoformatea a HH:mm)
          return `<td class="col-hora"><input data-row="${i}" data-field="${f}" type="text" /></td>`;
        }).join('') +
        `<td class="calc col-horas"><input data-row="${i}" data-field="tiempo" type="text" placeholder="—" /></td>` +
        `<td class="col-del"><button type="button" class="row-del" title="Eliminar fila"><i class="icon-x"></i></button></td>`;
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

  // Clicks dentro de la tabla: abrir calendario o eliminar fila
  function onRowButtons(e) {
    const del = e.target.closest('.row-del');
    if (del) {
      deleteRow(+del.closest('tr').dataset.rowindex);
      return;
    }
    onPickClick(e);
  }

  // Abre el calendario nativo al pulsar el botón de la celda de fecha
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

  // Cualquier edición del editor: marca cambios pendientes y refresca el PDF.
  // La cabecera ya no se recuerda sola; sus valores iniciales salen de
  // Configuración y lo demás se conserva al pulsar Guardar.
  function scheduleAutosaveHeader() {
    marcarSinGuardar();
    scheduleLivePreview();
  }

  // ---------------- Firma ----------------
  // Control reutilizable: el mismo bloque sirve para la planilla ('sig') y
  // para la firma por defecto de Configuración ('dsig'). `alCambiar` avisa
  // al contenedor para que marque cambios o persista, según el caso.
  function crearControlFirma(p, alCambiar) {
    const el = (sufijo) => $(p + sufijo);
    let dataUrl = null;

    function get() {
      return { method: el('Method').value, dataUrl, text: el('Text').value.trim() };
    }

    function set(sig) {
      sig = sig || {};
      el('Method').value = sig.method || 'none';
      dataUrl = sig.dataUrl || null;
      el('Text').value = sig.text || '';
      limpiarLienzo();
      if (dataUrl && sig.method === 'draw') pintarEnLienzo(dataUrl);
      applyUI();
    }

    function applyUI() {
      const m = el('Method').value;
      el('ImageBox').classList.toggle('hidden', m !== 'image');
      el('DrawBox').classList.toggle('hidden', m !== 'draw');
      el('TextBox').classList.toggle('hidden', m !== 'text');
      const verPrev = (m === 'image' || m === 'draw') && dataUrl;
      el('Preview').classList.toggle('hidden', !verPrev);
      if (verPrev) el('PreviewImg').src = dataUrl;
    }

    const notificar = () => { applyUI(); if (alCambiar) alCambiar(); };

    function limpiarLienzo() {
      const c = el('Canvas');
      c.getContext('2d').clearRect(0, 0, c.width, c.height);
    }
    // Restaura un dibujo guardado dentro del lienzo al reabrir
    function pintarEnLienzo(url) {
      const c = el('Canvas'), img = new Image();
      img.onload = () => c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      img.src = url;
    }

    el('Method').addEventListener('change', notificar);
    el('Text').addEventListener('input', () => { if (alCambiar) alCambiar(); });
    el('File').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { dataUrl = reader.result; notificar(); };
      reader.readAsDataURL(file);
    });
    el('Clear').addEventListener('click', () => { limpiarLienzo(); dataUrl = null; notificar(); });

    // Dibujo con el mouse
    const c = el('Canvas');
    const ctx = c.getContext('2d');
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    let trazando = false;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (c.width / r.width),
               y: (e.clientY - r.top) * (c.height / r.height) };
    };
    c.addEventListener('mousedown', (e) => { trazando = true; const q = pos(e); ctx.beginPath(); ctx.moveTo(q.x, q.y); });
    c.addEventListener('mousemove', (e) => { if (!trazando) return; const q = pos(e); ctx.lineTo(q.x, q.y); ctx.stroke(); });
    window.addEventListener('mouseup', () => {
      if (!trazando) return; trazando = false;
      dataUrl = c.toDataURL('image/png'); notificar();
    });

    return { get, set, applyUI };
  }

  let firmaPlanilla = null;   // firma de la planilla abierta
  let firmaDefecto = null;    // firma por defecto (Configuración)

  const getSignature = () => firmaPlanilla.get();

  // ---------------- Planillas (persistencia) ----------------
  function persist() { window.api.saveData(store); }

  // ---------------- Tema ----------------
  // 'light' | 'dark' | 'system'. En 'system' se sigue la apariencia del SO.
  const consultaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

  function temaElegido() {
    return (store.settings && store.settings.theme) || 'system';
  }

  function applyTheme() {
    const elegido = temaElegido();
    const efectivo = elegido === 'system'
      ? (consultaOscuro.matches ? 'dark' : 'light')
      : elegido;
    document.documentElement.setAttribute('data-theme', efectivo);
    document.querySelectorAll('#themeSeg .seg-opt').forEach(b => {
      b.classList.toggle('active', b.dataset.themeOpt === elegido);
    });
  }

  function setTheme(valor) {
    if (!store.settings) store.settings = {};
    store.settings.theme = valor;
    persist();
    applyTheme();
  }

  // ---------------- Datos por defecto ----------------
  // El mes queda fuera a propósito: es propio de cada planilla.
  const DEFAULT_IDS = ['nombres', 'dependencia', 'codigo', 'horasSemanales'];
  const idDefecto = (campo) => 'def' + campo.charAt(0).toUpperCase() + campo.slice(1);

  function leerDefaults() {
    const d = {};
    DEFAULT_IDS.forEach(c => { d[c] = $(idDefecto(c)).value.trim(); });
    d.signature = firmaDefecto.get();
    return d;
  }

  function escribirDefaults() {
    const d = (store.settings && store.settings.defaults) || {};
    DEFAULT_IDS.forEach(c => { $(idDefecto(c)).value = d[c] || ''; });
    firmaDefecto.set(d.signature);
  }

  let defaultsTimer = null;
  function guardarDefaults() {
    clearTimeout(defaultsTimer);
    defaultsTimer = setTimeout(() => {
      if (!store.settings) store.settings = {};
      store.settings.defaults = leerDefaults();
      persist();
    }, 400);
  }

  function initSettings() {
    const modal = $('settingsModal');
    const abrir = () => { modal.classList.remove('hidden'); applyTheme(); escribirDefaults(); };
    const cerrar = () => modal.classList.add('hidden');

    DEFAULT_IDS.forEach(c => $(idDefecto(c)).addEventListener('input', guardarDefaults));

    $('btnSettings').addEventListener('click', abrir);
    $('btnCloseSettings').addEventListener('click', cerrar);
    // Clic fuera del cuadro o Escape para cerrar
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) cerrar();
    });
    $('themeSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme-opt]');
      if (b) setTheme(b.dataset.themeOpt);
    });
    // Si el tema es 'system', seguir los cambios del SO en caliente
    consultaOscuro.addEventListener('change', () => {
      if (temaElegido() === 'system') applyTheme();
    });
  }

  // ---------------- Navegación entre vistas ----------------
  const SUBTITULO = 'Generador de planillas en PDF';
  let enEditor = false;   // el preview en vivo solo corre dentro del editor
  let sinGuardar = false; // hay cambios pendientes en la planilla abierta

  // Marca cambios pendientes y refresca el aviso del subtítulo una sola vez
  function marcarSinGuardar() {
    if (!enEditor || sinGuardar) return;
    sinGuardar = true;
    updateCurrentName();
  }

  function showHome(mostrarLista) {
    enEditor = false;
    clearTimeout(previewTimer);
    $('homeView').classList.remove('hidden');
    document.querySelector('.layout').classList.add('hidden');
    ['btnHome', 'btnSave'].forEach(id => $(id).classList.add('hidden'));
    $('subtitle').textContent = SUBTITULO;

    const n = store.sheets.length;
    const hayPlanillas = n > 0;
    $('cardOpen').disabled = !hayPlanillas;
    $('cardOpenDesc').textContent = !hayPlanillas
      ? 'No hay planillas guardadas'
      : (n === 1 ? 'Tienes 1 planilla guardada' : `Tienes ${n} planillas guardadas`);

    const verLista = !!mostrarLista && hayPlanillas;
    $('homeChoice').classList.toggle('hidden', verLista);
    $('homeList').classList.toggle('hidden', !verLista);
    if (verLista) renderSheetList();
  }

  function showEditor() {
    enEditor = true;
    $('homeView').classList.add('hidden');
    document.querySelector('.layout').classList.remove('hidden');
    ['btnHome', 'btnSave'].forEach(id => $(id).classList.remove('hidden'));
    updateCurrentName();
    scheduleLivePreview();
  }

  // En el editor el subtítulo muestra la planilla abierta y su estado
  function updateCurrentName() {
    if (!enEditor) return;
    const sub = $('subtitle');
    sub.textContent = (current && current.name) ? current.name : 'Planilla nueva';
    if (sinGuardar) {
      const marca = document.createElement('span');
      marca.className = 'sin-guardar';
      marca.textContent = ' · sin guardar';
      sub.appendChild(marca);
    }
  }

  // Vuelve al inicio avisando si quedan cambios sin guardar
  function goHome() {
    if (sinGuardar && !confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) return;
    sinGuardar = false;
    showHome(false);
  }

  // Planilla nueva: parte de los valores definidos en Configuración.
  // Si no hay ninguno, todo queda en blanco (firma incluida). El mes nunca
  // se hereda porque es propio de cada planilla.
  function newSheet() {
    const def = (store.settings && store.settings.defaults) || {};
    const header = {};
    DEFAULT_IDS.forEach(c => { header[c] = def[c] || ''; });
    header.mes = '';

    current = { name: '', header, rows: [], _idx: null };
    writeHeader(header);
    firmaPlanilla.set(def.signature);
    for (let i = 0; i < ROWS; i++) current.rows[i] = {};
    renderRows();
    sinGuardar = false;
    showEditor();
  }

  function saveSheet() {
    current.header = readHeader();
    current.signature = getSignature();
    // Nombre por defecto: el mismo que llevará el PDF generado
    if (!current.name) current.name = PDFGen.docName();
    current.savedAt = new Date().toISOString();
    if (current._idx == null) {
      current._idx = store.sheets.length;
      store.sheets.push(current);
    } else {
      store.sheets[current._idx] = current;
    }
    persist();
    sinGuardar = false;
    updateCurrentName();
    toast('Planilla guardada');
  }

  function loadSheet(idx) {
    const s = store.sheets[idx];
    if (!s) return;
    current = JSON.parse(JSON.stringify(s));
    current._idx = idx;
    writeHeader(current.header);
    firmaPlanilla.set(current.signature);
    if (!current.rows) current.rows = [];
    for (let i = 0; i < ROWS; i++) if (!current.rows[i]) current.rows[i] = {};
    renderRows();
    sinGuardar = false;
    showEditor();
  }

  // ---------------- Lista de planillas guardadas ----------------
  // Cuenta los días con algún dato registrado
  function diasConDatos(s) {
    return (s.rows || []).filter(r => r && Object.values(r).some(v => String(v || '').trim() !== '')).length;
  }

  function fechaGuardado(s) {
    if (!s.savedAt) return 'sin fecha';
    const d = new Date(s.savedAt);
    return isNaN(d) ? 'sin fecha' : d.toLocaleDateString('es-PE');
  }

  function renderSheetList() {
    const cont = $('sheetList');
    cont.innerHTML = '';
    if (!store.sheets.length) {
      cont.innerHTML = '<div class="home-empty">No hay planillas guardadas.</div>';
      return;
    }
    store.sheets.forEach((s, idx) => {
      const meta = [
        (s.header && s.header.mes) ? s.header.mes : null,
        `${diasConDatos(s)} día(s) con datos`,
        `guardada el ${fechaGuardado(s)}`
      ].filter(Boolean).join(' · ');

      const item = document.createElement('div');
      item.className = 'sheet-item';
      item.dataset.idx = idx;
      item.tabIndex = 0;
      item.innerHTML =
        `<div class="sheet-info">` +
          `<div class="sheet-name"></div>` +
          `<div class="sheet-meta"></div>` +
        `</div>` +
        `<div class="sheet-actions">` +
          `<button class="btn btn-sm btn-primary" data-act="open">Abrir</button>` +
          `<span class="sep"></span>` +
          `<button class="btn btn-sm btn-icon" data-act="rename" title="Renombrar"><i class="icon-pencil"></i></button>` +
          `<button class="btn btn-sm btn-icon" data-act="dup" title="Duplicar"><i class="icon-copy"></i></button>` +
          `<button class="btn btn-sm btn-icon btn-danger" data-act="del" title="Eliminar"><i class="icon-trash-2"></i></button>` +
        `</div>`;
      // textContent evita que un nombre con < > rompa el marcado
      item.querySelector('.sheet-name').textContent = s.name || `Planilla ${idx + 1}`;
      item.querySelector('.sheet-meta').textContent = meta;
      cont.appendChild(item);
    });
  }

  function onSheetListClick(e) {
    const item = e.target.closest('.sheet-item');
    if (!item) return;
    const idx = +item.dataset.idx;
    const btn = e.target.closest('button[data-act]');
    // Clic en cualquier parte de la tarjeta (salvo botones o el campo de
    // renombrado) equivale a abrir la planilla.
    if (!btn) {
      if (!e.target.closest('input')) loadSheet(idx);
      return;
    }
    const acciones = {
      open: () => loadSheet(idx),
      rename: () => startRename(item, idx),
      dup: () => duplicateSheet(idx),
      del: () => deleteSheetAt(idx)
    };
    (acciones[btn.dataset.act] || (() => {}))();
  }

  // Renombrar en línea: el nombre se vuelve un campo editable
  function startRename(item, idx) {
    const cont = item.querySelector('.sheet-name');
    if (cont.querySelector('input')) return;
    const actual = store.sheets[idx].name || '';
    cont.innerHTML = '';
    const input = document.createElement('input');
    input.className = 'sheet-rename';
    input.type = 'text';
    input.value = actual;
    cont.appendChild(input);
    input.focus();
    input.select();

    let cerrado = false;
    const confirmar = (guardar) => {
      if (cerrado) return;
      cerrado = true;
      const nuevo = input.value.trim();
      if (guardar && nuevo && nuevo !== actual) {
        store.sheets[idx].name = nuevo;
        if (current && current._idx === idx) { current.name = nuevo; updateCurrentName(); }
        persist();
        toast('Planilla renombrada');
      }
      renderSheetList();
    };
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') confirmar(true);
      if (ev.key === 'Escape') confirmar(false);
    });
    input.addEventListener('blur', () => confirmar(true));
  }

  function duplicateSheet(idx) {
    const copia = JSON.parse(JSON.stringify(store.sheets[idx]));
    copia.name = (copia.name || `Planilla ${idx + 1}`) + ' (copia)';
    copia.savedAt = new Date().toISOString();
    delete copia._idx;
    store.sheets.splice(idx + 1, 0, copia);
    // el índice de la planilla abierta puede haberse desplazado
    if (current && current._idx != null && current._idx > idx) current._idx++;
    persist();
    renderSheetList();
    toast('Planilla duplicada');
  }

  function deleteSheetAt(idx) {
    const s = store.sheets[idx];
    if (!confirm(`¿Eliminar "${s.name || 'esta planilla'}"? No se puede deshacer.`)) return;
    store.sheets.splice(idx, 1);
    // reajusta el índice de la planilla abierta
    if (current && current._idx != null) {
      if (current._idx === idx) current._idx = null;      // pasa a ser no guardada
      else if (current._idx > idx) current._idx--;
    }
    persist();
    toast('Planilla eliminada');
    if (store.sheets.length) renderSheetList();
    else showHome(false); // sin planillas: vuelve al nivel 1
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

  // Vista previa automática (con retraso para no regenerar el PDF en cada tecla).
  // Solo se ejecuta dentro del editor: en la pantalla de inicio no hay nada que mostrar.
  let previewTimer = null;
  function scheduleLivePreview() {
    clearTimeout(previewTimer);
    if (!enEditor) return;
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
    // Dos instancias del mismo control: la de la planilla marca cambios
    // pendientes; la de Configuración se guarda sola.
    firmaPlanilla = crearControlFirma('sig', scheduleAutosaveHeader);
    firmaDefecto = crearControlFirma('dsig', guardarDefaults);

    // Editor
    $('btnSave').addEventListener('click', saveSheet);
    $('btnHome').addEventListener('click', goHome);
    $('btnClearRows').addEventListener('click', clearRows);
    HEADER_IDS.forEach(id => $(id).addEventListener('input', scheduleAutosaveHeader));

    // Pantalla de inicio
    $('cardNew').addEventListener('click', newSheet);
    $('cardOpen').addEventListener('click', () => showHome(true));
    $('btnBackChoice').addEventListener('click', () => showHome(false));
    $('sheetList').addEventListener('click', onSheetListClick);

    initSettings();

    // Carga persistencia
    store = await window.api.loadData();
    if (!store.sheets) store.sheets = [];
    if (!store.settings) store.settings = {};

    applyTheme();     // antes de mostrar nada, para evitar un parpadeo de color
    showHome(false);  // la app siempre arranca en el inicio
  }

  window.addEventListener('DOMContentLoaded', init);
})();
