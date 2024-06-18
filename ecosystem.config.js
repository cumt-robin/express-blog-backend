module.exports = {
    /**
    * Application configuration section
    * http://pm2.keymetrics.io/docs/usage/application-declaration/
    */
    apps: [
        // First application
        {
            // 应用名
            name: 'blog',
            // 启动脚本
            script: 'app.js',
            // –env参数指定运行的环境
            env: {
                NODE_ENV: "development",
                PORT: 8002,
            },
            ignore_watch: ["node_modules", ".git"]
        }
    ],
};