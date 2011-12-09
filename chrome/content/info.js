// open link in current tab instead info bar
function openLink(a) {
    browserWindow.gBrowser.selectedBrowser.loadURI(a.href);
}

function closeInfoBar() {
    furkUploader.infoBrowser.collapsed = true;
}

var browserWindow;
var furkUploader;

window.addEventListener('load', function(){

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
           .getService(Components.interfaces.nsIWindowMediator);
    browserWindow = wm.getMostRecentWindow("navigator:browser");
    furkUploader = browserWindow.furkUploader;

    if(window.location.search.length == 0) {
        // ff can cache page URL
        return;
    }

    function $(id) {
        return document.getElementById(id);
    }

    // set title for close button
    //$('button-close').title = furkUploader.messages.getString('click_to_close_bar');

    //browserWindow.Firebug.Console.log(document.getElementById('ss'));

    furkUploader.getFileInfo(window.location.search.substr(1), function(info) {
        //browserWindow.Firebug.Console.log(info);
        //var ss = document.getElementById('ss').getElementsByTagName('img');

        // add screenshorts
        var ssHeight = 0;
        if(info.type == 'video' && info.ss_urls_tn_all) {
            $('ss').style.display = '';
            $('ss').getElementsByTagName('img')[0].src = info.ss_urls_tn_all;
            ssHeight = info.ss_height / 2;
        } else {
            $('ss').style.display = 'none';
        }

        // add info
        var desc = '';
        if(info.status == 'fake') {
            desc += '<b style="color:red;display:block;">' + furkUploader.messages.getString('fake_file') + '</b>';
        }
        if(info.type == 'video') {
            desc += 'Video info: ' + info.video_info;
        } else {
            desc += info.av_info;
        }
        $('info').innerHTML = desc;

        // set button links
        //$('binfo').style.display = 'none';
        $('binfo').href = info.url_page; // allways show
        $('bdownload').style.display = 'none';
        $('bplay').style.display = 'none';
        if(info.status != 'fake') {
            $('binfo').style.display = '';
            $('bdownload').style.display = '';
            $('bdownload').href = info.url_dl;
            if(info.type == 'video') {
                $('bplay').style.display = '';
                $('bplay').href = info.url_pls;
            }
        }

        // set height
        var h = Math.round(ssHeight);
        $('ss').style.height = h + 'px';
        $('buttons').style.top = (h + 2) + 'px';

        furkUploader.infoBrowser.height =
            furkUploader.infoBrowser.minHeight =
            furkUploader.infoBrowser.maxHeight =
            furkUploader.infoBrowser.clientHeight =
            furkUploader.infoBrowser.scrollHeight = (h + 55) + 'px';

        furkUploader.infoBrowser.collapsed = false;
    }, browserWindow.gBrowser.selectedBrowser.contentDocument.location.href);

}, true);
