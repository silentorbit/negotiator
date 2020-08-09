"use strict";
function loadExportPage() {
    function exportJSON() {
        var textJson = document.querySelector("#exportedJSON");
        textJson.value = b.exportJSON();
        textJson.select();
    }
    function importJSON() {
        var textJson = document.querySelector("#importedJSON");
        b.importAll(JSON.parse(textJson.value));
        b.saveAll();
    }
    document.querySelector("#exportJSON").addEventListener("click", exportJSON);
    document.querySelector("#importJSON").addEventListener("click", importJSON);
    exportJSON();
}
