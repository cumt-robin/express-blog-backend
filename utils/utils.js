function getType(obj) {
    return Object.prototype.toString.call(obj).replace(/\[object\s([a-zA-Z]+)\]/, '$1')
}

function handleTask(promiseTask, respList) {
    if (promiseTask.children) {
        return promiseTask.task().then((resp) => {
            respList.push(resp)
            promiseTask.children = promiseTask.children.filter(item => {
                return !!item
            })
            return Promise.all(
                promiseTask.children.map(item => {
                    return handleTask(item, respList)
                })
            )
        })
    } else {
        return promiseTask.task().then(resp => {
            respList.push(resp)
        })
    }
}

function handlePromiseList(list) {
    const respList = [];
    list = list.filter(function(item) {
        return item != null;
    });
    const handledList = list.map((item) => {
        return handleTask(item, respList);
    });
    return Promise.all(handledList).then(() => {
        return respList;
    });
}

// demo

// let taskList = [
//     {
//         task: function() {
//             return new Promise((resolve, reject) => {
//                 setTimeout(() => {
//                     console.log(1111)
//                     resolve()
//                 }, 1000)
//             })
//         },
//         children: [
//             {
//                 task: function() {
//                     return new Promise((resolve, reject) => {
//                         setTimeout(() => {
//                             console.log(1112)
//                             resolve()
//                         }, 1000)
//                     })
//                 },
//                 children: [
//                     {
//                         task: function() {
//                             return new Promise((resolve, reject) => {
//                                 setTimeout(() => {
//                                     console.log(1122)
//                                     resolve()
//                                 }, 1000)
//                             })
//                         } 
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         task: function() {
//             return new Promise((resolve, reject) => {
//                 setTimeout(() => {
//                     console.log(2222)
//                     resolve()
//                 }, 2000)
//             })
//         }
//     }
// ]

// handlePromiseList(taskList).then(resp => {
//     console.log(resp)
//     console.log('complete')
// })

module.exports.getType = getType
module.exports.handlePromiseList = handlePromiseList