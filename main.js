//  _______           __ ______ __                __               
// |   |   |.-----.--|  |      |  |--.-----.----.|  |--.-----.----.
// |       ||  _  |  _  |   ---|     |  -__|  __||    <|  -__|   _|
// |__|_|__||_____|_____|______|__|__|_____|____||__|__|_____|__|  

// Main Program

// (c) 2021 JTSage.  MIT License.

const { app, Menu, BrowserWindow, ipcMain, clipboard } = require('electron')
const path       = require('path')
const xml2js     = require('xml2js')
const translator = require('./translate.js')
const modReader  = require('./mod-checker.js')

const myTranslator     = new translator.translator(translator.getSystemLocale())
let location_savegame  = null
let location_modfolder = null
let location_valid     = false

var modList = null

function createWindow () {
	const win = new BrowserWindow({
		icon           : path.join(app.getAppPath(), 'build', 'icon.png'),
		width          : 1000,
		height         : 700,
		autoHideMenuBar: true,
		webPreferences : {
			nodeIntegration  : false,
			contextIsolation : true,
			preload          : path.join(app.getAppPath(), 'preload.js')
		}
	})

	win.loadFile(path.join(__dirname, 'html', 'index.html'))

	win.webContents.on('did-finish-load', (event) => {
		if ( modList !== null ) {
			modList.safeResend().then((isIt) => {
				if ( isIt ) {
					event.sender.send("processModsDone")
				}
			})
		}
		event.sender.send('trigger-i18n')
		myTranslator.getLangList().then((langList) => {
			event.sender.send('trigger-i18n-select', langList, myTranslator.currentLocale)
		})
	})
}




/*
  _____  _____  _______   _______ _______ __   _ _     _ _______
    |   |_____] |       . |  |  | |______ | \  | |     | |______
  __|__ |       |_____  . |  |  | |______ |  \_| |_____| ______|
                                                                
*/
ipcMain.on('show-context-menu-list', async (event, fullPath) => {
	const template = [
		{
			label: await myTranslator.stringLookup("menu_copy_full_path"),
			click: () => { clipboard.writeText(fullPath) }
		}
	]
	const menu = Menu.buildFromTemplate(template)
	menu.popup(BrowserWindow.fromWebContents(event.sender))
})

ipcMain.on('show-context-menu-table', async (event, theseHeaders, theseValues) => {
	let template = [
		{
			label: await myTranslator.stringLookup("menu_details"),
			click: () => { openDetailWindow(modList.fullList[theseValues[0]]) }
		}
	]
	const blackListColumns = ["header_mod_is_used", "header_mod_is_active", "header_mod_has_scripts"]
	const copyString = await myTranslator.stringLookup("menu_copy_general")

	for ( let i = 0; i < theseHeaders.length; i++ ) {
		if ( blackListColumns.includes(theseHeaders[i][1]) ) { continue }
		template.push({
			label: copyString + theseHeaders[i][0],
			click: () => { clipboard.writeText(theseValues[i]) }
		})
		
	}

	const menu = Menu.buildFromTemplate(template)
	menu.popup(BrowserWindow.fromWebContents(event.sender))
})




/*
  _____  _____  _______   _______  ______ _______ __   _ _______        _______ _______ _______
    |   |_____] |       .    |    |_____/ |_____| | \  | |______ |      |_____|    |    |______
  __|__ |       |_____  .    |    |    \_ |     | |  \_| ______| |_____ |     |    |    |______
                                                                                               
*/
ipcMain.on('i18n-translate', async (event, arg) => {
	myTranslator.stringLookup(arg).then((text) => { 
		event.sender.send('i18n-translate-return', arg, text)
	})
})

ipcMain.on('i18n-change-locale', (event, arg) => {
	myTranslator.currentLocale = arg
	event.sender.send("trigger-i18n")
	event.sender.send("trigger-i18n-on-data")
})




