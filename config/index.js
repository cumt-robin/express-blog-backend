/**
 * @description 系统配置
 */

const baseEnv = require("./env")
const devEnv = require("./dev.env")
const prodEnv = require("./prod.env")

module.exports = process.env.NODE_ENV === 'production' ? {
    ...baseEnv,
    ...prodEnv
} : {
    ...baseEnv,
    ...devEnv
}