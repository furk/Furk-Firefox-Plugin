// this file running in browser context
// so be careful about namespace

// main object, most extension operation should be implemented here
furkUploader = {
    protocol: 'http',

    status: false,

    info: {},

    init: function() {

        // options storage
        // (curretly used only for save last check time)
        furkUploader.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("extensions.furkuploader.");
        furkUploader.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

        // string bundle object. allow to format messages
        furkUploader.messages = document.getElementById('furkMessages');

        // check uploaded files
        furkUploader.checkUploadedFiles();
        // check uploaded times every 1 minute
        window.setInterval(furkUploader.checkUploadedFiles, 1*60*1000);

        // notification object
        furkUploader.alertsService = Components.classes["@mozilla.org/alerts-service;1"].
                                getService(Components.interfaces.nsIAlertsService);
        // not logged in by default
        furkUploader.changeStatus(false);

        // append messages
        document.getElementById('furk-toolbar-icon').label = furkUploader.messages.getString('furkuploader');
        document.getElementById("furk-upload").label = furkUploader.messages.getString('uploadtofurk');
    },

    // change extension status (logged in or NO)
    changeStatus: function(status) {

        furkUploader.status = status;

        var button = document.getElementById('furk-toolbar-icon');

        furkUploader._toggleClassName(button, 'active', status);

        if(furkUploader.status) {
            button.tooltipText = furkUploader.messages.getString('clicktoshowfinished');
            // remove callback that runs on every page loads
            gBrowser.removeEventListener("load", furkUploader.checkPageLoad, true);
        } else {
            button.tooltipText = furkUploader.messages.getString('clicktologin');
            // Add a callback to be run every time a document loads.
            // note that this includes frames/iframes within the document
            gBrowser.addEventListener("load", furkUploader.checkPageLoad, true);
        }

    },

    // for internal usage only
    _toggleClassName: function(el, name, status) {
        var cl = el.className;
        if(status == undefined) {
            status = !(cl.split(name).length > 1);
        }
        cl = cl.split(name).join();
        if(status) {
            cl += ' ' + name;
        }
        el.className = cl;
    },

    // download torrent binary file from URL
    _getBinaryFileFromURL: function(url) {
        // no working correctly =()
        /*var req = new XMLHttpRequest();
        req.open('GET', url, false);
        //XHR binary charset opt by Marcus Granado 2006 [http://mgran.blogspot.com]
        req.overrideMimeType('text/plain; charset=x-user-defined');
        req.send(null);
        if (req.status != 200) return '';
        Firebug.Console.log(req.responseText);*/

        var ioserv = Components.classes["@mozilla.org/network/io-service;1"]
                       .getService(Components.interfaces.nsIIOService);
        var channel = ioserv.newChannel(url, 0, null);
        var stream = channel.open();

        if (channel instanceof Components.interfaces.nsIHttpChannel && channel.responseStatus != 200) {
            return "";
        }

        var bstream = Components.classes["@mozilla.org/binaryinputstream;1"]
                        .createInstance(Components.interfaces.nsIBinaryInputStream);
        bstream.setInputStream(stream);

        var size = 0;
        var file_data = "";
        while(size = bstream.available()) {
            file_data += bstream.readBytes(size);
        }

        return file_data;
    },

    // get selected link, download and upload to furk
    upload: function(url) {
        //Firebug.Console.log(url);

        if(!url) {
            var node = document.popupNode;
            // find A node (selected node can be IMG into A)
            while(!node.href) {
                if(node === document.body) return; // isn't link
                node = node.parentNode;
            }
            url = node.href;
        }

        // change icon to loading
        furkUploader._toggleClassName(document.getElementById('furk-toolbar-icon'), 'loader', true);

        // torrent file binary data
        var tdata = furkUploader._getBinaryFileFromURL(url);
        //Firebug.Console.log(tdata);
        if(!tdata) {
            // can't download file
            // remove loading icon
            furkUploader._toggleClassName(document.getElementById('furk-toolbar-icon'), 'loader', false);
            furkUploader.notify('Error', furkUploader.messages.getString('cantdownloadfile'));
            return;
        }

        // boundary for POST
        var b = 'Asrf436Bge4h',
            // format post data
            pdata = '\r\n--' + b + '\r\n' +
                    //'Content-Disposition: form-data; name="api_key";\r\n\r\n' +
                    //furk_api_key + '\r\n' +
                    //'--' + b + '\r\n' +
                    'Content-Disposition: form-data; name="format";\r\n\r\n' +
                    'json\r\n' +
                    '--' + b + '\r\n' +
                    'Content-Disposition: form-data; name="file"; filename="test.torrent"\r\n' +
                    //'Content-Type: application/x-bittorrent\r\n\r\n' +
                    'Content-Type: application/octet-stream\r\n\r\n' +
                    tdata + '\r\n' +
                    '--' + b + '\r\n';

        // send file to furk.net
        furkUploader._xhr('://api.furk.net/api/add_tor', {b:b, post: pdata}, function(r){
            if(r.torrent.dl_status == 'finished' && r.file) {
                //furkUploader.info[r.file.url_page] = r.file;
                furkUploader.notify(furkUploader.messages.getString('torrentisready'),
                        r.torrent.name, r.file.url_page);
            } else {
                furkUploader.notify(furkUploader.messages.getString('successupload'),
                        r.torrent.name);
            }
        });
    },

    _xhr: function(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open(data ? 'POST' : 'GET', furkUploader.protocol + url, true);
        xhr.onload = function(e) {
            if(xhr.readyState == 4) {
                // remove loading icon
                furkUploader._toggleClassName(document.getElementById('furk-toolbar-icon'), 'loader', false);
                if(xhr.responseText) {
                    var r;
                    try {
                        r = JSON.parse(xhr.responseText);
                    } catch(e) {
                        furkUploader.notify('Error', furkUploader.messages.getString('wrongjson'));
                    }
                    if(!r) return;

                    if(r.status == 'ok') {
                        callback(r);
                    } else {
                        if(r.error == 'access denied') {
                            furkUploader.changeStatus(false);
                            if(url.split('ping').length > 1) {
                                // do not showing access denied on ping requests
                                return;
                            }
                        }
                        furkUploader.notify('Error', r.error);
                    }
                    //Firebug.Console.log(r);
                    //Firebug.Console.log(xhr);
                    //Firebug.Console.log(xhr.getAllResponseHeaders());
                }
            }
        };
        if(data) {
            xhr.setRequestHeader('Content-Length', data.post.length);
            xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + data.b);
        }
        furkUploader._setCookies(xhr);
        xhr.sendAsBinary(data ? data.post : null);
    },

    // display simple notification
    notify: function(label, message, link) {
        furkUploader.alertsService.showAlertNotification(
            'chrome://furkuploader/content/icon.png',
            '[Furk.net] ' + label, message,
            !!link, link, furkUploader._notifyObserver, 'Furk Uploader');
    },

    // gets notification actions
    _notifyObserver: {
        observe: function(s, action, link) {
            if(link && action == 'alertclickcallback') {
                // some URL format
                //link = link.split('http').length > 1 ? link : ('https://www.furk.net' + link);
                //link = link.split('https').length > 1 ? link : link.split('http').join('https');
                gBrowser.selectedTab =
                    gBrowser.addTab(/*'https://www.furk.net' + */link);
            }
        }
    },

    // display notification about completed torrent
    displayNotification: function(data) {

        furkUploader.notify(furkUploader.message.getString('torrentisready'), data.name, data.url_page);

    },

    prepareNotifications: function(data) {

        // show only one popup when count of torrents is bigger
        /*if(data.length > 3) {
            // TODO
            //furkUploader.notify('...');
            //return;
        }*/

        for(var i=0; i < data.length; i++) {

            furkUploader.displayNotification(data[i]);

        }

    },

    checkUploadedFiles: function() {
        // don't check if we have no access
        if(!this.status) return;

        var time = furkUploader.prefs.getCharPref('last_finish_date');

        //Firebug.Console.log(time);
        furkUploader._xhr('://api.furk.net/api/get_tors?format=json;finish_dt_gt=' + time, null, function(r){
            r.torrents.length && furkUploader.prepareNotifications(r.torrents);
        });

        function dd(v) {
            return v < 10 ? ('0' + v) : v;
        }

        time = new Date();
        time = time.getUTCFullYear() + '-' +
                dd(time.getUTCMonth()+1) + '-' +
                dd(time.getUTCDate()) + ' ' +
                dd(time.getUTCHours()) + ':' +
                dd(time.getUTCMinutes()) + ':' +
                dd(time.getUTCSeconds());

        //Firebug.Console.log(time);

        furkUploader.prefs.setCharPref('last_finish_date', time);
    },

    // check is user loged in
    checkLogedIn: function() {
        // toolbar button
        var button = document.getElementById('furk-toolbar-icon');
        furkUploader._xhr('://api.furk.net/api/ping', null, function(r){
            furkUploader.changeStatus(true);
        });
    },

    // handler to check all page load
    // check is this is furk net and run ping after load
    checkPageLoad: function(e) {
        if (e.originalTarget instanceof HTMLDocument) {
            var win = e.originalTarget.defaultView;
            if (win.frameElement) {
                //Firebug.Console.log(win);
                win = win.top;
                if(win.location.host == 'furk.net' || win.location.host == 'www.furk.net') {
                    furkUploader.checkLogedIn();
                }
            }
        }
    },

    _setCookies: function(xhr) {
        var result = [];

        var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
                  .getService(Components.interfaces.nsICookieManager);
        for (var el = cookieMgr.enumerator; el.hasMoreElements();) {
            var cookie = el.getNext().QueryInterface(Components.interfaces.nsICookie);
            if(cookie.host == '.furk.net') {
                //Firebug.Console.log(cookie.host + ";" + cookie.name + "=" + cookie.value);
                result.push(cookie.name + '=' + cookie.value);
            }
        }
        xhr.setRequestHeader('Cookie', result.join(';'));
    },

    // onclick handler for toolbar button
    // open finished files list on furk.net
    openFilesList: function(e) {
        // is it left button clicked ?
        if(e.button == 0) {
            // add ne tab and make it active
            gBrowser.selectedTab =
                    gBrowser.addTab(furkUploader.protocol + '://www.furk.net/users/files/finished/');
        }
    },

    checkContextMenu: function(e) {
        // context menu item
        var item = document.getElementById("furk-upload");
        // hide item when extension is disabled
        if(!furkUploader.status) {
            item.hidden = true;
            return;
        }
        // get selected node
        var node = document.popupNode;
        // check if selected item is link
        // find A node (selected node can be IMG into A)
        if(node) {
            // hide menu item
            item.hidden = true;
            while(node) {
                if(node.href) {
                    // show menu item on links
                    item.hidden = false;
                }
                node = node.parentNode;
            }
        }
    },

    getFileInfo: function(hashes, callback) {
        var retArray = true;
        if(!(hashes instanceof Array)) {
            hashes = [hashes];
            retArray = false;
        }
        var hash, list = [];
        for(var i=0; i<hashes.length; i++) {
            hash = hashes[i];
            if(!furkUploader.info[hash.toUpperCase()]) {
                list.push(hash);
            }
        }
        if(list.length > 0) {
            furkUploader._xhr('://api.furk.net/api/get_files?info_hash=' + list.join(';info_hash='), null, function(r){
                //Firebug.Console.log(r);
                for(var i=0; i<r.files.length; i++) {
                    furkUploader.info[r.files[i].info_hash.toUpperCase()] = r.files[i];
                }
                callback(retArray ? furkUploader.info : furkUploader.info[hash.toUpperCase()]);
            });
        } else {
            callback(retArray ? furkUploader.info : furkUploader.info[hash.toUpperCase()]);
        }
    }

};

