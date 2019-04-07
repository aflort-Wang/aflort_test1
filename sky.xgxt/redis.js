var config = require('./config');

startRedis();
function startRedis(){
    //开启 Redis
    require('child_process').exec('redis.exe redis.conf');
    console.log(`[Redis] 缓存服务已经运行 ${config.redis_ip}:${config.redis_port}`);
}

var client = exports.client = 
    require('redis').createClient(config.redis_port, config.redis_ip).on("error", function(error) {
    startRedis();
});

//npm install --save child_process
//npm install --save compression
//npm install --save connect-multiparty

//发布前
//npm install --save-dev child_process
//npm install --save-dev compression
//npm install --save-dev connect-multiparty