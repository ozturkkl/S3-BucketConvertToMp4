require('dotenv').config()
const AWS = require('aws-sdk');

// Configs
const credentials = new AWS.SharedIniFileCredentials({ profile: 'wasabi' });
AWS.config.credentials = credentials;
AWS.config.credentials.accessKeyId = process.env.ACCESS_KEY_ID
AWS.config.credentials.secretAccessKey = process.env.SECRET_ACCESS_KEY
AWS.config.region = "us-east-1";

const ep = new AWS.Endpoint('s3.wasabisys.com');
const s3 = new AWS.S3({ endpoint: ep });

async function main() {
    console.log("Fetching Objects...")
    const objects = (await getObjects()).Contents

    console.log("Fetching Videos...")
    const videos = objects.filter(obj => {
        return obj.Key.search(/\.flv|\.mov|\.wmv|\.yuv|\.qt/) !== -1
    })
    
    console.log(videos)
}

main().catch(e => console.error(e))

async function getObjects() {
    let result = null
    var params = {
        Bucket: "peel9attach",
        MaxKeys: 999999
    };
    await new Promise((res, rej) => {
        s3.listObjectsV2(params, function (err, data) {
            if (err) {
                rej(err)
            }
            else {
                result = data
                res()
            }
        });
    })

    return result
}