const express = require('express');
const xss = require("xss");
const router = express.Router();
const indexSQL = require('../sql');
const utilsHelper = require('../utils/utils');
const transactionHelper = require('../utils/transaction');
const errcode = require('../utils/errcode');

/**
 * @param {Number} count 查询数量
 * @description 根据传入的count获取阅读排行top N的文章
 */
router.get('/top_read', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    connection.query(indexSQL.GetTopRead, [Number(params.count)], function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results
            });
        } else {
            res.send({
                ...errcode.ARTICLE.TOP_READ_EMPTY,
                data: []
            });
        }
    });
});

/**
 * @param {Number} pageNo 页码数
 * @param {Number} pageSize 一页数量
 * @description 分页查询文章
 */
router.get('/page', function (req, res, next) {
    const connection = req.connection;
    const pageNo = Number(req.query.pageNo || 1);
    const pageSize = Number(req.query.pageSize || 10);
    connection.query(indexSQL.GetPagedArticle, [(pageNo - 1) * pageSize, pageSize], function (error, results, fileds) {
        connection.release();
        if (results) {
            results[0].forEach(handleCategoryAndTag)
            res.send({
                code: '0',
                data: results[0],
                total: results[1][0]['total']
            });
        } else {
            res.send({
                code: '003001',
                data: []
            });
        }
    });
});

/**
 * @description 分页查询
 */
router.get('/page_admin', function (req, res, next) {
    const connection = req.connection;
    const param = req.query;
    const pageNo = Number(param.pageNo || 1);
    const pageSize = Number(param.pageSize || 10)
    connection.query(indexSQL.GetArticlePageAdmin, [(pageNo - 1) * pageSize, pageSize], function (error, results, fileds) {
        connection.release();
        if (results) {
            // 查询成功
            results[0].forEach(handleCategoryAndTag)
            res.send({
                code: '0',
                data: results[0],
                total: results[1][0]['total']
            });
        } else {
            // 查询失败
            res.send({
                code: '013001',
                data: 0
            });
        }
    });
});

/**
 * @param {Number} id 当前文章的id
 * @description 查询上一篇和下一篇文章的id
 */
router.get('/neighbors', function (req, res, next) {
    const connection = req.connection;
    const id = Number(req.query.id);
    connection.query(indexSQL.QueryPreAndNextArticleIds, [id, id], function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0',
                data: results
            });
        } else {
            res.send({
                ...errcode.ARTICLE.NEIGHBORS_EMPTY,
                data: []
            });
        }
    });
});

/**
 * @param {Number} articleId 当前文章的id
 * @description 上报阅读记录
 */
router.put('/update_read_num', function (req, res, next) {
    const connection = req.connection;
    connection.query(indexSQL.UpdateReadSum, [req.body.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0'
            });
        } else {
            res.send({
                code: '008001'
            });
        }
    })
});

/**
 * @param {Number} articleId 当前文章的id
 * @description 修改私密/公开
 */
router.put('/update_private', function (req, res, next) {
    const connection = req.connection;
    const params = req.body;
    connection.query(indexSQL.UpdateArticlePrivate, [params.private, params.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0'
            });
        } else {
            res.send({
                code: '008001'
            });
        }
    })
});

/**
 * @param {Number} articleId 当前文章的id
 * @description 逻辑删除/恢复
 */
router.put('/update_deleted', function (req, res, next) {
    const connection = req.connection;
    const params = req.body;
    connection.query(indexSQL.UpdateArticleDeleted, [params.deleted, params.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0'
            });
        } else {
            res.send({
                code: '008001'
            });
        }
    })
});

/**
 * @param {Number} articleId 当前文章的id
 * @description 物理删除
 */
router.delete('/delete', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    connection.query(indexSQL.DeleteArticleById, [params.id], function (error, results, fileds) {
        connection.release();
        if (results) {
            res.send({
                code: '0'
            });
        } else {
            res.send({
                code: '008001'
            });
        }
    })
});

/**
 * @param {Number} id 当前文章的id
 * @description 获得文章详情
 */
