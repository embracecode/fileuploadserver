const multiparty = require('./mulyiparty')
const fs = require('fs')

const merge = (name, count) => {
    return new Promise(async (resolve, reject) => {
        let path = `${multiparty.uploadDir}/${name}`,
        // let path = name
            fileList = [],
            suffix,
            isExists
        isExists = await multiparty.exists(path)

        if (!isExists) {
            reject('filename path is not found!')
            return
        }

        fileList = fs.readdirSync(path)

        if (fileList.length < count) {
            reject('the slice has not been uploaded complate!');
            return;
        }
        let reg = /_(\d+)/;
        let sortfileList = fileList.sort((a, b) => {
            
            return reg.exec(a)[1] - reg.exec(b)[1];
        })
        sortfileList.forEach(filesplic => {
            !suffix ? suffix = /\.([0-9a-zA-Z]+)$/.exec(filesplic)[1] : null;
            fs.appendFileSync(`${multiparty.uploadDir}/${name}.${suffix}`, fs.readFileSync(`${path}/${filesplic}`));
            fs.unlinkSync(`${path}/${filesplic}`);
        })
        fs.rmdirSync(path)
        resolve({
            path: `${multiparty.uploadDir}/${name}.${suffix}`,
            filename: `${name}.${suffix}`
        });
    })
}

module.exports = merge