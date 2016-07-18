'use strict';
/*jshint node:true, esversion: 6, undef: true, unused: true*/
const koa = require('koa'),
    formidable = require('koa-formidable'),
    http = require('http'),
    https = require('https'),
    server = require('koa-static'),
    fs = require('fs'),
    url = require('url'),
    SMSru = require('sms_ru'),
    getMAC = require('./getmac'),
    ipInFilters = require('./ipinfilters'),
    filters = require('./o');
var pgp = require('pg-promise')();
var cn = 'postgres://postgres:postgres@localhost:5432/hotspot';
var db = pgp(cn);
const exec = require('child_process').exec;
var host = "192.168.0.219";
try {
    var sms = new SMSru("api_id");
    /*sms.sms_send({
        to: '79112223344',
        text: 'Текст SMS'
    }, function(e) {
        console.log(e.description);
    });*/

} catch (err) {
    console.log('err', err);
}


var returnPath = {
    'filter1': './auth',
    'filter2': './static'
};

var trueUsers = {};
//не авторизованные коды доступа, код доступа одноразовый
//var authCode = {};
var authUsers = {};
var ff = (url, path, h) =>
    new Promise(function(resolve, reject) {
        if ((url.path !== '/index.html') && (host === h)) {
            if (url.search === "") {
                fs.exists(path + url.path, function(exists) {
                    if (exists) {
                        resolve(false);
                    }
                });
            }
        }

        fs.readFile(path + '/index.html', (err, data) => {
            if (err) reject();
            resolve(data.toString());
        });
    });

var addMac = (mac) =>
    new Promise(function(resolve, reject) {
        exec('iptables -I internet 1 -t mangle -m mac --mac-source "' + mac + '" -j RETURN', (error, stdout, stderr) => {
            resolve(stdout);
            reject(stderr);
        });
    });
var removeMac = (mac) =>
    new Promise(function(resolve, reject) {
        exec('iptables -D internet -t mangle -m mac --mac-source "' + mac + '" -j RETURN', (error, stdout, stderr) => {
            resolve(stdout);
            reject(stderr);
        });
    });


// Запрос пользователей которые имеют доступ к инету trueUsers
db.query("SELECT mac, ip, sb, se FROM sessions WHERE status = 4 AND se > now()").then((value) => {
    value.forEach(elem => {
        trueUsers[elem.mac] = {
            mac: elem.mac,
            ip: elem.ip,
            sb: new Date(Date.parse(elem.sb)),
            se: new Date(Date.parse(elem.se))
        };
        //addMac(elem.mac).then(()=>{});
    });
    //console.log("value", trueUsers);
});

/*trueUsers["93:DE:80:7F:84:BE"]={
    "mac": "93:DE:80:7F:84:BE",
    ip: "elem.ip",
    sb: new Date(),
    se: new Date((+new Date())+10000)

};
console.log("value", trueUsers);*/

// Запрос пользователей которые имеют доступ к инету authUsers
db.each("SELECT mac, ip, mobile, pin, sb, se, status FROM sessions WHERE status > 0 AND status < 4", [], elem => {
    authUsers[elem.mac] = {
        mac: elem.mac,
        ip: elem.ip,
        mobile: elem.mobile,
        pin: elem.pin,
        sb: new Date(Date.parse(elem.sb)),
        se: new Date(Date.parse(elem.se))
    };
})
    .then(data=>{
        // you don't need this `.then`, only if you want to do something here:
        console.log("authUsers ", authUsers);
    });

//



var app = koa();

