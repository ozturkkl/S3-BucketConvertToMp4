# wasabi-video-encode
This is a repo to convert non .mp4 videos to .mp4 in order to have html5 video previews. It is fully automated here is how it works...

## Usage
Fist download the code to your machine and ad the .env file with required parameters to the root directory.
```.env
ACCESS_KEY_ID=YourAccessKeyId
SECRET_ACCESS_KEY=YourSecretAccessKey
BUCKET=YourBucket
```
Then install packages and start the app. (Node is required)
```node
npm i
npm run start
```
The code will automatically find video files that are not .mp4 and create a low resolution .mp4 vairant for preview in the browser. The file will be saved under the same directory with the same name with mp4 extension.

## Things to know: 
- Your machine has to have List Objects permission granted in S3 configuration.
- Videos are encoded using handbrake.js, this task will require some cpu so it is advised that you put this on a seperate machine.
- Once run, the code will check for new files every 20 mins and attempt to convert them.
- The original files are not deleted after the process, there will be two files with the same name but different extension. Ex. myVideo.avi myVideo.mp4

## Sample Console Output: 
```
PUT CONSOLE OUTPUT
```

## License
This project is licensed under the MIT License.
