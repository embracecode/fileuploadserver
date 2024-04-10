const multiparty = require('multiparty')

const path = require('path')


const fs = require('fs')
/*-API-*/
// 延迟函数
const delay = function delay(interval) {
    typeof interval !== "number" ? interval = 1000 : null;
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, interval);
    });
};

// 检测文件是否存在
const exists = function exists(path) {
    return new Promise(resolve => {
        fs.access(path, fs.constants.F_OK, err => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
};


// 基于multiparty插件实现文件上传处理 & form-data解析
const uploadDir = `${process.cwd()}/upload`;
// const uploadDir = path.join(__dirname, '../upload')

const multiparty_upload = function multiparty_upload(req, auto) {
    typeof auto !== "boolean" ? auto = false : null;
    let config = {
        maxFieldsSize: 200 * 1024 * 1024,
    };
    
    if (auto) config.uploadDir = uploadDir;
    return new Promise(async (resolve, reject) => {
        await delay();
        new multiparty.Form(config)
            .parse(req, (err, fields, files) => {
                if (err) {
                    console.log(222222);
                    reject(err);
                    return;
                }
                console.log(fields, files, 'multiparty转化参数');
                resolve({
                    fields,
                    files
                });
            });
    });
};
module.exports = {
    multiparty_upload,
    delay,
    exists,
    uploadDir,
}