window.addEventListener("load", function() {
    // add icon on toolbar if not added
    var navBar = document.getElementById("nav-bar");
    if (navBar) {
        var curSet = navBar.currentSet.split(",");
        if (curSet.indexOf('furk-toolbar-icon') === -1) {
            var pos = curSet.indexOf("urlbar-container") + 1 || curSet.length;
            var set = curSet.slice(0, pos).concat("furk-toolbar-icon").
                concat(curSet.slice(pos));
            navBar.setAttribute("currentset", set.join(","));
            navBar.currentSet = set.join(",");
            document.persist(navBar.id, "currentset");
            try {
                BrowserToolboxCustomizeDone(true);
            } catch (e) {}
        }
    }

    // check context menu visibility
    var contextMenu = document.getElementById("contentAreaContextMenu");
    if (contextMenu) {
        contextMenu.addEventListener("popupshowing", furkUploader.checkContextMenu, false);
    }

    furkUploader.init();

    // ADD info bar at the bottom

    // TODO move following into object below
    furkUploader.showInfoBrowser = function(hash) {
        furkUploader.infoBrowser.loadURI('chrome://furkuploader/content/info.html?' + hash);
    };
    furkUploader.infoBrowser = document.getElementById('furk-info');
    // tab changed
    function reloadInfoBrowser(e){
        if(!furkUploader.status) {
            // do nothing
            return;
        }
        var browser = gBrowser.selectedBrowser;
        // hide info browser
        furkUploader.infoBrowser.collapsed = true;
        for(var i in furkUploader.adapters) {
            // check url
            if(browser.contentDocument.location.host == i || browser.contentDocument.location.host == 'www.' + i) {
                for(var r in furkUploader.adapters[i]) {
                    if((new RegExp(r, 'gi')).test(browser.contentDocument.location.pathname)) {
                        furkUploader.adapters[i][r](browser.contentDocument);
                    }
                }
                // adapter found, so return
                return;
            }
        }
    }
    // show/hide info bar on tab change
    gBrowser.tabContainer.addEventListener("TabSelect", reloadInfoBrowser, false);

    // show/hide info bar on first browser load and on navigation in a tab
    gBrowser.addEventListener('load', function(e){
        if(!e.originalTarget.defaultView.frameElement && gBrowser.selectedBrowser.contentDocument == e.originalTarget) {
            reloadInfoBrowser(e);
        }
    }, true);

}, false);
