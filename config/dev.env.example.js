module.exports = {
    allowClient: ["localhost:3000", "127.0.0.1:3000"],
    mysql: {
        host: 'localhost',
        port: '3306',
        user: 'your mysql username',
        password: 'your mysql password',
        database: 'your mysql database name',
        multipleStatements: true,
        waitForConnections: true
    },
}