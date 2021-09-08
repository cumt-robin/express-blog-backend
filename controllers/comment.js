const express = require('express');
const xss = require("xss");
const router = express.Router();
const indexSQL = require('../sql');
const config = require('../config');
const utilsHelper = require('../utils/utils');
const emailHandler = require('../utils/email');

/**
 * @param {Number} id 文章id，如果传入id，则代表查询文章下的评论；否则代表查询留言
 * @param {Number} pageNo 页码
 * @param {Number} pageSize 每页数量
 * @description 分页查询评论或留言
 */
router.get('/page', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const sql = params.id ? indexSQL.GetCommentsByArticleID : indexSQL.GetMessagesApproved
    const sqlParams = params.id ? [Number(params.id), (pageNo - 1) * pageSize, pageSize, Number(params.id)] : [(pageNo - 1) * pageSize, pageSize]
    connection.query(sql, sqlParams, function (error, results, fileds) {
        if (results) {
            let allTaskList = results[0].map((item, index) => {
                return {
                    task: () => {
                        return new Promise((resolve, reject) => {
                            connection.query(indexSQL.QueryReplyByCommentID, [item.id, item.id], function (error, results2, fileds) {
                                if (error) {
                                    reject(error)
                                } else {
                                    results[0][index]['replies'] = results2
                                    resolve(results2)
                                }
                            });
                        });
                    }
                }
            });
            utilsHelper.handlePromiseList(allTaskList).then(resp => {
                connection.release();
                res.send({
                    code: '0',
                    data: results[0],
                    total: results[1][0]['total']
                });
            }, fail => {
                connection.release();
                res.send({
                    code: '012001',
                    data: []
                });
            });
        } else {
            connection.release();
            res.send({
                code: '012001',
                data: []
            });
        }
    });
});

/**
 * @description 插入留言或评论
 */
router.post('/add', function (req, res, next) {
    const connection = req.connection;
    const params = Object.assign(req.body, {
        create_time: new Date(),
    });
    // XSS防护
    if (params.content) {
        params.content = xss(params.content)
    }
    const isComment = !!param.article_id
    const wd = isComment ? '评论' : '留言'
    connection.query(indexSQL.CreateComment, params, function (err, results, fileds) {
        connection.release();
        if (err) {
            console.error(err);
            // 插入失败
            res.send({
                code: '013001',
                msg: `${wd}失败`
            });
        } else {
            // 成功
            const mailOptions = {
                from: `"${config.blogName}" <${config.email.auth.user}>`,
                to: config.authorEmail,
                subject: `${config.blogName}《收到新的${wd}》`, // 主题
                html: `收到一条新的${wd}，请点击<a href="${config.siteURL}" style="font-size:18px">${config.blogName}</a>前往查看`
            };
            emailHandler.sendEmail(mailOptions).then(info => {
                console.log('通知邮件发送成功', info)
            }, error => {
                console.log('通知邮件发送失败', error)
            })
            res.send({
                code: '0',
                msg: `${wd}成功，等待审核`
            });
        }
    });
});

/**
 * @description 获取留言总数
 */
router.get('/total', function (req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.GetMsgsTotal, function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results.reduce((prev, cur) => {
                    return prev + cur[0].total
                }, 0),
                msg: '查询成功'
            });
        } else {
            res.send({
                code: '019002',
                data: [],
                msg: '查询失败'
            });
        }
    });
});

/**
 * @description 查询待审核的评论/留言
 */
router.get('/get_not_approved', function (req, res, next) {
    const connection = req.connection;
    const sqlStr = req.query.type == 1 ? indexSQL.QueryCommentsNotApproved : indexSQL.QueryMessagesNotApproved;
    connection.query(sqlStr, function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results,
                msg: '查询成功'
            });
        } else {
            res.send({
                code: '019001',
                data: [],
                msg: '查询失败'
            });
        }
    });
});

/**
 * @param {Number} pageNo 页码
 * @param {Number} pageSize 每页数量
 * @description 分页查询未审核的评论/留言
 */
 router.get('/page_not_approved', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const sql =  params.type == 1 ? indexSQL.QueryNotApprovedPageComment : indexSQL.QueryNotApprovedPageMessage
    const sqlParams = [(pageNo - 1) * pageSize, pageSize]
    connection.query(sql, sqlParams, function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results[0],
                total: results[1][0]['total']
            });
        } else {
            res.send({
                code: '019002',
                data: []
            });
        }
    });
});

/**
 * @description 审核留言
 */
router.put('/review', function (req, res, next) {
    const connection = req.connection;
    const param = req.body
    connection.query(indexSQL.UpdateApprovedByCommentID, [param.approved, param.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            if (Number(param.approved) === 1 && param.email) {
                // 发个邮件通知下
                if (!param.jump_url) {
                    param.jump_url = config.siteURL
                }
                emailHandler.replyEmailForMessage(param.email, '留言/评论', param.content, param.jump_url)
            }
            res.send({
                code: '0',
                msg: '审核成功'
            })
        } else {
            res.send({
                code: '015001',
                msg: '审核失败'
            })
        }
    })
})

/**
 * @description 获取留言人数
 */
router.get('/number_of_people', function (req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.QueryPeopleCountOfMessage, function (error, results, fileds) {
        connection.release();
        if (results) {
            // 查询成功
            res.send({
                code: '0',
                data: results.length
            });
        } else {
            // 查询失败
            res.send({
                code: '012001',
                data: 0
            });
        }
    });
});

/**
 * @description 分页查询评论，1查评论，2查留言
 */
router.get('/page_admin', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const sqlStr = params.type == 1 ? indexSQL.GetPageCommentAdmin : indexSQL.GetPageMessageAdmin;
    connection.query(sqlStr, [(pageNo - 1) * pageSize, pageSize], function (error, results, fileds) {
        connection.release();
        if (results) {
            // 查询成功
            res.send({
                code: '0',
                data: results[0],
                total: results[1][0]['total']
            });
        } else {
            // 查询失败
            res.send({
                code: '013001',
                data: 0
            });
        }
    });
});

/**
 * @description 修改评论
 */
router.put('/update', function (req, res, next) {
    const connection = req.connection;
    const param = req.body;
    connection.query(indexSQL.UpdateComment, [param, param.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            // 查询成功
            res.send({
                code: '0',
                data: null
            });
        } else {
            // 查询失败
            res.send({
                code: '014001',
                data: 0
            });
        }
    });
});

/**
 * @description 修改评论
 */
router.delete('/delete', function (req, res, next) {
    const connection = req.connection;
    const param = req.query;
    connection.query(indexSQL.DeleteComment, [param.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            // 查询成功
            res.send({
                code: '0',
                data: null
            });
        } else {
            // 查询失败
            res.send({
                code: '015001',
                data: 0
            });
        }
    });
});

module.exports = router;