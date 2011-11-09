// this handler checks fle mime type and add furk uploader variant
window.addEventListener('load', function(e) {
    // get original browser window
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
           .getService(Components.interfaces.nsIWindowMediator);
    var browserWindow = wm.getMostRecentWindow("navigator:browser");

    // set label message
    document.getElementById('furUploaderDownloadRadioButton').label =
                browserWindow.furkUploader.messages.getString('uploadtofurk');

    // download only torrent files
    // and only when extension status is true (logged in)
    if(!browserWindow.furkUploader.status ||
        dialog.mLauncher.MIMEInfo.MIMEType != 'application/x-bittorrent' &&
        dialog.mLauncher.MIMEInfo.type != 'application/x-bittorrent' &&
        dialog.mLauncher.MIMEInfo.primaryExtension != 'torrent') {
        return;
    }

    // show 'upload to furk' variant
    document.getElementById('furkuploaderSaveAsContaner').collapsed = false;

    // can't find better way
    dialog.onOK_ = dialog.onOK;
    dialog.onOK = function() {
        if(document.getElementById('mode').selectedItem ===
                document.getElementById('furUploaderDownloadRadioButton')) {
            // download file
            // TODO run in background, otherwise dialog not close in short
            // TODO what about post requests ?? (e.g. torrentcrazy.com)
            browserWindow.furkUploader.upload(dialog.mLauncher.source.spec);
            return true;
        }
        // call original callback
        dialog.onOK_.apply(this);
    };

}, true);
