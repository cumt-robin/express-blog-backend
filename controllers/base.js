const express = require('express');
const router = express.Router();
// const config = require('../config');
const dbUtils = require('../utils/db');
const indexSQL = require('../sql');
const errcode = require("../utils/errcode");
const authMap = require('../permissions/auth');

/**
 * base controller
 * 权限验证
 */
router.use(function(req, res, next) {
    // CORS 处理，已交给 Nginx 处理
    // if (req.headers.origin) {
    //     if (config.allowClient.includes(req.headers.origin)) {
    //         res.header('Access-Control-Allow-Origin', req.headers.origin);
    //     }
    //     res.header('Access-Control-Allow-Methods', 'PUT,GET,POST,DELETE,OPTIONS');
    //     res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Range");
    //     res.header('Access-Control-Allow-Credentials', 'true');
    // }

    const authority = authMap.get(req.path);
    
    if (authority) {
        // 需要检验token的接口
        if (req.cookies.token) {
            dbUtils.query({ sql: indexSQL.GetCurrentUser, values: [req.cookies.token] }).then(({ results }) => {
                if (results.length === 0) {
                    // 重置session和cookie信息
                    res.clearCookie('username');
                    res.clearCookie('islogined');
                    res.clearCookie('token');
                    return res.send({
                        ...errcode.AUTH.AUTHORIZE_EXPIRED
                    });
                }

                const currentUser = results[0];

                // token是否和权限符合
                if (currentUser.role_name != authority.role) {
                    return res.send({
                        ...errcode.AUTH.FORBIDDEN
                    });
                }

                // 将user信息存在本次请求内存中
                req.currentUser = currentUser;

                // 执行权转交后续中间件
                next();
            }, err => {
                return res.send({
                    ...errcode.DB.CONNECT_EXCEPTION
                });
            })
        } else {
            return res.send({
                ...errcode.AUTH.UNAUTHORIZED
            });
        }
    } else {
        // 执行权转交后续中间件
        next();
    }
});

module.exports = router;