var genPost = function*(ip, mac, obj) {
    //наличие в очереди авторизации
    if (authUsers[mac]) {
        var form = yield formidable.parse(obj);
        if (form.fields.phoneNumber) {
            console.log('11111111', 11111111);
            //добавить проверку на корректость номера и отправить смс на номер
            if (true) {
                authUsers[mac].mobile = "" + form.fields.phoneNumber;
                authUsers[mac].pin = ('000000' + (~~(10000 * Math.random()))).slice(-4);
                sms.sms_send({
                    to: authUsers[mac].mobile,
                    text: 'Код доступа' + authUsers[mac].pin
                }, function(e) {
                    console.log(e.description);
                });
                //console.log('pin', authUsers[mac].pin);
                yield db.query("UPDATE sessions SET mobile = ${mobile}, pin = ${pin}, status = 1 WHERE mac = ${mac} AND ip = ${ip} AND status = 0", {
                    mac: mac,
                    ip: ip,
                    mobile: authUsers[mac].mobile,
                    pin: authUsers[mac].pin
                });


                return '{"status": true,"pin": "' + authUsers[mac].pin + '"}';
            } else {
                return '{"status": false}';
            }
        }
        if (form.fields.authCode) {
            if (+authUsers[mac].pin === +form.fields.authCode) {


                console.log("Победа"); /*добавить в базу дданных информацию о пользователе, добавить разрешающее правило в iptables*/
                yield addMac(mac);
                trueUsers[mac] = authUsers[mac];
                trueUsers[mac].sb = +(new Date());
                trueUsers[mac].se = +trueUsers[mac].sb + 60 * 60 * 1000; //предустановен час сеанса
                console.log('trueUsers[mac]', trueUsers[mac]);
                yield db.query("UPDATE sessions SET status = 4, se = ${se} WHERE mac = ${mac} AND ip = ${ip} AND status >0 AND status <4 ", {
                    mac: mac,
                    ip: ip,
                    se: new Date(trueUsers[mac].se - new Date().getTimezoneOffset() * 60000)
                });
                delete authUsers[mac];
                return '{"status": true}';
            } else {
                console.log("false code");
                return '{"status": false}';
            }
        }
    } else {
        console.log('+1', +1);
    }
    return;
};
var genNewUser = function*(mac, ip, urlParsed, useragent) {
    //проверка на наличие в списке очереди на авторизацию, возможно добавить проверку базы данных на наличие известных нам mac-адресов или адресов у которых не закончилась аренда
    console.log("Первый запрос");
    if (false) {
        yield formidable.parse();
    }

    //проверить БД на наличие активной подписки, актуально при рестарте сервера
    // var newSession = yield db.query("SELECT ");
    var newSession = yield db.query("INSERT INTO sessions (mac, ip, data) VALUES (${mac}, ${ip}, ${data} )", {
        ip: ip,
        mac: mac,
        data: {
            url: urlParsed,
            headers: {
                "user-agent": useragent
            }
        }
    });
    console.log('newSession', newSession);

    let newUser = {
        mac: mac,
        ip: ip,
        tel: '',
        url: urlParsed,
        headers: {
            "user-agent": useragent
        }
    };
    return newUser;
};

app.use(function*(next) {
    var urlParsed = url.parse(this.req.url, true);
    var ip = this.req.connection.remoteAddress.slice(7);
    var mac = yield getMAC(ip);
    console.log("ip:", ip, "mac:", mac, "url:", this.req.url, "method:", this.req.method, "filters:", ipInFilters(ip, filters));
    //console.log("urlParsed", urlParsed, "\n", this.req.url);
    if (this.req.method === 'POST') {
        this.body = yield genPost(ip, mac, this);
        return;
    }
    //проверка на наличие в списке автаризованных

    console.log('urlParsed', urlParsed);
    if (trueUsers[mac]) {
        this.res.statusCode = 200;
        this.body = "Я тя помню";
    } else {
        if (!authUsers[mac]) {
            authUsers[mac] = yield genNewUser(mac, ip, urlParsed, this.req.headers["user-agent"]);
        }
        //вернуть страницу
        var ffilt = ipInFilters(ip, filters);
        if (ffilt.length > 0) {
            var path = returnPath[ffilt[0]];
            var r = yield ff(urlParsed, path, this.request.host);
            if (r) {
                if (urlParsed.pathname == '/index.html') {
                    this.response.status = 401;
                    //this.response.statusMessage = 'Not found';
                    //this.res.setHeader('WWW-Authenticate', 'Basic realm="myRealm"');
                    console.log('401', 401);
                    //this.res.setHeader('refresh', '0; url=http://192.168.0.219/index.html');
                    this.body = r;
                } else {
                    this.response.status = 511;
                    console.log('511', 511);
                    //console.log('this.response', this.request.host);
                    //this.status = 511;/**/
                    this.res.setHeader('refresh', '0; url=http://' + host + '/index.html?url="' + this.request.host + this.req.url + '"');
                    this.body = r;
                }
            } else {
                yield server(path, {});
            }
        } else {
            this.body = 'админ - лох';
        }
    }
    return next;
});





setInterval(function function_name() {
    var time = +(new Date());
    for (let mac in trueUsers) {
        if (trueUsers[mac].se < time) {
            console.log("Аренда окончена", mac);
            delete trueUsers[mac];
            removeMac(mac).then(() => {});
            //убираем разрешение из iptables
        }
    }
}, 6000);
var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: "2280273"
};
http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);
/**/
