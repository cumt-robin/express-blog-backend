const express = require('express');
const router = express.Router();
const indexSQL = require('../sql');

/**
 * @param {Number} getCount 是否需要同时查出每个分类下的文章数量
 * @description 查询分类
 */
router.get('/all', function(req, res, next) {
    const connection = req.connection;
    const sql = req.query.getCount ? indexSQL.QueryCategoryAndCount : indexSQL.QueryAllCategories;
    connection.query(sql, function(error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results
            })
        } else {
            res.send({
                code: '007001',
                data: []
            })
        }
    });
});

router.get('/count', function(req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.GetCategoryCount, function(error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results[0].count
            })
        } else {
            res.send({
                code: '007002',
                data: []
            })
        }
    });
});

module.exports = router;