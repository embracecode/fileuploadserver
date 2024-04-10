const fs = require('fs')


console.log(fs.existsSync('./upload'), 'existsSync');

// 同步方法
try {
    fs.accessSync('./uploads')
    console.log('文件存在');
} catch (error) {
    console.log('文件不存在');
}

// 异步方法
fs.access('./upload',fs.constants.F_OK, (err) => {
    if (err) {
        throw err
    }
    console.log('文件存在， access');
})
