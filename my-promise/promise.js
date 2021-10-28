function Promise(executor) {
    // 添加属性
    this.PromiseState = 'pending';
    this.PromiseResult = null;
    // 用于保存异步请求中promise对象
    this.callbacks = [];
    // 由于resolve/reject是直接调用（this指向window）
    // 将this保存，指向该实例对象
    const self = this;
    // resolve函数
    function resolve(data) {
        // 判断状态，保证只执行一次
        if (self.PromiseState != 'pending')
            return
        // 修改对象的状态
        self.PromiseState = "fullfilled";
        // 设置对象的结果值
        self.PromiseResult = data;
        // 对于异步请求，真正执行的时刻
        setTimeout(()=>{
            self.callbacks.forEach(item => {
                item.onResolved(data);
            })
        })
    }

    function reject(data) {
        if (self.PromiseState != 'pending')
            return
        self.PromiseState = "rejected";
        self.PromiseResult = data;
        setTimeout(() => {
            self.callbacks.forEach(item => {
                item.onRejected(data);
            })
        });
    }
    // 对抛出异常的处理
    try {
        executor(resolve, reject);
    } catch (error) {
        reject(error)
    }
}

Promise.prototype.then = function (onResolved, onRejected) {
    const self = this;
    // 穿透
    if (typeof onRejected !== 'function') {
        onRejected = reason => {
            throw reason;
        }
    }
    if (typeof onResolved !== 'function') {
        onResolved = value => {
            return value;
        }
    }
    return new Promise((resolve, reject) => {
        function callback(type) {
            try {
                let result = type(self.PromiseResult);
                if (result instanceof Promise) {
                    result.then(v => {
                        resolve(v)
                    }, r => {
                        reject(r)
                    })
                } else {
                    // 结果对象状态为成功
                    resolve(result);
                }
            } catch (e) {
                reject(e)
            }
        };
        if (this.PromiseState === 'fullfilled') {
            // 获取回调函数的执行结果
            // setTimeout是为了实现then方法中的事件是异步操作
            setTimeout(()=>{
                callback(onResolved)
            })
        }
        if (this.PromiseState === 'rejected') {
            setTimeout(()=>{
                callback(onRejected)
            })
        }
        if (this.PromiseState === 'pending') {
            // 当状态改变之后，就会执行
            this.callbacks.push({
                onResolved: function () {
                    // 执行成功的回调函数
                    callback(onResolved)
                },
                onRejected: function () {
                    callback(onRejected)
                }
            });
        }
    })
}

Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected);
}

Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
        if (value instanceof Promise) {
            value.then(v => {
                resolve(v);
            }, r => {
                reject(r)
            })
        } else {
            resolve(value)
        }
    })
}

Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
        reject(reason)
    })
}

Promise.all = function (promises) {
    // 返回结果为Promise对象
    return new Promise((resolve, reject) => {
        // 声明变量(计数器)
        let count = 0;
        // 存放成功结果
        let arr = [];
        // 遍历
        for (let i = 0; i < promises.length; i++) {
            promises[i].then(v => {
                count++;
                arr[i] = v;
                if (count === promises.length) {
                    resolve(arr);
                }
            }, r => {
                reject(r);
            })
        }
    })
}

Promise.race = function (promises) {
    // 返回结果为Promise对象
    return new Promise((resolve, reject) => {
        // 存放成功结果
        let arr = [];
        // 遍历
        for (let i = 0; i < promises.length; i++) {
            promises[i].then(v => {
                // 修改返回对象的状态为成功
                resolve(v);
            }, r => {
                // 修改返回对象的状态为失败
                reject(r);
            })
        }
    })
}