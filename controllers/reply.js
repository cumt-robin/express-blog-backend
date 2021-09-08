const express = require('express');
const xss = require("xss");
const router = express.Router();
const indexSQL = require('../sql');
const config = require('../config');
const emailHandler = require('../utils/email');

/**
 * @description 添加回复
 */
router.post('/add', function (req, res, next) {
    const connection = req.connection;
    const params = Object.assign(req.body, {
        create_time: new Date(),
    })
    // XSS防护
    if (params.content) {
        params.content = xss(params.content)
    }
    const isComment = !!param.article_id
    const wd = isComment ? '评论' : '留言'
    connection.query(indexSQL.AddReply, params, function (error, results, fileds) {
        connection.release();
        if (results) {
            const mailOptions = {
                from: `"${config.blogName}" <${config.email.auth.user}>`,
                to: config.authorEmail,
                subject: `${config.blogName}《收到新的${wd}回复》`, // 主题
                html: `收到一条新的${wd}回复，请点击<a href="${config.siteURL}" style="font-size:18px">${config.blogName}</a>前往查看`
            };
            emailHandler.sendEmail(mailOptions).then(info => {
                console.log('通知邮件发送成功', info)
            }, error => {
                console.log('通知邮件发送失败', error)
            })
            res.send({
                code: '0',
                msg: '回复成功，等待审核'
            })
        } else {
            res.send({
                code: '018001',
                msg: '回复失败'
            })
        }
    })
})

/**
 * @description 查询待审核的评论回复
 */
router.get('/getReplyOfCommentWaitReview', function (req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.GetReplyOfCommentWaitReview, function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results,
                msg: '查询成功'
            });
        } else {
            res.send({
                code: '020001',
                data: [],
                msg: '查询失败'
            });
        }
    });
})

/**
 * @description 查询待审核的留言回复
 */
router.get('/getReplyOfMsgWaitReview', function (req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.GetReplyOfMsgWaitReview, function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results,
                msg: '查询成功'
            })
        } else {
            res.send({
                code: '016001',
                data: [],
                msg: '查询失败'
            })
        }
    })
})

/**
 * @param {Number} pageNo 页码
 * @param {Number} pageSize 每页数量
 * @description 分页查询未审核的留言回复
 */
router.get('/unreviewd_reply_page', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const sql =  params.type == 1 ? indexSQL.QueryUnreviewedCommentReplyPage : indexSQL.QueryUnreviewedMessageReplyPage
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
 * @description 审核回复
 */
router.put('/review', function (req, res, next) {
    const connection = req.connection;
    const param = req.body;
    connection.query(indexSQL.UpdateApprovedByReplyID, [param.approved, param.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            if (Number(param.approved) === 1 && param.email) {
                // 发个邮件通知下
                if (!param.jump_url) {
                    param.jump_url = config.siteURL
                }
                emailHandler.replyEmailForMessage(param.email, '回复', param.content, param.jump_url)
            }
            res.send({
                code: '0',
                msg: '审核成功'
            })
        } else {
            res.send({
                code: '017001',
                msg: '审核失败'
            })
        }
    })
})

module.exports = router;