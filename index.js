require('dotenv').config()

const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk');
const mime = require('mime-types');
const hbjs = require('handbrake-js')

// Configs
const credentials = new AWS.SharedIniFileCredentials({ profile: 'wasabi' });
AWS.config.credentials = credentials;
AWS.config.credentials.accessKeyId = process.env.ACCESS_KEY_ID
AWS.config.credentials.secretAccessKey = process.env.SECRET_ACCESS_KEY
AWS.config.region = "us-east-1";

const ep = new AWS.Endpoint('s3.wasabisys.com');
const s3 = new AWS.S3({
    endpoint: ep,
    httpOptions: { timeout: 0 }
});

let processing = false
let videoInfo = null
let failedVideos = []

const argv = process.argv.slice(2).reduce((val, arg) => {
    arg = arg.split("=")
    val[arg[0]] = arg[1]
    return val
}, {})

async function main() {
    processing = true
    emptyTemp()

    console.log("\nFetching Objects...")
    const objects = (await getObjects()).Contents.map(item => item.Key)

    console.log("Filtering Videos...")
    const videos = filterVideos(objects)
    const videosToEncode = getVideosToEncode(videos)

    console.log(`\nThere are ${videosToEncode.length} videos to encode.`)
    if (failedVideos.length > 0) {
        console.log((failedVideos.length === 1) ? `\nThere is a failed video. Please make sure the video is in good shape!` : `\nThere are ${failedVideos.length} failed videos. Please make sure these videos are in good shape!`)
        failedVideos.forEach(video => console.log("Failed: ", video))
    }

    for (let i = 0; i < videosToEncode.length; i++) {
        videoInfo = path.parse(videosToEncode[i])
        videoInfo.key = videosToEncode[i]

        console.log(`\n------------------- Starting Video #${i + 1} -------------------`)
        await downloadVideo(videoInfo)
        await encodeVideo(videoInfo)
        await uploadVideo(videoInfo)
        if (argv["delete-original"] === 'true') await deleteVideo(videoInfo)
        console.log(`------------------- Done Video #${i + 1} -------------------`)
        emptyTemp()
    }
    processing = false
}
main().catch(handleMainRejection)
setInterval(() => {
    if (!processing)
        main().catch(handleMainRejection)
}, 1000 * 60 * 20); // Once every 20 mins

async function getObjects() {
    let result = null
    var params = {
        Bucket: process.env.BUCKET,
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
function filterVideos(objects, encoding) {
    return objects.filter(obj => {
        const type = mime.lookup(obj)
        if (!type) return false

        if (encoding) return type.search(encoding) !== -1

        return type.search("video") !== -1
    })
}
function getVideosToEncode(videos) {
    const mp4Videos = filterVideos(videos, "mp4")
    const videosToEncode = videos.filter(item => !mp4Videos.includes(item)).filter(item => !failedVideos.includes(item))

    return videosToEncode.filter(item => {
        const vidPath = path.parse(item)
        return !mp4Videos.includes(`${vidPath.dir}/${vidPath.name}.mp4`)
    })
}
async function downloadVideo(vid) {
    console.log("Downloading video: ", vid.key)
    var params = {
        Bucket: process.env.BUCKET,
        Key: vid.key
    };
    await new Promise((res, rej) => {
        s3.getObject(params, function (err, data) {
            if (err) console.log(err, err.stack)
            else {
                fs.writeFileSync('temp/' + vid.base, data.Body)
            }
            res()
        });
    })
}
async function encodeVideo(vid) {
    console.log("Encoding video: ", vid.key)

    const options = {
        input: 'temp/' + vid.base,
        output: 'temp/' + vid.name + '.mp4',
        preset: argv["preset"] || "Very Fast 720p30"
    }
    await hbjs.run(options)
}
async function uploadVideo(vid) {
    console.log("Uploading video: ", vid.dir + '/' + vid.name + '.mp4')

    const buffer = fs.readFileSync('temp/' + vid.name + '.mp4')

    var params = {
        Body: buffer,
        Bucket: process.env.BUCKET,
        Key: vid.dir + '/' + vid.name + '.mp4'
    };

    await new Promise((res, rej) => {
        s3.putObject(params, function (err, data) {
            if (err) console.log(err, err.stack)
            res()
        });
    })
}
async function deleteVideo(vid) {
    console.log("Deleting video: ", vid.key)

    var params = {
        Bucket: process.env.BUCKET,
        Key: vid.key
    };
    await new Promise((res, rej) => {
        s3.deleteObject(params, function (err, data) {
            if (err) console.log(err, err.stack)
            res()
        });
    })
}
function emptyTemp() {
    fs.rmdirSync('temp', { recursive: true, force: true })
    fs.mkdirSync('temp')
    videoInfo = null
}

function handleMainRejection(e) {
    failedVideos.push(videoInfo.key)
    console.error(e)
    main().catch(handleMainRejection)
}