/*
 * @Author: 蒋文斌
 * @Date: 2019-04-09 16:05:13
 * @LastEditors: 蒋文斌
 * @LastEditTime: 2021-05-27 09:24:43
 * @Description: 自动生成
 */
const mysql = require('mysql');
const config = require('../config');

const pool = mysql.createPool(config.mysql);

// pool.on('connection', (connection) => {
//     console.log('取得连接');
// });

// pool.on('release', (connection) => {
//     console.log('释放了连接');
// });

pool.on('error', (err) => {
    console.error(err);
});

function getConnection(success, fail) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(err);
            fail(err)
        } else {
            success(connection)
        }
    })
}

module.exports.getConnection = getConnection;