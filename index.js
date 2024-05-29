const express = require('express')
const bodyParser = require('body-parser')
const multiparty = require('./filehandle/mulyiparty')
const writeFile = require('./filehandle/writefile')
const SparkMD5 = require('spark-md5')
const fs = require('fs')
const merge = require('./filehandle/merge')





const app = express()
const Host = 'http://127.0.0.1'
const Port = 9999

const HOSTNAME = `${Host}:${Port}`

app.use((req, res, next) => {
    res.header('Access-control-Allow-Origin', '*')
    req.method === 'OPTIONS' ? res.send('CURRENT SERVICES SUPPORT CROSS DOMAIN REQUESTS!') : next()
})

app.use(bodyParser.urlencoded({ extended: false, limit: '1024mb' }))


app.listen(Port, () => {
    console.log(`THE WEB SERVICE IS CREATED SUCCESSFULLY AND IS LISTENING TO THE PORT：${Port}，YOU CAN VISIT：${HOSTNAME}`)
})


// 基于multiparty插件实现文件上传处理 & form-data解析
const uploadDir = `${__dirname}/upload`;

// 单文件上传处理「FORM-DATA」
app.post('/upload_single', async (req, res) => {
    try {
        let {
            files
        } = await multiparty.multiparty_upload(req, true);
        let file = (files.file && files.file[0]) || {};


        res.send({
            code: 0,
            codeText: 'upload success',
            originalFilename: file.originalFilename,
            servicePath: file.path.replace(__dirname, HOSTNAME)
        });
    } catch (err) {
        res.send({
            code: 1,
            codeText: err
        });
    }
});


// 单文件上传处理「base64」
app.post('/upload_single_base64', async (req, res) => {
    let file = req.body.file,
        filename = req.body.filename,
        spark = new SparkMD5.ArrayBuffer(),
        suffix = /\.([0-9a-zA-Z]+)$/.exec(filename)[1],
        isExists = false,
        path;
    
    file = decodeURIComponent(file);
    file = file.replace(/^data:image\/\w+;base64,/, "");
    file = Buffer.from(file, 'base64');
    spark.append(file);
    path = `${multiparty.uploadDir}/${spark.end()}.${suffix}`;
    await multiparty.delay();
    // 检测是否存在
    isExists = await multiparty.exists(path);
    if (isExists) {
        res.send({
            code: 0,
            codeText: 'file is exists',
            originalFilename: filename,
            servicePath: path.replace(__dirname, HOSTNAME)
        });
        return;
    }
    // writeFile(res, path, file, filename, false);
    writeFile({res, path, file, filename, stream: false, hostname: HOSTNAME});
    
});


// 单文件上传处理「base64」
app.post('/upload_single_name', async (req, res) => {
    try {
        let { files, fields } = await multiparty.multiparty_upload(req)
        let file = (files.file && files.file[0]) || {};
        let filename = (fields.filename && fields.filename[0]) || '';
        let path = `${multiparty.uploadDir}/${filename}`
        let isExists = await multiparty.exists(path)
        if (isExists) {
            res.send({
                code: 0,
                codeText: 'file is exists',
                originalFilename: filename,
                servicePath: path.replace(__dirname, HOSTNAME)
            });
            return;
        }
        writeFile({res, path, file, filename, stream: true, hostname: HOSTNAME});

    } catch (error) {
        res.send({
            code: 1,
            codeText: error
        });
    }
    
});

// 文件分快上传
app.post('/upload_chunk', async (req, res) => {
    try {
        let { files, fields } = await multiparty.multiparty_upload(req)
        let file = (files.file && files.file[0]) || {},
            filename = (fields.filename && fields.filename[0]) || "",
            path = '',
            isExists = false;
        // 旧版处理 整个文件作为md5加密内容
        let [, HASH] = /^([^_]+)_(\d+)/.exec(filename)
        path = `${multiparty.uploadDir}/${HASH}`

        // 新版处理 把真个文件按照md5分片加密 
        // path = multiparty.temporaryDirectory
        !fs.existsSync(path) ? fs.mkdirSync(path) : null

        // 旧版处理 整个文件作为md5加密内容
        path = `${uploadDir}/${HASH}/${filename}`;

        // 新版处理 把真个文件按照md5分片加密 
        // path = `${path}${filename}`
        isExists = await multiparty.exists(path);

        if (isExists) {
             res.send({
                code: 0,
                codeText: 'file is exists',
                originalFilename: filename,
                servicePath: path.replace(__dirname, HOSTNAME)
            });
            return;
        }

        writeFile({res, path, file, filename, stream: true, hostname: HOSTNAME});

    } catch (error) {
        res.send({
            code: 1,
            codeText: error
        });
    }
})

// 获取已上传文件
app.get('/upload_already', async (req, res) => {
    let { HASH } = req.query
    let path = `${multiparty.uploadDir}/${HASH}`,
        fileList = []
    try {
        fileList = fs.readdirSync(path);
        let reg = /_(\d+)/;
        fileList = fileList.sort((a, b) => {
            return reg.exec(a)[1] - reg.exec(b)[1];
        });
        res.send({
            code: 0,
            codeText: '',
            fileList: fileList
        });
    } catch (error) {
        console.log(error, 'already报错');
        res.send({
            code: 0,
            codeText: '',
            fileList: fileList
        });
    }
})


// 对上传的切片合并
app.post('/upload_merge', async (req, res) => {
    let { HASH, count, filename } = req.body;
    // let name = multiparty.temporaryDirectory
    // console.log(name, '上传的文件名或者哈希');
    try {
        // 如果传了HASH 用HASH 作为文件名 传了filename用filename做文件名
        let { filename, path } = await merge(HASH, count)
        res.send({
            code: 0,
            codeText: 'merge success',
            originalFilename: filename,
            servicePath: path.replace(__dirname, HOSTNAME)
        });
    } catch (error) {
        res.send({
            code: 1,
            codeText: error
        });
    }
})



// 对访问静态目录做处理
app.use(express.static('./'));
app.use((req, res) => {
    res.status(404);
    res.send('NOT FOUND!');
});
