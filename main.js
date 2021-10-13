const { app, BrowserWindow, webContents, ipcMain } = require('electron');

function createWindow () {
	const win = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
		}
	});
	win.loadFile('gui/index.html');
	win.maximize();

	require("./code/code.js");
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if(process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if(BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});