router.get('/detail', function (req, res, next) {
    const connection = req.connection;
    const params = req.query;
    connection.query(indexSQL.GetArticleByID, [Number(params.id)], function (error, results, fileds) {
        connection.release();
        if (results && results.length > 0) {
            const data = results[0];
            if (data.private) {
                // 如果是私密的，先判断有没有token
                if (!req.cookies.token) {
                    return res.send({
                        ...errcode.AUTH.FORBIDDEN
                    });
                } else {
                    // TODO: 还需要在这里判断token是否是有效的
                    handleCategoryAndTag(data);
                    res.send({
                        code: '0',
                        data
                    });
                }
            } else {
                handleCategoryAndTag(data);
                res.send({
                    code: '0',
                    data
                });
            }
        } else {
            res.send({
                code: '004001',
                data: null
            });
        }
    });
});

/**
 * @param {String} keyword 分类名
 * @description 根据分类名查询文章
 */
router.get('/page_by_category', function (req, res, next) {
    const connection = req.connection;
    const pageNo = Number(req.query.pageNo || 1);
    const pageSize = Number(req.query.pageSize || 10);
    connection.query(indexSQL.GetPagedArticleByCategory, [req.query.keyword, (pageNo - 1) * pageSize, pageSize, req.query.keyword], function (error, results, fileds) {
        connection.release();
        if (results) {
            results[0].forEach(handleCategoryAndTag)
            res.send({
                code: '0',
                data: results[0],
                total: results[1][0]['total']
            });
        } else {
            res.send({
                code: '003001',
                data: []
            });
        }
    })
});

/**
 * @param {String} keyword 标签名
 * @description 根据标签名查询文章
 */
router.get('/page_by_tag', function (req, res, next) {
    const connection = req.connection;
    const pageNo = Number(req.query.pageNo || 1);
    const pageSize = Number(req.query.pageSize || 10);
    connection.query(indexSQL.GetPagedArticleByTag, [req.query.keyword, (pageNo - 1) * pageSize, pageSize], function (error, results, fileds) {
        connection.release();
        if (results) {
            results[0].forEach(handleCategoryAndTag)
            res.send({
                code: '0',
                data: results[0],
                total: results[1][0]['total']
            });
        } else {
            res.send({
                code: '003001',
                data: []
            });
        }
    })
});

/**
 * @description 发表文章
 */
