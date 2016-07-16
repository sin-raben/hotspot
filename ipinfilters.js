/*jshint node:true, esversion: 6, undef: true, unused: true*/

var fun = function (ip, filters) {
    //получить ip с наложенной маской
    var ipAndMask = function(ip, mask) {
        var ipAr = ip.split('.');
        var ipN = 0;
        for (var i = 0; i < ipAr.length; i++) {
            ipN += (+ipAr[i]) << (3 - i) * 8;
        }
        ipN = ipN >>> (32 - mask);
        ipN = ipN << (32 - mask);
        return ipN;
    };

    //проверить наличие фильтра в маске
    var ipCompare = function(ip, filter) {
        for (var i = 0; i < filter.length; i++) {
            var ipM1 = ipAndMask(ip, filter[i].mask);
            var ipM2 = ipAndMask(filter[i].ip, filter[i].mask);
            if (ipM1 === ipM2) {
                return true;
            }
        }
        return false;
    };

    var res = [];
    for (var prop in filters) {
        if (ipCompare(ip, filters[prop])) {
            res.push(prop);
        }
    }
    return res;
};



module.exports = fun;

//подключить маску фильтрации ip var filter = require('./o').filter;
