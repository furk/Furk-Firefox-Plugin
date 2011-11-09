
// some standard functions that can be used on few sites
furkUploader.findHashFromMagnetLink = function(doc) {
    var links = doc.getElementsByTagName('A'), hash;
    for(var i=0; i<links.length; i++) {
        if(links[i].href.substr(0, 6) == 'magnet') {
            hash = links[i].href.replace(
                    //new RegExp('^.*?:([a-zA-Z0-9]{40})(&.*)?$', 'gi'),
                    // TODO use this universal method for all callbacks
                    new RegExp('^(?:.*?\\b)?([a-f0-9]{40}|[A-Z0-9]{40})(?:\\b.*)?$', 'gi'),
                    '$1');
            break;
        }
    }

    //Firebug.Console.log(hash);

    hash && furkUploader.showInfoBrowser(hash);
};

furkUploader.findHashFromURL = function(doc) {
    var hash = doc.location.pathname.replace(
                new RegExp('^.*?\/([a-zA-Z0-9]{40}(\/.*)?$)', 'gi'),
                '$1');

    //Firebug.Console.log(hash);

    hash && furkUploader.showInfoBrowser(hash);
};

furkUploader.findHashFromDHTLink = function(doc) {
    var links = doc.getElementsByTagName('A'), hash;
    for(var i=0; i<links.length; i++) {
        if(links[i].href.substr(0, 3) == 'dht') {
            hash = links[i].href.replace(
                    new RegExp('^dht:\/\/([a-zA-Z0-9]{40})\.dht$', 'gi'),
                    '$1');
            break;
        }
    }

    //Firebug.Console.log(hash);

    hash && furkUploader.showInfoBrowser(hash);
};

furkUploader.appendFurkLinks = function(doc, type, css) {
    if(doc['_furkuploaderready']) {
        // don't run this twice
        return;
    }
    doc['_furkuploaderready'] = true;

    type = type ? (type + '.*?') : '';

    var linksAll = doc.getElementsByTagName('a'), links = [], hash, hashList = [], link;
    //var links = doc.getElementsByClassName('imagnet'), hash, hashList = [], link;
    //Firebug.Console.log(linksAll.length);
    for(var i=0; i<linksAll.length; i++) {
        //Firebug.Console.log(linksAll[i]);
        if(linksAll[i].href) {
            hash = linksAll[i].href.replace(
                    //new RegExp('^.*?:([a-zA-Z0-9]{40})(&.*)?$', 'gi'),
                    new RegExp('^(?:.*?' + type + '\\b)?([a-f0-9]{40}|[A-Z0-9]{40})(?:\\b.*)?$', 'gi'),
                    '$1');
            //Firebug.Console.log(hash);
            if(hash != linksAll[i].href) {
                linksAll[i]['_hash'] = hash;
                hashList.push(hash);
                links.push(linksAll[i]);
            }
        }
    }
    //Firebug.Console.log(links);
    // now load all data
    furkUploader.getFileInfo(hashList, function(r){
        //Firebug.Console.log(r);
        for(var i=0; i<links.length; i++) {
            if(r[links[i]._hash.toUpperCase()]) {
                link = doc.createElement('a');
                link.setAttribute('title', furkUploader.messages.getString('direct_download'));
                link.setAttribute('href', r[links[i]._hash.toUpperCase()].url_page);
                link.style.cssText = 'width:32px;height:16px;display:inline-block;margin:1px;' +
                                     (css || '') +
                                     // can't use chrome:// urls in web pages =(
                                     ';background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oFGhILHo5sPtQAAAPRSURBVEjHxVVdaFxFGD0z929/kmY3P8aYmNQ2lWJKakxjX1prfdAiikKtDSQ0trZVREUjiOBKFFb7VkiFPlSLtCSaihaqkW78CxahGhK0logxEdLqBpImm927uzebvTPz+ZANibgJ6VMvXC7cmXO+M+ebOcMAwOkeJtyCx9dSx9hicV9LHbtZgvf6p7YD2AFA5BsvNDWr0NSOP9MU+N/4Yl39pop/WlYD4HMAITx9IyJc8TiAN5cmMABLZgqN4Cp6P59AX0sdc7qHSV/zcrtLA5DUefSRZxtP9Z0O45NSSHBBAHwGg1D0oVCwdL60FknMR4zJ1WjXJuBsiQmF4w13bW1KJpNoe6h165mvu8IE9Fo6g8fQ8MqO0iNroYoPRAP+Sr8yKgP22gR8VMyg0LH+9poHa4qr77BTtvvD5Ut/QNHbSqptkjNoXMsLvd7aU8ul1sEtw/LurP7MuRI96Jz9dWPG1MTkicvt/xXwQfEeAGEAIRyJRZYaiedLioJ77y6vXZ9Kp9Tgn4NjqXSqE4djvbiIbQwAz0199/tJr5AAKUJ1pd9lx74qUVzuh4Ce/m5sHykoIlLcq2eLm7f8jdFEDnsyuAeCwoeeOHgfBIVxMrgn9/8xD7deqCio2Dg+Po6Bqz//FY/Hu3E4dhoADJ2DCJhOZamjb4KEUI5SylGkHDYvO/zXnQyTDMolRpZmG40VbUZD2cPW7g3v+O6vGl5yQKhw694D9RMTE6z50eZ7ey58HMaJok068QOV5ZWb0iKtx+Iz43Yy8QU4O7ZojqFzZLISjGtoqPLAFQoSLK2D/DNzbl+23NAhCDAB787q10oPNXXloP2LHAsOCAp19Zz5zfKa2YHRAW3XA7u3wKW22+4s35zRM1YsPh1NxGb7IRHCi3G1CHaFhM6BinUae/KeIravPsia6wMFT9UH2XPby37Mmh4DFgP3mZgfmvwm3z5ZENBuR+BS6ML581eD6wJzI8kRa/OuukYZUAUp276RiM4OQFI7Xk1kloMlMTAGqJUOGpOAAqAx8AJTX1kAALyRjECo0FDkp981ydNTbApzqXTcHoldgaKX8Hoyno/AVQxZpfILyAKkAMwr0Jpy4K10BPtNRONjYV9TUdXcL/YYXVMv41w2mg/s0YBrtgt7fpUg1QBwhpUU6MucKAQQwLlsFI38lDMzfRSD6MSwAoANADIA5nNvFoB76Z8MXEWoLTLyd8DDQIIxaGz1JHS6h6Wvpc4LIAEggyHViyF8iYUOqlyWCwBy2RdcqVGT8C0xyp9E4LMguggiPyScfJcRu9XX8b+S4bef5zSEfAAAAABJRU5ErkJggg%3D%3D) no-repeat transparent;';
                if(links[i].nextSibling) {
                    links[i].parentNode.insertBefore(link, links[i].nextSibling);
                }
            }
        }
    });
}

