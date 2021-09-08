const express = require('express');
const router = express.Router();
const indexSQL = require('../sql');
const emailHandler = require('../utils/email');
const config = require('../config');
const errcode = require('../utils/errcode');

/**
 * @description 登录
 */
router.put('/login', function (req, res, next) {
	const connection = req.connection;
	const param = req.body;
	if (!req.session.captcha) {
		connection.release();
		res.send({
			code: '001001',
			data: null,
			msg: '验证码有误，换一张试试呢'
		});
	} else if (param.captcha.toLowerCase() != req.session.captcha.toLowerCase()) {
		connection.release();
		res.send({
			code: '001002',
			data: null,
			msg: '验证码输入有误'
		});
	} else {
		connection.query(indexSQL.QueryByUserNameAndPwd, [param.userName, param.password], function (error, results, fileds) {
			if (results.length > 0) {
				// 更新登录时间和token
				connection.query(indexSQL.UpdateUserById, [{ last_login_time: new Date(), token: req.session.id }, results[0].id], function (error, results2, fileds) {
					connection.release();
					// 设置过期时间，来源于配置
					const expireTime = new Date(Date.now() + 86400000 * config.cookieExpireDate);
					// 127.0.0.1或localhost是无法Set-Cookie的
					res.cookie('username', param.userName, { expires: expireTime, httpOnly: true, sameSite: 'lax', secure: true });
					// islogined 是给前端做路由守卫的一个判断标志位，不作为后端验证的依据
					res.cookie('islogined', 1, { expires: expireTime });
					// token 是后端校验依据，需要严格安全
					res.cookie('token', req.session.id, { expires: expireTime, httpOnly: true, sameSite: 'lax', secure: true });
					res.send({
						code: '0',
						data: results[0]
					});
				});
			} else {
				connection.release();
				res.send({
					code: '001003',
					data: null,
					msg: '用户名或密码输入有误'
				});
			}
		});
	}
});

/**
 * @description 退出登录
 */
router.put('/logout', function (req, res, next) {
	req.connection.release();
	res.clearCookie('username');
	res.clearCookie('islogined');
	res.clearCookie('token');
	res.send({
		code: '0'
	});
});

/**
 * @description 获取当前用户
 */
router.get('/current', function (req, res, next) {
	req.connection.release();
	// base拦截器会做校验，这里不需要再校验
	res.send({
		code: '0',
		data: req.currentUser
	})
});

/**
 * @description 忘记密码
 */
router.get('/forgetpwd', function (req, res, next) {
	req.connection.release();
	const mailOptions = {
		from: `"来自${config.blogName}" <${config.email.auth.user}>`,
		to: config.authorEmail,
		subject: `${config.blogName}《通知邮件》`, // 主题
		text: '找回密码', // 发送text内容
		// html: '<b>Hello world?</b>' // 发送html内容
	};
	emailHandler.sendEmail(mailOptions).then(info => {
		console.log('邮件发送成功', info);
	}, error => {
		console.log('邮件发送失败', error);
	});
})

module.exports = router;