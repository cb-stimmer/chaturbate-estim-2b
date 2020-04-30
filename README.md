Chaturbate E-stim 2B controller
=========

An application to control the E-Stim systems 2B based on tips
Copy settings.json.example to settings.json
Adjust the settings to your preferences.
If settings are updated when the application is running it will take 10 seconds to apply them.

## Known Issues / unimplemented features

Only channel A is used at the moment.
Mode and power setting commands are disabled at the moment.


## Setup (non-docker)
* Have Google Chrome >= version 59 installed
* Have NodeJS installed
```shell
npm install -G yarn
yarn install
```

## Usage

```shell
node index.js <USERNAME HERE>
# or
yarn start <USERNAME HERE>
# or
npm start <USERNAME HERE>
```

## Debug Usage

```shell
DEBUG=chaturbate:* node index.js <USERNAME HERE>
# or
DEBUG=chaturbate:* yarn start <USERNAME HERE>
# or
DEBUG=chaturbate:* npm start <USERNAME HERE>
```

## Docker Usage

##### Helper Script
```shell
sh start-docker.sh <USERNAME HERE>
```

##### Manually

```shell
docker rm -f cb-app

docker build -t cb/app .

docker run \
  -ti \
  --name=cb-app \
  -e CB_USERNAME="<USERNAME HERE>" \
  --cap-add=SYS_ADMIN \
  cb/app
```