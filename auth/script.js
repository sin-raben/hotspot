//'use strict';

var SendTel = {};

function sendTel(argument) {
    console.log("sendTel", 1);
    var btg = document.getElementById('btnGetC');
    var bts = document.getElementById('btnSednC');
    SendTel = {
        status: false
    };
    var http = new XMLHttpRequest();
    var url = "get_Tel";
    var phoneNumber = document.getElementById('phoneNumber').value.trim();
    if (phoneNumber === "") return;
    var params = "phoneNumber=" + phoneNumber;
    http.open("POST", url, true);

    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    http.onreadystatechange = function() { //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            //alert(http.responseText);
            console.log("title", http.responseText);
            btg.disabled = true;
            bts.disabled = false;
            try {
                SendTel = JSON.parse(http.responseText);
            } catch (err) {
                console.log("err", err);
            }

        }
    };
    http.send(params);
}

function sendCode(argument) {
    var btg = document.getElementById('btnGetC');
    var bts = document.getElementById('btnSednC');
    //passPhoneNumber

    console.log("2", 1);
    var http2 = new XMLHttpRequest();
    var url = "set_Cod";
    var passPhoneNumber = document.getElementById('passPhoneNumber').value.trim();
    console.log("title");
    if ((passPhoneNumber === "") || (!SendTel.status)) {
        console.log("****");
        btg.disabled = false;
        return;

    }
    try {
        var params = "authCode=" + passPhoneNumber;
        console.log("params", params);
        http2.open("POST", url, true);
        //Send the proper header information along with the request
        http2.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http2.send(params);

    } catch (err) {
        console.log("err", err);
    }



    http2.onreadystatechange = function() { //Call a function when the state changes.
        var btg = document.getElementById('btnGetC');
        if (http2.readyState == 4 && http2.status == 200) {
            //alert(http.responseText);
            console.log("title", http2.responseText);
            try {
                var res = JSON.parse(http2.responseText);
                if (res.status === true) {
                    //тут автопереход на недоперейденную страницу
                    alert("Авторизация пройдена успешно");
                } else {

                    btg.disabled = false;
                    alert("Ошибка");
                }
            } catch (err) {

                btg.disabled = false;
                console.log("err", err);
            }

        }
    };

}
