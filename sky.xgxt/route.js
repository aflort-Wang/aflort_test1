var config = require('./config');
var redis = require('./redis');
var express = require('express');
var webrequest = require('request');
var web = exports.express = express(); //express.js
var bodyParser = require('body-parser');
var path = require('path');
var token = require('./token');
var ueditor = require("ueditor");
var compression = require('compression');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var XLSX = require('xlsx');
var TITLE = "'Express'";
var formidable = require("formidable");
var svgCaptcha = require('svg-captcha');
var UUID = require('uuid');
var mgdb = require('./mgdb');
var mammoth = require("mammoth");
var crypto = require('crypto');
const fs = require('fs');

var time = 0;
var time1 = 0;
var time2 = 0;
var access_token = "";
var aitoken = "";
var gz_access_token = "";
var lastmedia_id = "";
var lastmedia_load = false;
//跨域设置
function setHeader(req, res) {
    if (req.header("Origin")) {
        res.setHeader("Access-Control-Allow-Origin", req.header("Origin"));
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Headers", "x-requested-with,content-type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "OPTION,POST,GET");
}

function ResultJson(res, result) {
    try {
        res.json(result);
    } catch (error) { }
}

function IsNullOrEmpty(val) {
    return val == null || val == undefined || val == '';
}

function GetValue(req, key) {
    if (req.query && req.query[key]) {
        return req.query[key];
    }
    if (req.body && req.body[key]) {
        return req.body[key];
    }
}

