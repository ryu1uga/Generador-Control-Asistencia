// main.js — Proceso principal de Electron
const { app, BrowserWindow, ipcMain, session, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Nombre del PDF generado: "Control de notas DD-MM-YYYY.pdf" (fecha de generación)
function pdfFileName() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `Control de notas ${dd}-${mm}-${d.getFullYear()}.pdf`;
}

// Ruta del archivo de datos persistentes (cabecera + planillas guardadas)
function dataFile() {
  return path.join(app.getPath('userData'), 'control-asistencia-data.json');
}

function loadData() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { header: {}, sheets: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile(), JSON.stringify(data, null, 2), 'utf-8');
}

const esMac = process.platform === 'darwin';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Registro de Control de Asistencia',
    // En Windows y Linux el icono se toma del archivo; en macOS lo aporta el
    // paquete .app, así que ahí se omite.
    icon: esMac ? undefined : path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      plugins: true // habilita el visor de PDF nativo de Chromium
    }
  });

  // La barra de menús de macOS es global y no se puede ocultar por ventana:
  // allí se instala un menú mínimo (ver setupMenu). En Windows se oculta.
  if (!esMac) mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize(); // arranca ocupando toda la pantalla
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  // mainWindow.webContents.openDevTools();
}

// En macOS, sin menú propio aparece el de Electron por defecto. Este deja solo
// lo imprescindible del sistema (ocultar, salir, copiar/pegar, zoom).
function setupMenu() {
  if (!esMac) return Menu.setApplicationMenu(null);
  const nombre = app.name;
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: nombre,
      submenu: [
        { role: 'about', label: `Acerca de ${nombre}` },
        { type: 'separator' },
        { role: 'hide', label: `Ocultar ${nombre}` },
        { role: 'hideOthers', label: 'Ocultar otros' },
        { role: 'unhide', label: 'Mostrar todo' },
        { type: 'separator' },
        { role: 'quit', label: `Salir de ${nombre}` }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Zoom' },
        { type: 'separator' },
        { role: 'front', label: 'Traer todo al frente' }
      ]
    }
  ]));
}

// Cuando el usuario descarga desde el visor de PDF incrustado, el archivo
// llega con un nombre genérico (blob). Aquí se fuerza el nombre correcto.
function setupDownloadNaming() {
  session.defaultSession.on('will-download', (event, item) => {
    if (item.getMimeType() === 'application/pdf' || /\.pdf$/i.test(item.getFilename())) {
      item.setSaveDialogOptions({
        title: 'Guardar PDF',
        defaultPath: path.join(app.getPath('downloads'), pdfFileName()),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
    }
  });
}

app.whenReady().then(() => {
  setupMenu();
  setupDownloadNaming();
  createWindow();
  // En macOS es normal que la app siga viva sin ventanas: al pulsar su icono
  // en el Dock se vuelve a abrir una.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// En Windows y Linux cerrar la ventana cierra la app; en macOS no.
app.on('window-all-closed', () => {
  if (!esMac) app.quit();
});

// ---------- IPC ----------

// Lee la plantilla PDF en blanco y la devuelve como base64
ipcMain.handle('get-template', async () => {
  const p = path.join(__dirname, 'assets', 'template.pdf');
  const buf = fs.readFileSync(p);
  return buf.toString('base64');
});

// Persistencia
ipcMain.handle('load-data', async () => loadData());

ipcMain.handle('save-data', async (event, data) => {
  saveData(data);
  return true;
});

// ---------- Copia de seguridad ----------

// Nombre sugerido del archivo de copia: "Copia Control de Asistencia AAAA-MM-DD.json"
function backupFileName() {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `Copia Control de Asistencia ${iso}.json`;
}

ipcMain.handle('export-backup', async (event, contenido) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Guardar copia de seguridad',
    defaultPath: path.join(app.getPath('documents'), backupFileName()),
    filters: [{ name: 'Copia de seguridad', extensions: ['json'] }]
  });
  if (canceled || !filePath) return { ok: false };
  try {
    fs.writeFileSync(filePath, contenido, 'utf-8');
    return { ok: true, filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('import-backup', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir copia de seguridad',
    properties: ['openFile'],
    filters: [{ name: 'Copia de seguridad', extensions: ['json'] }]
  });
  if (canceled || !filePaths.length) return { ok: false };
  try {
    return { ok: true, contenido: fs.readFileSync(filePaths[0], 'utf-8') };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

