const express = require('express');
const router = express.Router();
const indexSQL = require('../sql');
const dbUtils = require('../utils/db');

/**
 * @param {Number} getCount 是否需要同时查出每个分类下的文章数量
 * @description 查询分类
 */
router.get('/all', function(req, res, next) {
    const sql = req.query.getCount ? indexSQL.QueryCategoryAndCount : indexSQL.QueryAllCategories;
    dbUtils.query(sql).then(({ results }) => {
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
    })
});

/**
 * 获取分类总数
 */
router.get('/count', function(req, res, next) {
    dbUtils.query(indexSQL.GetCategoryCount).then(({ results }) => {
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
    })
});

module.exports = router;