const deployConfig = require("./deploy.config")

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
            env_production: {
                NODE_ENV: 'production',
                PORT: 8002,
            },
            watch: true,
            ignore_watch: ["node_modules"]
        }
    ],
    /**
    * Deployment section
    * http://pm2.keymetrics.io/docs/usage/deployment/
    */
    deploy: deployConfig
};