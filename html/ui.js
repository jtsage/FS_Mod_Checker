//  _______           __ ______ __                __               
// |   |   |.-----.--|  |      |  |--.-----.----.|  |--.-----.----.
// |       ||  _  |  _  |   ---|     |  -__|  __||    <|  -__|   _|
// |__|_|__||_____|_____|______|__|__|_____|____||__|__|_____|__|  

// Renderer Thread - UI Functions that don't require data from browser process

// (c) 2021 JTSage.  MIT License.

const byId = function( id ) { return document.getElementById( id ) }

function toggleHideFolderOnlyError() {
	const folderOnly = byId("broken_list").querySelectorAll(".just-folder-error")
	const status     = byId("zip_folder_switch").checked

	folderOnly.forEach((thisBroken) => {
		if ( status ) {
			thisBroken.classList.add("d-none")
		} else {
			thisBroken.classList.remove("d-none")
		}
	})
}

function toggleExploreColumns () {
	const columns = [
		"mod_name",
		"mod_title",
		"mod_version",
		"mod_size",
		"mod_is_active",
		"mod_active_games",
		"mod_is_used",
		"mod_used_games",
		"mod_full_path",
		"mod_has_scripts",
	]
	columns.forEach((thisCol) => {
		const theseItems = byId("table_explore_parent").querySelectorAll(".col_"+thisCol)
		const colStatus = byId("col_"+thisCol+"_switch").checked

		theseItems.forEach((thisRow) => {
			if ( colStatus === true ) {
				thisRow.classList.remove("d-none")
			} else {
				thisRow.classList.add("d-none")
			}
		})
	})
}

window.addEventListener('DOMContentLoaded', () => {
	toggleExploreColumns()
	toggleHideFolderOnlyError()
})