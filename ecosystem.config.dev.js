// 适用于本地开发环境
module.exports = {
    "apps": [
        {
            "name": "blog",
            "script": "app.js",
            "env": {
                "NODE_ENV": "development",
                "PORT": 8002
            },
            "watch": true,
            "ignore_watch": ["node_modules", ".git", ".github", ".gitignore", ".dockerignore", ".release-it.cjs", "*.md"],
        }
    ]
}