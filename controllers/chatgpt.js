const express = require('express');
const router = express.Router();
const config = require('../config');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: config.chatgpt.key,
});
const openai = new OpenAIApi(configuration);

/**
 * @param {Number} wd 聊天上下文
 * @description chatgpt对话
 */
router.get('/chat', async function(req, res, next) {
    if (req.session.chatgptTopicCount && req.session.chatgptTopicCount >= 10) {
        // 这个话题聊得有点深入了，不如换一个。
        req.session.chatgptSessionPrompt = ''
        req.session.chatgptTopicCount = 0
        return res.status(403).json({
            msg: "这个话题聊得有点深入了，不如换一个"
        });
    }
    if (req.session.chatgptTimes && req.session.chatgptTimes >= 50) {
        // 到达调用上限，欢迎明天再来哦，实际上还需要定时任务，这里先不做了。
        return res.status(403).json({
            msg: "到达调用上限，欢迎明天再来哦"
        });
    }
    if (req.session.chatgptRequestTime && Date.now() - req.session.chatgptRequestTime <= 3000) {
        // 如果在3s里重复调用，不允许
        return res.status(403).json({
            msg: "请降低请求频次"
        });
    }
    if (!req.session.chatgptSessionPrompt) {
        req.session.chatgptSessionPrompt = ''
    }
    const wd = req.query.wd;
    const prompt = req.session.chatgptSessionPrompt + `\n提问:` + wd + `\nAI:`
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [" 提问:", " AI:"],
        stream: true
    }, { responseType: 'stream' });
    req.session.chatgptRequestTime = Date.now()
    if (!req.session.chatgptTopicCount) {
        req.session.chatgptTopicCount = 1
    } else {
        req.session.chatgptTopicCount += 1
    }
    if (!req.session.chatgptTimes) {
        req.session.chatgptTimes = 1
    } else {
        req.session.chatgptTimes += 1
    }
    res.setHeader("content-type", "text/event-stream")
    completion.data.pipe(res)
});

/**
 * 反馈内容
 */
router.post('/feedback', function(req, res, next) {
    if (req.body.result) {
        req.session.chatgptSessionPrompt += req.body.result
        res.status(200).json({
            code: '0',
            msg: "更新成功"
        });
    } else {
        res.status(400).json({
            msg: "参数错误"
        });
    }
});

/**
 * 换个话题
 */
router.post('/changeTopic', function(req, res, next) {
    req.session.chatgptSessionPrompt = ''
    req.session.chatgptTopicCount = 0
    res.status(200).json({
        code: '0',
        msg: "可以尝试新的话题"
    });
});

module.exports = router;