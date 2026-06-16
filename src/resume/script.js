// No interactive controls — PDF export handled via browser print.

function downloadResumePdf(e) {
    e.preventDefault();
    var url = '/assets/Omar_Y_Silwany_Creative_Director.pdf';
    fetch(url).then(function(res) { return res.blob(); }).then(function(blob) {
        var blobUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'Omar_Y_Silwany_Creative_Director.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    });
}