// adapters object contains rules for different torrent sites
furkUploader.adapters = {
    'thepiratebay.org': {
        // torrent page (add bar)
        '^\\\/torrent\\\/[0-9]+\\\/': furkUploader.findHashFromMagnetLink,
        // all pages (add furk link near magnet/dht links)
        '^.*': furkUploader.appendFurkLinks
    },

    // TODO bar isn't appear on this site on browser start
    'torrentz.eu': {
        '^\\\/[a-zA-Z0-9]{25,}': furkUploader.findHashFromURL,
        '^.*': furkUploader.appendFurkLinks
    },

    'isohunt.com': {
        '^\\\/torrent_details\\\/[0-9]+\\\/': function(doc) {
            var hash = doc.getElementById('SL_desc').innerHTML.replace(
                new RegExp('^.*? ([a-zA-Z0-9]{25,} (.*)?$)', 'gi'),
                '$1');
            hash && furkUploader.showInfoBrowser(hash);
        },
        '^.*': furkUploader.appendFurkLinks
    },

    // TODO
    /*'rutracker.org': {
        '^':
    },*/

    // TODO check it
    'btjunkie.org': {
        '^\\\/torrent/[^\\\/]+\\\/[a-zA-Z0-9]+': furkUploader.findHashFromURL,
        '^.*': furkUploader.appendFurkLinks
    },

    'kat.ph': {
        '^\\\/.*?.html': furkUploader.findHashFromMagnetLink,
        //'(^\\\/?$)|(^\\\/.*?\\\/$)|(^\\\/usearch\\\/)': function(doc) {
        '^.*': function(doc) {
            furkUploader.appendFurkLinks(doc, 'magnet', 'float:right;margin-left:4px;');
        }
    },

    // TODO site is down now
    /*'demonoid.met': {
        //
    },*/

    'extratorrent.com': {

        '^\\\/torrent\\\/[0-9]+\\\/': function(doc) {
            var tds = doc.getElementsByTagName('TD'), hash;
            for(var i=0; i<tds.length; i++) {
                if(tds[i].innerHTML.match(new RegExp('^([a-zA-Z0-9]{25,})$'))) {
                    hash = tds[i].innerHTML;
                    break;
                }
            }

            //Firebug.Console.log(hash);

            hash && furkUploader.showInfoBrowser(hash);
        },
        '^.*': furkUploader.appendFurkLinks
    },

    'torrentreactor.net': {
        '^\\\/torrents\\\/[0-9]+\\\/': furkUploader.findHashFromMagnetLink,
        '^.*': furkUploader.appendFurkLinks
    },

    'monova.org': {
        '^\\\/torrent\\\/[0-9]+\\\/': furkUploader.findHashFromDHTLink,
        '^.*': furkUploader.appendFurkLinks
    },


    '1337x.org': {
        '^\\\/torrent\\\/[0-9]+\\\/': furkUploader.findHashFromMagnetLink,
        '^.*': furkUploader.appendFurkLinks
    },
};
