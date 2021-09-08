const express = require('express');
const router = express.Router();
const indexSQL = require('../sql');

/**
 * @param {Number} getCount 是否需要同时查出每个分类下的文章数量
 * @description 查询分类
 */
router.get('/all', function(req, res, next) {
    const connection = req.connection;
    const sql = req.query.getCount ? indexSQL.QueryTagAndCount : indexSQL.QueryAllTags;
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

/**
 * @description 获得标签下的文章数量
 */
router.get('/article_count', function(req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.GetArticleSum, function(error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results
            });
        } else {
            res.send({
                code: '010001',
                data: []
            });
        }
    })
});

module.exports = router;