function GetTimeStamp() { return new Date().getTime(); }
web.use(bodyParser.json({ limit: '50mb' }));
web.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// web.use(bodyParser.urlencoded({
//     extended: true
// }));
// web.use(bodyParser.json());
//服务配置
web.use(compression(({
    filter: function (req, res) {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
})));
web.use(express.static('ueditor'));
//HTTP 推流
web.use("/ueditor", ueditor(path.join(__dirname, 'upload'), function (req, res, next) {
    // if (!req.session.sign) {
    //     res.send({ msg: "没有权限", code: 1001 });
    //     res.end();
    //     return;
    // }
    // ueditor 客户发起上传图片请求
    switch (req.query.action) {
        case 'uploadimage':
            {
                //var foo = req.ueditor;
                //	var imgname = req.ueditor.filename;
                var img_url = '/image/';
                //你只要输入要保存的地址 。保存操作交给ueditor来做
                res.ue_up(img_url);
            }
            break;
        case 'listimage':
            {
                var dir_url = '/image/';
                // 客户端会列出 dir_url 目录下的所有图片
                res.ue_list(dir_url);
            }
            break;
        case 'uploadfile':
            {
                var img_url = '/file/';
                //你只要输入要保存的地址 。保存操作交给ueditor来做
                res.ue_up(img_url);
                res.setHeader('Content-Type', 'text/html');
            }
            break;
        case 'uploadvideo':
            {

                var img_url = '/video/';
                //你只要输入要保存的地址 。保存操作交给ueditor来做
                res.ue_up(img_url);
            }
            break;
        default:
            {
                res.setHeader('Content-Type', 'application/json');
                res.redirect('/nodejs/config.json');
            }
            break;
    }

}));
web.use(cookieParser());
web.use(session({
    resave: true, // don't save session if unmodified
    cookie: { maxAge: 60 * 1000 * 30 }, // 过期时间（毫秒）
    saveUninitialized: false, // don't create session until something stored
    secret: 'love'
}));

web.use(function (req, res, next) {
    setHeader(req, res);
    next();

});
web.use(function (req, res, next) {
    var ua = req.headers['user-agent'];
    if (!ua) return next();
    if (ua.indexOf('NetType') != -1) {
        redis.client.zadd('apponline', Date.now(), ua, next);
    }
    else {
        redis.client.zadd('htonline', Date.now(), ua, next);
    }

    var n = process.uptime() - time;
    if (time == 0 || n > 7000) {

        webrequest.post({
            url: 'https://api.weixin.qq.com/cgi-bin/token', form: {
                appid: 'wx79f1414a76c943f8',
                secret: 'e449cec17a8788efd64c65be9d7deecf',
                grant_type: 'client_credential'
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let obj = JSON.parse(body);
                if (obj.access_token) {
                    access_token = obj.access_token; //存session用于验证接口获取文字码
                    time = process.uptime();
                    req.session.access_token = access_token;

                } else {

                }
            }
        })

        webrequest.post({
            url: 'https://api.weixin.qq.com/cgi-bin/token', form: {
                appid: 'wx02098ac1c4d34c01',
                secret: '4084471c7df858fe1851746ff84ea8bb',
                grant_type: 'client_credential'
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let obj = JSON.parse(body);
                if (obj.access_token) {
                    gz_access_token = obj.access_token; //存session用于验证接口获取文字码 
                    req.session.gz_access_token = gz_access_token;
                } else {

                }
            }
        })

    }
    else {
        req.session.access_token = access_token;
        req.session.gz_access_token = gz_access_token;
    }
    var n1 = process.uptime() - time1;
    if (time1 == 0 || n1 > 2591800) {

        webrequest.post({
            url: 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=bf57FRoW4fTAdp24zPihMhv9&client_secret=lGl3QuEjOb0b8wilXXZxET4IiFI3uCE5'
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let obj = JSON.parse(body);
                if (obj.access_token) {
                    aitoken = obj.access_token; //存session用于验证接口获取文字码
                    time1 = process.uptime();
                    req.session.aitoken = access_token;

                }
            }
        })
    }
    else {
        req.session.aitoken = aitoken;
    }

    var n2 = process.uptime() - time2;

    if (!lastmedia_id) {
        let sql = "var dt = await db.collection('tzgg');\r\n var rs = await dt.find(where, para).sort({ TZSJ: -1 }).toArray();\r\nif (rs && rs.length > 0) {\r\ncallback({id:rs[0].media_id})};"
        let para = {
            where: { media_id: { $ne: '' } },
            pagerows: 1,
            session: req.session,
            tablename: "tzgg"
        }
        mgdb.mdb.searchDataJs(sql, para, function (result) {
            lastmedia_load = true;
            lastmedia_id = "123";
            if (result.id)
                lastmedia_id = result.id;
        });
    }
    if ((time2 == 0 || n2 > 300) && gz_access_token && lastmedia_load) {
        // var tzdt = await db.collection('yzxwtz');

        var data = ("{ \"type\": \"news\", \"offset\":0, \"count\":1 }");
        webrequest.post({
            url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=' + gz_access_token, form: data
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let obj = JSON.parse(body);
                time2 = process.uptime();
                if (obj.item_count == 1) {//o1dOl5NA4xXDx6hxgxC9XBQx7e6k
                    let _media_id = obj.item[0].media_id;
                    if (_media_id != lastmedia_id) {
                        lastmedia_id = _media_id
                        webrequest.post({
                            url: 'https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=' + gz_access_token,
                            form: ("{\"media_id\":\"" + _media_id + "\"}")
                        }, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                let obj1 = JSON.parse(body);
                                let rows = [];
                                for (let row of obj1.news_item) {
                                    if (row.title) {
                                        rows.push({
                                            ID: row.thumb_media_id,
                                            TPLB: row.thumb_url,
                                            BT: row.title,
                                            GGLX: "01", DWBH: "BC4FC4D7606534C9030200764E23739A",
                                            TZNR: row.content.replace(/<\/?.+?\/?>/g, ""),
                                            TZSJ: new Date(obj1.update_time * 1000).toLocaleString(),
                                            TZDX: [],
                                            URL: row.url,
                                            TZLX: "01",
                                            SHZT: 2,
                                            FSR: "oK_pV476jfUHHNxZVckfujtDKNaE",
                                            SJ: new Date().getTime(),
                                            GXSJ: new Date().getTime(),
                                            media_id: _media_id
                                        })
                                    }
                                }
                                mgdb.mdb.insertData(rows, "tzgg", function (result) { });
                                mgdb.mdb.insertData(rows, "yzxwtz", function (result) { });
                            }
                            webrequest.post({
                                url: config.TPDZ + "/list/settzwy",
                            });
                        });

                    }
                }
            }
        })
    }

});
web.all('/getAIToken', function (req, res) {
    res.send({ access_token: req.session.aitoken });
    return;
});
web.use(function (req, res, next) {
    var min = 60 * 1000;
    var ago = Date.now() - min;
    redis.client.zrevrangebyscore('apponline', '+inf', ago, function (err, users) {
        if (err) return next(err);
        req.session.apponline = users.length;
        // next();
    });
    redis.client.zrevrangebyscore('htonline', '+inf', ago, function (err, users) {
        if (err) return next(err);
        req.session.htonline = users.length;

    });
    next();
});

