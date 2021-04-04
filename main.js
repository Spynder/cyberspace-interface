const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow () {
	const win = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			//contextIsolation: true,
			//enableRemoteModule: true,
		}
	});
	win.loadFile('gui/index.html')
	win.maximize()

	setInterval(function() {
		win.webContents.send('shipItemUpdate', 3)
	}, 2000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});








/*
// Event handler for asynchronous incoming messages
ipcMain.on('asynchronous-message', (event, arg) => {
	console.log(arg)

	// Event emitter for sending asynchronous messages
	event.sender.send('asynchronous-reply', 'async pong')
});

// Event handler for synchronous incoming messages
ipcMain.on('synchronous-message', (event, arg) => {
	console.log(arg) 

	// Synchronous event emmision
	event.returnValue = 'sync pong'
});*/