var config = require('./config');
var mongoose = require('mongodb');
mgdb = function() {
    this.MongoClient = mongoose.MongoClient;
    this.DB_CONN_STR = config.DB_CONN_STR;
    this.db = null;
}
mgdb.prototype = {
    connect: function(conncallback) {
        mdb.MongoClient.connect(mdb.DB_CONN_STR, { useNewUrlParser: true }, function(err, db) {
            mdb.db = db.db('xgdata');
            if (conncallback) {
                conncallback(err, db);
            }
        });
    },
    evil: function(fn) {
        var Fn = Function;
        return new Fn('return ' + fn)();
    },
    searchDataJs: function(runjs, _para, callback) {

        if (_para.where && _para.where._id) {
            _para.where._id = mongoose.ObjectId(_para.where._id);
        }

      //  console.log("page:" + _para.page + ",rows:" + _para.rows);

        var whereStr = _para.where;
        //var skp = _para.page;
        // var rws = _para.rows;
        var para = {
            limit: _para.pagerows,
            skip: _para.page,
            sort: _para.sort,
            //    session: _para.session,
            other: _para.other,
            rows: _para.rows,
            where: _para.where
        };

        try {
            //   callback(data);
            var Module = module.constructor;
            var model = new Module();
            var code = 'module.exports = async function (db,callback,where,para,session) {' + runjs + '}';
            model._compile(code, 'runjs.js');
            var run = model.exports;

            run(this.db, callback, _para.where, para, _para.session);

        } catch (err) {
            console.log(err); // 这里捕捉到错误 `error`
        }
    },
    runData: async function(runjs, callback) {
        // var aa = await this.db.collection('jkdb');
        // var data = await aa.find({}).toArray();
        try {
            //   callback(data);
            var Module = module.constructor;
            var model = new Module();
            var code = 'module.exports = async function (db,callback) {' + runjs + '}';
            model._compile(code, 'runjs.js');
            var run = model.exports;
            run(this.db, callback);

        } catch (err) {
            console.log(err); // 这里捕捉到错误 `error`
        }

    },
    selectData: function(where, table, callback) {
        var collection = this.db.collection(table);
        var whereStr = where;
        collection.find(whereStr).toArray(function(err, result) {
            if (err) {
                console.log('Error:' + err);
                return;
            }
            callback(result);
        });
    },
    searchData: function(where, page, rows, sort, table, callback) {
        var count = 0;
        if (where && where._id) {
            where._id = mongoose.ObjectId(where._id);
        }

        //console.log("page:" + page + ",rows:" + rows);
        var collection = this.db.collection(table);
        var whereStr = where;
        var skp = page;
        var rws = rows;
        var para = { limit: rws, skip: skp, sort: sort };

        collection.find(whereStr, para).toArray(function(err, rs) {
            if (err) {
                console.log('Error:' + err);
                return;
            }
            collection.find({}).count(function(err, count) {
                var jsonArray = { rows: rs, total: count };
                callback(jsonArray);
            });

        });
    }

    ,
    insertData: function(rows, table, callback) {
        var collection = this.db.collection(table);
        collection.insert(rows, function(err, result) {
            if (err) {
                console.log('Error:' + err);
                return;
            }
            callback(result);
        });
    },
    updateData: function(where, data, table, callback) {
        if (where && where._id) {
            where._id = mongoose.ObjectId(where._id);
        }
        var collection = this.db.collection(table);
        var whereStr = where;
        var updateStr = { $set: data };
        collection.update(whereStr, updateStr, { multi: true }, function(err, result) {
            if (err) {
                console.log('Error:' + err);
                return;
            }
            callback(result);
        });
    },
    delData: function(where, table, callback) {
        var collection = this.db.collection(table);
        var whereStr = where;
        collection.remove(whereStr, function(err, result) {
            if (err) {
                console.log('Error:' + err);
                return;
            }
            callback(result);
        });
    },
    delDataAsy: async function(where, table, callback) {
        var collection = await this.db.collection(table);
        var whereStr = where;
        var result = {};
        try {
            for (var i = 0; i < whereStr.length; i++) {
                await collection.remove(whereStr[i]);
            }
            result = { msg: '成功', Success: true };
        } catch (ex) {
            result = { msg: '失败', Success: true };
        }

        if (callback) {
            callback(result)
        }
    }
}
var mdb = new mgdb();
exports.mdb = mdb;