web.use(express.static('web'));
web.use('/upload', express.static('upload'));
web.use('/nodejs', express.static('nodejs'));
web.post('/deluploader', function (req, res) {

    var paraStr = GetValue(req, 'para');
    var where = null;
    var para = null;
    var tablename = 'fjxx';
    if (paraStr) {
        para = JSON.parse(paraStr);
        if (para) {
            where = para.where;
            if (where) {
                //	var mgdb = require('./mgdb');

                var ffs = where.split(',');
                for (var i = 0; i < ffs.length; i++) {
                    var element = ffs[i];
                    fs.unlink(ffs[i], function () {

                    });
                }

                res.send({ msg: '成功', Success: true });
            }
        } else {
            res.end();
        }

    }
    else {
        res.end();
    }

});
web.post('/wxapi', function (req, res) {
    var code = GetValue(req, 'js_code');
    webrequest.post({
        url: 'https://api.weixin.qq.com/sns/jscode2session', form: {
            appid: 'wx79f1414a76c943f8',
            js_code: code,
            secret: 'e449cec17a8788efd64c65be9d7deecf',
            grant_type: 'authorization_code'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            res.send(JSON.parse(body));
        }
    })
});

let trm_access_token = null;
let isaccess_token = true;
web.all('/getAccessToken', function (req, res) {
    gettoken(req, res)
});
function gettoken(req, res) {
    if (!isaccess_token && access_token) {
        res.send({ access_token: access_token });
        return;
    }
}
web.all('/getWXYQS', function (req, res) {
    var data = ("{ \"begin_date\": \"20181101\", \"end_date\":\"20181130\" }");
    webrequest.post({
        url: 'https://api.weixin.qq.com/datacube/getweanalysisappidmonthlyvisittrend?access_token=' + req.session.access_token, form: data
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let obj = JSON.parse(body);
            res.send({ data: obj, code: 0 });
        }
    });

});
web.post('/WordIn', function (req, res) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    //临时目录
    form.uploadDir = './upload/';
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小

    form.parse(req, function (err, fields, files) {

        if (err) {
            res.locals.error = err;
            res.render('index', { title: TITLE });
            return;
        }
        var data = [];
        let lastindex = files.file.path.lastIndexOf('.');
        var extName = lastindex > -1 ? files.file.path.substring(lastindex) : "";
        if (extName == ".docx") {
            mammoth.extractRawText({ path: files.file.path })
                .then(function (result) {
                    var text = result.value; // The raw text 
                    var rows = text.split('\n\n');
                    data = rows;
                    res.send({ rows: data, total: data.length });
                    res.end();
                }).done();
        }


        // res.send({ rows: data, total: data.length });
        //res.end();
    });

});
web.post('/ExcellIn', function (req, res) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    //临时目录
    form.uploadDir = './upload/';
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小

    form.parse(req, function (err, fields, files) {

        if (err) {
            res.locals.error = err;
            res.render('index', { title: TITLE });
            return;
        }

        let lastindex = files.file.path.lastIndexOf('.');
        var extName = lastindex > -1 ? files.file.path.substring(lastindex) : "";


        // avatarName = Math.random() + extName;
        const workbook = XLSX.readFile(files.file.path);
        var fromTo = '';
        // 遍历每张表读取
        var data = [];
        for (var sheet in workbook.Sheets) {
            if (workbook.Sheets.hasOwnProperty(sheet)) {
                fromTo = workbook.Sheets[sheet]['!ref'];

                data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                //发现json格式不是你想要的你可以
                //XLSX.utils.sheet_to_json(workbook.Sheets[sheet],{raw:true, header:1})
                // 如果只取第一张表，就取消注释这行

                //break; // 如果只取第一张表，就取消注释这行
            }
        }
        res.send({ rows: data, total: data.length });
        res.end();
    });

});
web.all('/getCode', function (req, res) {
    var codeConfig = {
        size: 5, // 验证码长度
        ignoreChars: '0o1i', // 验证码字符中排除 0o1i
        noise: 2, // 干扰线条的数量
        height: 40,
        width: 100
    }
    var captcha = svgCaptcha.createMathExpr();//.create(codeConfig);
    req.session.captcha = captcha.text.toLowerCase(); //存session用于验证接口获取文字码
    var codeData = {
        data: captcha.data,
        code: 0
    }
    res.send(codeData);
    res.end();
});
web.post('/uploader', function (req, res) {
    var form = new formidable.IncomingForm(); //创建上传表单
    form.encoding = 'utf-8'; //设置编辑
    //临时目录
    form.uploadDir = './upload/';
    form.keepExtensions = true; //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.locals.error = err;
            res.render('index', { title: TITLE });
            return;
        }
        var file = files.file;
        if (!file) {
            file = files.uploadfile_ant
        };
        //图片写入地址；
        var newPath = file.path;
        var newfile = { ID: UUID.v1(), SCWJM: file.name, XWJM: file.path, size: file.size }
        //var mgdb = require('./mgdb');
        mgdb.mdb.insertData([newfile], 'fjxx', function (result) {
            result.ops[0].code = 0;
            result.ops[0].msg = "成功";
            result.ops[0].data = { src: config.TPDZ + result.ops[0].XWJM };
            if (result) {
                //console.log(result);
                res.send(result.ops);
                res.end();
            }
        })
        //显示地址；


    });
});
web.post('/uploaderex', function (req, res) {

    var form = new formidable.IncomingForm(); //创建上传表单
    form.encoding = 'utf-8'; //设置编辑
    //临时目录
    form.uploadDir = './upload/';
    form.keepExtensions = true; //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.locals.error = err;
            res.render('index', { title: TITLE });
            return;
        }
        //console.log(files);
        var file = files.file;
        if (!file) {
            file = files.uploadfile_ant

        };

        //图片写入地址；
        var newPath = file.path;
        var newfile = { ID: UUID.v1(), SCWJM: file.name, XWJM: file.path, size: file.size }
        //var mgdb = require('./mgdb');
        mgdb.mdb.insertData([newfile], 'fjxx', function (result) {

            if (result) {
                let r = {};
                r.code = 0;
                r.msg = "成功";
                r.data = { src: config.TPDZ + result.ops[0].XWJM };
                res.send(r);
                res.end();
            }
        })
        //显示地址；


    });
});
web.post('/face', function (req, res) {
    var form = new formidable.IncomingForm(); //创建上传表单

    form.encoding = 'utf-8'; //设置编辑
    //临时目录
    form.uploadDir = './upload/video';
    form.keepExtensions = true; //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
    form.parse(req, function (err, fields, files) {
        var idname = fields.idname
        var idnumber = fields.idnumber;
        var IMG1 = fields.IMG1;
        var IMG2 = fields.IMG2;


        var file = files.file;
        if (!file) {
            file = files.video_file
        };

        //视频写入地址；
        var newPath = file.path;
        function authorize() {
            var signatureArray = []
            var timeStamp = Date.now()
            var nonce = (Math.random().toString(36).substr(2))
            var apiId = "86b04cbf0bad413da6532f97c5ecaadd"
            var apiSecret = "b7aa4b6173774f38b98651f9ccbdb9cd"
            signatureArray.push(timeStamp, nonce, apiId)
            var signatureString = signatureArray.sort().join('')

            var hash = crypto.createHmac('sha256', apiSecret);
            hmac = hash.update(signatureString).digest("hex");
            var authorization = 'key=' + apiId + ',timestamp=' + timeStamp + ',nonce=' + nonce + ',signature=' + hmac

            return authorization
        }
        var formData= ({
            'video_file': fs.createReadStream("./upload/video/upload_a41a72ba5df077763f2d0ffdac94c0b4.mp4"),
            'name': idname,
            'idnumber': idnumber,
            'return_status': true
        })
        webrequest.post({
            headers: {
                "content-type": "multipart/form-data",
                'Authorization': authorize()
            },
            url: "https://v2-auth-api.visioncloudapi.com/identity/silent_idnumber_verification",
            formData:formData
        }, function (err, resp, body) {
            console.log(body)
            try {
                var response = JSON.parse(body);
                res.send(response)
            } catch (e) {
                res.send(body)
                return
            }

        })

    });
});
//路由ping
web.all('/route', function (req, res) { res.end(); });


