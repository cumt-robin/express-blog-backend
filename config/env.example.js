module.exports = {
    allowClient: [],
    email: {
        service: '163', // 邮箱服务商
        port: 465, // SMTP 端口
        secureConnection: true, // 使用 SSL
        auth: {
            user: 'your email used for sending notifications',
            // smtp授权码
            pass: 'smtp auth code'
        }
    },
    authorEmail: 'your private email which is used for receiving notifications',
    blogName: 'your blog name, such as Tusi博客',
    cookieExpireDate: 3,
    siteURL: 'visit url of your blog, such as https://blog.me'
}