//  _______           __ ______ __                __               
// |   |   |.-----.--|  |      |  |--.-----.----.|  |--.-----.----.
// |       ||  _  |  _  |   ---|     |  -__|  __||    <|  -__|   _|
// |__|_|__||_____|_____|______|__|__|_____|____||__|__|_____|__|  

// Test Runner CLI. May become a straight to log version.

// (c) 2021 JTSage.  MIT License.
const homedir  = require('os').homedir()
const path     = require('path')
const { exit } = require('process')

//const gameFolder = path.join(homedir, "Documents" , "My Games", "FarmingSimulator2019" )
const gameFolder = path.join(__dirname, "testFolder")
const fileFolder = path.join(gameFolder, "mods")

const modReader = require('./mod-checker')
const translator = require('./translate.js')
const myTranslator = new translator.translator(translator.getSystemLocale())

modList = new modReader(gameFolder, fileFolder, myTranslator.deferCurrentLocale)


modList.readAll().then((args) => {
	console.log("File Read Done, Testing Proceeding Async - Calling First Search, will return when testing is complete.")

	modList.search({
		columns : [
			"shortName",
			"isActive",
			"isUsed",
			//"isNotMissing",
			//"didTestingPassEnough"
			// "title",
			// "mod_version",
			"fileSizeMap",
			// "activeGames",
			// "usedGames",
			// "fullPath",
		],
		activeGame: 0,
		forceIsActiveIsUsed: true,
		allTerms : true,
		terms : ["isNotMissing", "didTestingPassEnough"],
	}).then(searchResults => {
		console.log("test.js results:", searchResults)
	})
})

/* Race the parser!! We initialized in "de", changing to "en" to get the list from the search
above in english.  As long as this line is run before the search can return, we should see english
This is a deliberate race condition to make sure async is working. */
myTranslator.currentLocale = "en"

myTranslator.getLangList().then((data) => { 
	console.log("Languages List (async loading - likely returning before file load is done):", data)
})


console.log("End File Code. There may (should!) still be running async processes")