router.post('/add', function (req, res, next) {
    const connection = req.connection;
    const param = req.body;
    // XSS防护
    param.content = xss(pararm.content)
    let articleId;
    let newCategoryIds = [];
    let tagIds = [];
    const allTaskList = [
        {
            // 任务1：插入文章表
            task: function () {
                return new Promise((resolve, reject) => {
                    connection.query(indexSQL.PublishArticle, [param.articleTitle, param.articleText, param.summary, new Date(), param.authorId, param.poster], function (error, results, fileds) {
                        if (error) {
                            reject(error);
                        } else {
                            articleId = results.insertId;
                            resolve(results);
                        }
                    });
                });
            },
            children: [
                param.newCategories ? {
                    // 任务1-2：如果存在新的分类，插入分类表
                    task: function () {
                        return new Promise((resolve, reject) => {
                            let addCategoryTaskList = []
                            // 循环插入
                            param.newCategories.forEach(item => {
                                let promiseAddCategory = new Promise((resolveChild, rejectChild) => {
                                    connection.query(indexSQL.AddCategories, [item], function (error, results, fileds) {
                                        if (error) {
                                            connection.rollback(function () {
                                                rejectChild(error)
                                            })
                                        } else {
                                            resolveChild(results)
                                        }
                                    })
                                })
                                addCategoryTaskList.push(promiseAddCategory)
                            })
                            return Promise.all(addCategoryTaskList).then(resp => {
                                newCategoryIds = resp.map(item => item.insertId)
                                resolve()
                            }, failure => {
                                reject()
                            })
                        })
                    },
                    children: [
                        {
                            // 任务1-2-1：插入文章分类关系表
                            task: function () {
                                return new Promise((resolve, reject) => {
                                    let addArticleCategoryTaskList = []
                                    // 循环插入
                                    newCategoryIds.forEach(item => {
                                        let promiseAddArticleCategory = new Promise((resolveChild, rejectChild) => {
                                            connection.query(indexSQL.AddArticleCategory, [articleId, item], function (error, results, fileds) {
                                                if (error) {
                                                    connection.rollback(function () {
                                                        rejectChild(error)
                                                    })
                                                } else {
                                                    resolveChild(results)
                                                }
                                            })
                                        })
                                        addArticleCategoryTaskList.push(promiseAddArticleCategory)
                                    })
                                    return Promise.all(addArticleCategoryTaskList).then(resp => {
                                        resolve()
                                    }, failure => {
                                        reject()
                                    })
                                })
                            }
                        }
                    ]
                } : null,
                param.oldCategoryIds ? {
                    // 任务1-3：如果选择了旧的分类，插入文章分类关系表
                    task: function () {
                        return new Promise((resolve, reject) => {
                            let addArticleCategoryTaskList = [];
                            // 循环插入
                            param.oldCategoryIds.forEach(item => {
                                let promiseAddArticleCategory = new Promise((resolveChild, rejectChild) => {
                                    connection.query(indexSQL.AddArticleCategory, [articleId, item], function (error, results, fileds) {
                                        if (error) {
                                            connection.rollback(function () {
                                                rejectChild(error);
                                            });
                                        } else {
                                            resolveChild(results);
                                        }
                                    })
                                })
                                addArticleCategoryTaskList.push(promiseAddArticleCategory);
                            })
                            return Promise.all(addArticleCategoryTaskList).then(resp => {
                                resolve();
                            }, failure => {
                                reject();
                            })
                        })
                    }
                } : null,
                {
                    // 任务1-4：插入标签表和关系表
                    task: function () {
                        return new Promise((resolve, reject) => {
                            let addTagTaskList = [];
                            // 循环插入
                            param.tags.forEach(item => {
                                let promiseAddTag = new Promise((resolveChild, rejectChild) => {
                                    // 插入前先检查标签是不是存在了，存在的话，直接取得其ID
                                    connection.query(indexSQL.CheckTag, [item], function (error, results, fileds) {
                                        if (results.length == 0) {
                                            // 不存在，插入标签
                                            connection.query(indexSQL.AddTags, [item], function (error, results2, fileds) {
                                                if (error) {
                                                    rejectChild(error);
                                                } else {
                                                    resolveChild(results2);
                                                }
                                            });
                                        } else {
                                            // 存在，取得标签ID
                                            resolveChild({ insertId: results[0].id });
                                        }
                                    })
                                });
                                addTagTaskList.push(promiseAddTag);
                            })
                            return Promise.all(addTagTaskList).then(resp => {
                                tagIds = resp.map(item => item.insertId)
                                resolve();
                            }, failure => {
                                reject();
                            });
                        });
                    },
                    children: [
                        {
                            // 任务1-4-1：插入文章标签关系表
                            task: function () {
                                return new Promise((resolve, reject) => {
                                    let addArticleTagTaskList = [];
                                    // 循环插入
                                    tagIds.forEach(item => {
                                        let promiseAddTagCategory = new Promise((resolveChild, rejectChild) => {
                                            connection.query(indexSQL.AddArticleTag, [articleId, item], function (error, results, fileds) {
                                                if (error) {
                                                    rejectChild(error);
                                                } else {
                                                    resolveChild(results);
                                                }
                                            });
                                        });
                                        addArticleTagTaskList.push(promiseAddTagCategory);
                                    })
                                    return Promise.all(addArticleTagTaskList).then(resp => {
                                        resolve()
                                    }, failure => {
                                        reject()
                                    })
                                })
                            }
                        }
                    ]
                }
            ]
        }
    ];
    const handledTaskList = utilsHelper.handlePromiseList(allTaskList);
    transactionHelper.doTransaction(connection, handledTaskList).then(allResp => {
        connection.release();
        res.send({
            code: allResp ? '0' : '002001'
        });
    }, failure => {
        connection.release();
        // 插入失败
        res.send({
            code: '002001'
        });
    });
});

/**
 * 
 * @description 更新博客信息
 * 任务1：更新博客的标题，内容，摘要，封面，更新时间等信息；
 * 任务2：根据id和deleteTagIDs删除article_tag关系表中的相关记录；
 * 任务3：根据newTags添加新的tag，3-1：并在article_tag表中关联上；
 * 任务4：根据id和deleteCategoryIDs删除article_category关系表中的相关记录；
 * 任务5：根据newCategories添加新的分类，5-1：并在关系表中关联上；
 * 任务6：根据id和relatedCategoryIDs新增分类关联
 */