/*
  _____  _____  _______   _______  _____  __   _ _______ _____  ______
    |   |_____] |       . |       |     | | \  | |______   |   |  ____
  __|__ |       |_____  . |_____  |_____| |  \_| |       __|__ |_____|
                                                                      
*/
ipcMain.on('openConfigFile', (event) => {
	const {dialog} = require('electron') 
	const fs       = require('fs')
	const homedir  = require('os').homedir()

	dialog.showOpenDialog({
		properties: ['openFile'],
		defaultPath: path.join(homedir, "Documents" , "My Games", "FarmingSimulator2019", "gameSettings.xml" ),
		filters: [
			{ name: 'XML', extensions: ['xml'] },
			{ name: 'All', extensions: ['*'] }
		]
	}).then(result => {
		if ( result.canceled ) {
			location_valid = false
			event.sender.send("newFileConfig", { valid : false, error : false, saveDir : "--", modDir : "--" })
		} else {
			const XMLOptions = {strict: true, async: false, normalizeTags: true, attrNameProcessors : [function(name) { return name.toUpperCase() }] }
			const strictXMLParser = new xml2js.Parser(XMLOptions)

			location_savegame = path.dirname(result.filePaths[0])

			strictXMLParser.parseString(fs.readFileSync(result.filePaths[0]), (xmlErr, xmlTree) => {
				let overrideAttr = false

				try {
					overrideAttr = xmlTree["gamesettings"]["modsdirectoryoverride"][0]['$']
				} catch {
					overrideAttr   = false
					location_valid = false
					event.sender.send("newFileConfig", { valid : false, error : true, saveDir : "--", modDir : "--" } )
				}

				if ( overrideAttr !== false ) {
					if ( overrideAttr.ACTIVE == "true" ) {
						location_modfolder = overrideAttr.DIRECTORY
					} else {
						location_modfolder = path.join(location_savegame, "mods")
					}

					location_valid = true

					event.sender.send("newFileConfig", {
						valid   : true,
						error   : false,
						saveDir : location_savegame,
						modDir  : location_modfolder
					})
				}
			})
		}
	}).catch(err => {
		// Read of file failed? Permissions issue maybe?  Not sure.
		location_valid = false
		event.sender.send("newFileConfig", { valid : false, error : true, saveDir : "--", modDir : "--" } )
		// console.debug(err)
	})
})



/*
  _____  _____  _______    _____   ______  _____  _______ _______ _______ _______
    |   |_____] |       . |_____] |_____/ |     | |       |______ |______ |______
  __|__ |       |_____  . |       |    \_ |_____| |_____  |______ ______| ______|
                                                                                 
*/
ipcMain.on('processMods', (event) => {
	if ( location_valid ) {
		modList = new modReader(
			location_savegame,
			location_modfolder,
			myTranslator.deferCurrentLocale)

		modList.readAll().then(() => {
			event.sender.send("processModsDone")
		}).catch(() => {
			event.sender.send("newFileConfig", { valid : false, error : true, saveDir : "--", modDir : "--" })
		})
	} else {
		// This should be unreachable.  But it means that the process button was clicked before loading
		// a valid config.  Let's just start over with empty entries.
		event.sender.send("newFileConfig", { valid : false, error : true, saveDir : "--", modDir : "--" })
	}
})




/*
  _____  _____  _______   ______   ______  _____  _     _ _______ __   _
    |   |_____] |       . |_____] |_____/ |     | |____/  |______ | \  |
  __|__ |       |_____  . |_____] |    \_ |_____| |    \_ |______ |  \_|
                                                                        
*/
ipcMain.on("askBrokenList", (event) => {
	modList.search({
		columns : ["filenameSlash", "fullPath", "failedTestList", "copyName"],
		terms   : ["didTestingFail"],
	}).then(searchResults => { event.sender.send("gotBrokenList", searchResults) })
})




