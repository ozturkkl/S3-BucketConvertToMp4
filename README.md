# s3-bucket-convert-to-mp4
This is a repo to convert non .mp4 videos to .mp4 in your S3 bucket in order to have html5 video previews. It is fully automated, here is how it works...

## Usage
Fist download the code to your machine and ad the .env file with required parameters to the root directory.
```.env
ACCESS_KEY_ID=YourAccessKeyId
SECRET_ACCESS_KEY=YourSecretAccessKey
BUCKET=YourBucket
```
Then install packages and start the app. (Node is required) See below for options.
```node
npm i
npm run start
```
The code will find video files that are not .mp4 and create a .mp4 version for browser use. The file will be saved under the same directory with the same name with .mp4 extension.

## Options
| Option          | Default              | Explanation                                                                                                                                        |
| --------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| preset          | **Very Fast 720p30** | Determines the preset for the encoding. A list of presets can be found [here](https://handbrake.fr/docs/en/latest/technical/official-presets.html) |
| delete-original | **false**            | Whether if the original video file(.avi, .mkv, .mov, etc.) should be deleted from the bucket after successful conversion.                          |

### Example use: 
```node
node index.js preset="Very Fast 576p25" delete-original=true
```
or
```node
npm start preset="Very Fast 576p25" delete-original=true
```

## Things to know: 
- Your machine has to have List Objects permission granted in S3 configuration.
- Videos are encoded using handbrake.js, this process will require some cpu so it is advised that you put this on a seperate machine.
- Once run, the code will check for new files every 20 mins and attempt to convert them.
- The original files are not deleted after the process, there will be two files with the same name but different extension. Ex. myVideo.avi myVideo.mp4

## Sample Console Output: 
```
Fetching Objects...
Filtering Videos...

There are 68 videos to encode.

------------------- Starting Video #1 -------------------      
Downloading video:  subfolder1/videos/exampleVideo.avi
Encoding video:  subfolder1/videos/exampleVideo.avi
Uploading video:  subfolder1/videos/exampleVideo.mp4
------------------- Done Video #1 -------------------

------------------- Starting Video #2 -------------------      
Downloading video:  subfolder2/videos/anotherExampleVideo.mov
Encoding video:  subfolder2/videos/anotherExampleVideo.mov
Uploading video:  subfolder2/videos/anotherExampleVideo.mp4
------------------- Done Video #2 -------------------

...
```

## License
This project is licensed under the MIT License.