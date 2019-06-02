"use strict";

function loadExportPage() {
    //Filter Import/Export
    function exportJSON() {
        var textJson = document.querySelector("#exportedJSON") as HTMLTextAreaElement;
        textJson.value = b.exportJSON();
        textJson.select();
    }

    function importJSON() {
        var textJson = document.querySelector("#importedJSON") as HTMLTextAreaElement;
        b.importAll(JSON.parse(textJson.value));
        b.saveAll();
    }

    document.querySelector("#exportJSON").addEventListener("click", exportJSON);
    document.querySelector("#importJSON").addEventListener("click", importJSON);

    //Export directly when the page is loaded
    exportJSON();
}