web.all('/list/:jkdm', function (req, res) {
    let find = false;
    if (req.originalUrl.indexOf("saveDrgzgl") > -1) {
        let a = 1;
    }
    // req.session.Online=config.Online;
    var page = 0
    var rows = [];
    var sort = {};
    var paraStr = GetValue(req, 'para');
    var other = GetValue(req, 'other');
    var start = GetValue(req, 'start');
    var _page = GetValue(req, 'page');
    var limit = GetValue(req, 'limit')
    var sortstr = GetValue(req, 'sort')
    var tokens = GetValue(req, 'token');
    if (tokens) {
        if (token.checkToken(tokens)) {
            let tokenObj = token.decodeToken(tokens);
            req.session.sign = true;
            req.session.login = tokenObj.payload.data;
            req.session.isapp = true;
        }
    }
    let outtime = new Array();
    let app = 0;
    let ht = 0;
    for (let i = 0; i < config.Online.length; i++) {
        const element = config.Online[i];
        if (!element.sign) {
            outtime.push(element)
        }
        else if (element.isapp) {
            app++;
        } else {
            ht++;
        }
        if (element.id == req.session.id) {
            find = true;
            //break;
        }
    }
    for (let i = 0; i < outtime.length; i++) {
        const element = outtime[i];
        var index = config.Online.indexOf(element);
        if (index > -1) {
            config.Online.splice(index, 1);
        }
    }
    if (!find) {
        config.Online.push(req.session);
    }
    req.session.apponline = app;
    req.session.htonline = ht;
    //req.session.online=config.Online;
    if (!req.session.sign && req.params.jkdm != "Login"
        && req.params.jkdm != "reg" && req.params.jkdm != "getCode"
        && req.params.jkdm != "getwxrygl"
        && req.params.jkdm != "getxtgl_ui"
        && req.params.jkdm != "Logout"
        && req.params.jkdm != "sendmsg"
        && req.params.jkdm != "getjkdb_ui") {
        res.send({ msg: "没有权限", code: 1001 });
        res.end();
        return;
    }

    if (limit) {
        limit = parseInt(limit);
    } else {
        limit = 10;
    }
    if (start) {
        page = parseInt(start);
    }
    if (_page) {
        page = (parseInt(_page) - 1) * limit;
    }
    if (sortstr) {
        sort = JSON.parse(sortstr);
    }

    var where = {};
    var para = null;

    if (paraStr) {
        if (typeof paraStr == 'string') {
            para = JSON.parse(paraStr);
        }
        else {
            para = paraStr;
        }
        if (para) {
            if (para.page) {
                page = para.page;
            }
            if (para.rows) {
                rows = para.rows;
            }
            if (para.limit) {
                limit = para.limit;
            }
            where = para.where;
        }

    }

    //console.log(paraStr);
    var tablename = req.params.tablename;

    mgdb.mdb.searchData({ JKMC: req.params.jkdm }, 0, 10, [], 'jkdb', function (rs) {
        if (rs && rs.rows.length > 0) {
            let para = {
                page: page,
                where: where,
                pagerows: limit,
                sort: sort,
                session: req.session,
                other: other,
                rows: rows,
                tablename: tablename
            }
            req.session.inTransaction = function () { };
            mgdb.mdb.searchDataJs(rs.rows[0].JKSQL, para, function (result) {
                //console.log(result);
                res.send(result);
                res.end();
            });
        } else {
            res.end();
        }

    });


});
web.all('/SaveData/:tablename', function (req, res) {

    var paraStr = GetValue(req, 'para');
    var tokens = GetValue(req, 'token');
    if (tokens) {
        if (token.checkToken(tokens)) {
            let tokenObj = token.decodeToken(tokens);
            req.session.sign = true;
            req.session.login = tokenObj.payload.data;
        }
    }
    if (!req.session.sign && req.params.tablename != "jkdb") {
        res.send({ msg: "没有权限", code: 1001 });
        res.end();
        return;
    }
    var rows = [];
    var where = null;
    var para = null;
    var tablename = req.params.tablename;
    if (paraStr) {
        if (typeof paraStr == 'string') {
            para = JSON.parse(paraStr);
        }
        else {
            para = paraStr;
        }
        if (para) {
            rows = para.rows;
            where = para.where;
            ///     var mgdb = require('./mgdb');

            if (where) {
                //	console.log(rows);
                if (!rows.GXSJ) {
                    rows.GXSJ = Date.now();
                }

                mgdb.mdb.updateData(where, rows, tablename, function (result) {
                    //  console.log(result);
                    if (result && result.result) {

                        res.send({ msg: '成功', Success: true });

                    } else {
                        res.send({ msg: '失败', Success: false });
                    }
                    res.end();

                });
            } else {
                if (rows instanceof Array) {
                    for (let i = 0; i < rows.length; i++) {
                        const el = rows[i];
                        if (!el.ID) {
                            el.ID = UUID.v1();
                        }
                        if (!rows.CJSJ) {
                            rows.CJSJ = Date.now();
                        }

                    }
                } else {
                    if (!rows.ID) {
                        rows.ID = UUID.v1();
                    }
                    if (!rows.CJSJ) {
                        rows.CJSJ = Date.now();
                    }

                }
                mgdb.mdb.insertData(rows, tablename, function (result) {
                    //console.log(result);
                    if (result && result.result.ok) {

                        res.send({ msg: '成功', ID: rows.ID, Success: true });

                    } else {
                        res.send({ msg: '失败', ID: rows.ID, Success: false });
                    }
                    res.end();

                });
            }

        }

    } else {
        res.end();
    }




});

web.post('/DelData/:tablename', function (req, res) {
    var tokens = GetValue(req, 'token');
    if (tokens) {
        if (token.checkToken(tokens)) {
            let tokenObj = token.decodeToken(tokens);
            req.session.sign = true;
            req.session.login = tokenObj.payload.data;
        }
    }
    if (!req.session.sign) {
        res.send({ msg: "没有权限", code: 1001 });
        res.end();
        return;
    }
    var paraStr = GetValue(req, 'para');
    var rows = [];
    var where = null;
    var para = null;
    var tablename = req.params.tablename;
    if (paraStr) {
        if (typeof paraStr == 'string') {
            para = JSON.parse(paraStr);
        }
        else {
            para = paraStr;
        }
        if (para) {
            where = para.where;
            if (where) {
                //     var mgdb = require('./mgdb');
                mgdb.mdb.delDataAsy(where, tablename, function (result) {
                    // console.log(result);
                    if (result) {

                        res.send({ msg: '成功', Success: true });

                    } else {
                        res.send({ msg: '失败', Success: false });
                    }
                    res.end();

                });
            }
        }

    } else {
        res.end();
    }




});


console.log(`[Api] 接口服务已经运行 ${config.service_ip}:${config.service_port}`);