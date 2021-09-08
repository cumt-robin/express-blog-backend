function doAsyncTransaction(connection, taskList) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(function(err) {
            if (err) {
                throw err; 
            }
            Promise.all(taskList).then(resp => {
                connection.commit(function(err) {
                    if (err) {
                        return connection.rollback(function() {
                            reject(err)
                        });
                    } else {
                        resolve(resp)
                    }
                });
            }).catch(err => {
                return connection.rollback(function() {
                    reject(err)
                });
            })
        });
    })
}

function doTransaction(connection, task) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(function(err) {
            if (err) {
                reject(err)
            }
            task.then(resp => {
                connection.commit(function(err) {
                    if (err) {
                        connection.rollback(function() {
                            reject(err)
                        });
                    } else {
                        resolve(resp)
                    }
                });
            }, failure => {
                connection.rollback(function() {
                    reject(failure)
                });
            }).catch(err => {
                return connection.rollback(function() {
                    reject(err)
                });
            })
        });
    })
}

module.exports.doAsyncTransaction = doAsyncTransaction
module.exports.doTransaction = doTransaction