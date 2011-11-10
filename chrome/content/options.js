window.addEventListener('load', function(e){

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
           .getService(Components.interfaces.nsIWindowMediator);
    var browserWindow = wm.getMostRecentWindow("navigator:browser");
    var furkUploader = browserWindow.furkUploader;

    // set lables from messages.properties
    var labelsMap = {
        'checkbox-ssl': 'option_ssl_label',
        'radio-parse-sites-label': 'option_parse_sites',
        'textbox-parse-sites-list-label': 'option_parse_sites_list'
    };
    for(var i in labelsMap) {
        document.getElementById(i)[i.substr(-5) == 'label' ? 'value' : 'label'] = furkUploader.messages.getString(labelsMap[i]);
    }

    // set sites listbox enabled/disabled
    if(furkUploader.prefs.getCharPref('option_parse_sites') != 'list') {
        list.disabled = true;
    }

}, true);

// toogle sites listbox enabled/disabled
function toogleList(value) {
    document.getElementById('textbox-parse-sites-list').disabled = !(value == 'list');
}
