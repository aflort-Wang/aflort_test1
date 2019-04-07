var config = require('./config');
var route = require('./route');
var mgdb = require('./mgdb');
var fs = require('fs');
mgdb.mdb.connect(function (err, db) {
  if (err) {
    console.log(err.message);
  }
  require('http').Server(require('./route').express).listen(config.service_port, function (req, res) {
    // res.writeHead(301, {
    //   'Location': 'https://www.honghengxinxi.com'
    // });
    // res.end();
  });
  const httpsOption = {
    key: fs.readFileSync("./https/2_kfappsr.honghengxinxi.com.key"),
    cert: fs.readFileSync("./https/1_kfappsr.honghengxinxi.com_bundle.crt")
  }
  require('https').createServer(httpsOption, require('./route').express).listen(config.httpsservice_port, function () {

  });
});
process.on('uncaughtException', function (err) {
  console.log('[' + new Date().toLocaleString() + ']');
  console.log(err.stack);
});