/*
  _____  _____  _______   _______  _____  __   _ _______        _____ _______ _______ _______
    |   |_____] |       . |       |     | | \  | |______ |        |   |          |    |______
  __|__ |       |_____  . |_____  |_____| |  \_| |       |_____ __|__ |_____     |    ______|
                                                                                             
*/
ipcMain.on("askConflictList", async (event) => {
	const folderAndZipText = await myTranslator.stringLookup("conflict_error_folder_and_file")

	modList.conflictList(folderAndZipText).then((searchResults) => {
		event.sender.send("gotConflictList", searchResults)
	})
})




/*
  _____  _____  _______   _______ _____ _______ _______ _____ __   _  ______
    |   |_____] |       . |  |  |   |   |______ |______   |   | \  | |  ____
  __|__ |       |_____  . |  |  | __|__ ______| ______| __|__ |  \_| |_____|
                                                                            
*/
ipcMain.on("askMissingList", (event) => {
	modList.search({
		columns : ["shortName", "title", "activeGames", "usedGames"],
		terms   : ["isMissing"],
	}).then(searchResults => { event.sender.send("gotMissingList", searchResults) })
})



/*
  _____  _____  _______   _______ _______ _______ _____ _    _ _______
    |   |_____] |       . |_____| |          |      |    \  /  |______
  __|__ |       |_____  . |     | |_____     |    __|__   \/   |______
                                                                      
*/
ipcMain.on("askGamesActive", (event) => {
	modList.getActive().then(async (activeSet) => {
		event.sender.send(
			"gotGamesActive",
			activeSet,
			await myTranslator.stringLookup("filter_savegame"),
			await myTranslator.stringLookup("filter_savegame_all")
		)
	})
})



/*
  _____  _____  _______   _______ _     _  _____          _____   ______ _______
    |   |_____] |       . |______  \___/  |_____] |      |     | |_____/ |______
  __|__ |       |_____  . |______ _/   \_ |       |_____ |_____| |    \_ |______
                                                                                
*/
ipcMain.on("askExploreList", (event, activeGame) => {
	modList.search({
		columns             : [
			"shortName", "title", "mod_version", "fileSizeMap",
			"isActive", "activeGames", "isUsed", "usedGames",
			"fullPath", "hasScripts"
		],
		activeGame          : parseInt(activeGame),
		forceIsActiveIsUsed : true,
		allTerms            : true,
		terms               : ["isNotMissing", "didTestingPassEnough"],
	}).then(searchResults => { event.sender.send("gotExploreList", searchResults) })
})


var detailWindow = null

function openDetailWindow(thisModRecord) {
	if (detailWindow) {
		detailWindow.focus()
		return
	}

	detailWindow = new BrowserWindow({
		icon           : path.join(app.getAppPath(), 'build', 'icon.png'),
		width          : 800,
		height         : 500,
		title          : thisModRecord.title,
		minimizable    : false,
		maximizable    : false,
		fullscreenable : false,
		autoHideMenuBar: true,
		webPreferences : {
			nodeIntegration  : false,
			contextIsolation : true,
			preload          : path.join(app.getAppPath(), 'detail-preload.js')
		}
	})

	detailWindow.webContents.on('did-finish-load', (event) => {
		const sendData = {
			title       : thisModRecord.title,
			version     : thisModRecord.mod_version,
			filesize    : thisModRecord.fileSizeString,
			active_games: thisModRecord.activeGames,
			used_games  : thisModRecord.usedGames,
			has_scripts : ((thisModRecord.hasScripts) ? true : false),
			description : thisModRecord.descDescription,
		}
		event.sender.send('mod-record', sendData)
		event.sender.send('trigger-i18n')
	})

	detailWindow.loadFile(path.join(__dirname, 'html', 'detail.html'))

	// detailWindow.webContents.openDevTools()

	detailWindow.on('closed', function() {
		newWindow = null
	})
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
