var spawn = require('child_process').spawn;
function getMAC(ip) {
    return new Promise(function(resolve, reject) {
        var ping = spawn("ping", ["-c", "1", ip]);
        ping.on('close', function() {
            // not bothered if ping did not work
            var arp = spawn("arp", ["-n", ip]);
            var buffer = '';
            var errstream = '';
            arp.stdout.on('data', function(data) {
                buffer += data;
            });
            arp.stderr.on('data', function(data) {
                errstream += data;
            });

            arp.on('close', function(code) {
                if (code !== 0) {
                    console.log("Error running arp " + code + " " + errstream);
                    reject(code);
                    return;
                }
                var table = buffer.split('\n');
                if (table.length >= 2) {
                    var parts = table[1].split(' ').filter(String);
                    resolve(parts[2]);
                    return;
                }
                reject(true, "Could not find ip in arp table: " + ip);
            });
        });
    });
}
module.exports = getMAC;
