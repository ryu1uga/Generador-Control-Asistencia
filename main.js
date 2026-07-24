// main.js — Proceso principal de Electron
const { app, BrowserWindow, ipcMain, session } = require('electron');
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Registro de Control de Asistencia',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      plugins: true // habilita el visor de PDF nativo de Chromium
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize(); // arranca ocupando toda la pantalla
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  // mainWindow.webContents.openDevTools();
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
  setupDownloadNaming();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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