router.put('/update', function (req, res, next) {
    const connection = req.connection;
    const param = req.body;
    let tagIDs = [];
    let categoryIDs = [];
    const allTaskList = [
        {
            // 任务1
            task: function () {
                return new Promise((resolve, reject) => {
                    const updateArticleParam = {
                        article_name: param.articleTitle,
                        // XSS防护
                        article_text: xss(param.articleText),
                        poster: param.poster,
                        summary: param.summary,
                        private: param.private,
                        update_time: new Date()
                    }
                    connection.query(indexSQL.UpdateArticle, [updateArticleParam, param.id], function (error, results, fileds) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });
            }
        },
        param.deleteTagIDs ? {
            // 任务2
            task: function () {
                return new Promise((resolve, reject) => {
                    let deleteArticleTagTaskList = [];
                    // 循环插入
                    param.deleteTagIDs.forEach(tagid => {
                        let promiseDeleteArticleTag = new Promise((resolveChild, rejectChild) => {
                            connection.query(indexSQL.DeleteArticleTag, [param.id, tagid], function (error, results, fileds) {
                                if (error) {
                                    rejectChild(error);
                                } else {
                                    resolveChild(results);
                                }
                            });
                        });
                        deleteArticleTagTaskList.push(promiseDeleteArticleTag);
                    })
                    return Promise.all(deleteArticleTagTaskList).then(resp => {
                        resolve()
                    }, failure => {
                        reject()
                    });
                });
            }
        } : null,
        param.newTags ? {
            // 任务3
            task: function () {
                return new Promise((resolve, reject) => {
                    let addTagTaskList = [];
                    // 循环插入
                    param.newTags.forEach(item => {
                        let promiseAddTag = new Promise((resolveChild, rejectChild) => {
                            // 插入前先检查标签是不是存在了，存在的话，直接取得其ID
                            connection.query(indexSQL.CheckTag, [item], function (error, results, fileds) {
                                if (results.length == 0) {
                                    // 不存在，插入标签
                                    connection.query(indexSQL.AddTags, [item], function (error, results2, fileds) {
                                        if (error) {
                                            rejectChild(error);
                                        } else {
                                            resolveChild(results2);
                                        }
                                    });
                                } else {
                                    // 存在，取得标签ID
                                    resolveChild({ insertId: results[0].id });
                                }
                            })
                        });
                        addTagTaskList.push(promiseAddTag);
                    })
                    return Promise.all(addTagTaskList).then(resp => {
                        tagIDs = resp.map(item => item.insertId)
                        resolve();
                    }, failure => {
                        reject();
                    });
                });
            },
            children: [
                {
                    // 任务3-1：插入文章标签关系表
                    task: function () {
                        return new Promise((resolve, reject) => {
                            let addArticleTagTaskList = [];
                            // 循环插入
                            tagIDs.forEach(item => {
                                let promiseAddArticleTag = new Promise((resolveChild, rejectChild) => {
                                    connection.query(indexSQL.AddArticleTag, [param.id, item], function (error, results, fileds) {
                                        if (error) {
                                            rejectChild(error);
                                        } else {
                                            resolveChild(results);
                                        }
                                    });
                                });
                                addArticleTagTaskList.push(promiseAddArticleTag);
                            })
                            return Promise.all(addArticleTagTaskList).then(resp => {
                                resolve()
                            }, failure => {
                                reject()
                            })
                        })
                    }
                }
            ]
        } : null,
        param.deleteCategoryIDs ? {
            // 任务4
            task: function () {
                return new Promise((resolve, reject) => {
                    let deleteArticleCategoryTaskList = [];
                    // 循环插入
                    param.deleteCategoryIDs.forEach(categoryid => {
                        let promiseDeleteArticleCategory = new Promise((resolveChild, rejectChild) => {
                            connection.query(indexSQL.DeleteArticleCategory, [param.id, categoryid], function (error, results, fileds) {
                                if (error) {
                                    rejectChild(error);
                                } else {
                                    resolveChild(results);
                                }
                            });
                        });
                        deleteArticleCategoryTaskList.push(promiseDeleteArticleCategory);
                    })
                    return Promise.all(deleteArticleCategoryTaskList).then(resp => {
                        resolve()
                    }, failure => {
                        reject()
                    });
                });
            }
        } : null,
        param.newCategories ? {
            // 任务5
            task: function () {
                return new Promise((resolve, reject) => {
                    let addCategoryTaskList = [];
                    // 循环插入
                    param.newCategories.forEach(item => {
                        let promiseAddCategory = new Promise((resolveChild, rejectChild) => {
                            // 插入前先检查分类是不是存在了，存在的话，直接取得其ID
                            connection.query(indexSQL.CheckCategory, [item], function (error, results, fileds) {
                                if (results.length == 0) {
                                    // 不存在，插入分类
                                    connection.query(indexSQL.AddCategories, [item], function (error, results2, fileds) {
                                        if (error) {
                                            rejectChild(error);
                                        } else {
                                            resolveChild(results2);
                                        }
                                    });
                                } else {
                                    // 存在，取得分类ID
                                    resolveChild({ insertId: results[0].id });
                                }
                            })
                        });
                        addCategoryTaskList.push(promiseAddCategory);
                    })
                    return Promise.all(addCategoryTaskList).then(resp => {
                        categoryIDs = resp.map(item => item.insertId)
                        resolve();
                    }, failure => {
                        reject();
                    });
                });
            },
            children: [
                {
                    // 任务5-1：插入文章分类关系表
                    task: function () {
                        return new Promise((resolve, reject) => {
                            let addArticleCategoryTaskList = [];
                            // 循环插入
                            categoryIDs.forEach(item => {
                                let promiseAddArticleCategory = new Promise((resolveChild, rejectChild) => {
                                    connection.query(indexSQL.AddArticleCategory, [param.id, item], function (error, results, fileds) {
                                        if (error) {
                                            rejectChild(error);
                                        } else {
                                            resolveChild(results);
                                        }
                                    });
                                });
                                addArticleCategoryTaskList.push(promiseAddArticleCategory);
                            })
                            return Promise.all(addArticleCategoryTaskList).then(resp => {
                                resolve()
                            }, failure => {
                                reject()
                            })
                        })
                    }
                }
            ]
        } : null,
        param.relatedCategoryIDs ? {
            // 任务6
            task: function () {
                return new Promise((resolve, reject) => {
                    let relateTaskList = [];
                    // 循环插入
                    param.relatedCategoryIDs.forEach(categoryid => {
                        let promiseRelate = new Promise((resolveChild, rejectChild) => {
                            connection.query(indexSQL.AddArticleCategory, [param.id, categoryid], function (error, results, fileds) {
                                if (error) {
                                    rejectChild(error);
                                } else {
                                    resolveChild(results);
                                }
                            });
                        });
                        relateTaskList.push(promiseRelate);
                    })
                    return Promise.all(relateTaskList).then(resp => {
                        resolve()
                    }, failure => {
                        reject()
                    });
                });
            }
        } : null
    ];
    const handledTaskList = utilsHelper.handlePromiseList(allTaskList);
    transactionHelper.doTransaction(connection, handledTaskList).then(allResp => {
        connection.release();
        res.send({
            code: allResp ? '0' : '002001'
        });
    }, failure => {
        connection.release();
        // 插入失败
        res.send({
            code: '002001'
        });
    });
});


/**
 * 
 * @param {Obeject} item 单篇博客数据
 * @description 处理分类和标签信息
 */
function handleCategoryAndTag(item) {
    // 处理分类
    const categoryIDs = item.categoryIDs.split(' ').map(id => +id);
    const categoryNames = item.categoryNames.split(' ');
    item.categories = categoryIDs.map(function(cateID, index) {
        return {
            id: cateID,
            categoryName: categoryNames[index]
        }
    });
    delete item.categoryIDs;
    delete item.categoryNames;
    // 处理标签
    const tagIDs = item.tagIDs.split(' ').map(id => +id);
    const tagNames = item.tagNames.split(' ');
    item.tags = tagIDs.map(function(tagID, index) {
        return {
            id: tagID,
            tagName: tagNames[index]
        }
    });
    delete item.tagIDs;
    delete item.tagNames;
}

module.exports = router;