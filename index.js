'use strict';

const colors = require('colors/safe');
const ChaturbateBrowser = require('@paulallen87/chaturbate-browser');
const ChaturbateController = require('@paulallen87/chaturbate-controller');
const { execSync } = require('child_process');

const browser = new ChaturbateBrowser();
const controller = new ChaturbateController(browser);

const iswin = process.platform === "win32";
var sendSerialCommand;
if (iswin) 
  {sendSerialCommand = "send_command.py"} 
else
  {sendSerialCommand = "./send_command.py"}

const ArrayList = require('arraylist')

const fs = require('fs')

var list = new ArrayList;
var current_setting = {time:0,levelA:0,levelB:0}
var flag_end_stim = false
var flag_reply_rcvd = false

var tipLevels = new ArrayList;
var specialTips = new ArrayList;
var lastSettingsMod = 0;
var settings;

const close = (e) => {
  if (e) console.error(e);
  browser.stop();
}

const getUserColor = (user, str) => {
  if (user.isHost) {
    return colors.yellow(str);
  }

  if (user.isMod) {
    return colors.red(str);
  }

  if (user.inFanclub) {
    return colors.green(str);
  }

  if (user.tippedTonsRecently) {
    return colors.magenta(str);
  }

  if (user.tippedAlotRecently) {
    return colors.magenta(str);
  }

  if (user.tippedRecently) {
    return colors.blue(str);
  }

  if (user.hasTokens) {
    return colors.cyan(str);
  }

  return colors.grey(str);
}

function sendCommand(cmd) {
  var command = "./send_command.py " + cmd + " " + settings.serialPort
//  console.log("Sending command", command)
  var output = execSync(command)
  output = output.toString()
//  console.log(output)
}



function loadSettings() {
  settings = JSON.parse(fs.readFileSync('settings.json', 'utf-8'))
  var stats = fs.statSync("settings.json");
  lastSettingsMod = stats.mtime;
  tipLevels = settings.tipLevels;
  specialTips = settings.specialTips;
  tipLevels.sort(compareValues('ammount','desc'));
}

function check_settings() {
  var stats = fs.statSync("settings.json");
  var currentSettingsMod = stats.mtime;
  if (currentSettingsMod > lastSettingsMod) {
    loadSettings();
    update_mode();
    console.log("updating settings")
  }
}

function compareValues(key, order='asc') {
  return function(a, b) {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = (typeof a[key] === 'string') ?
      a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string') ?
      b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order == 'desc') ? (comparison * -1) : comparison
    );
  };
}

function push(time_var, levelA_var, levelB_var) {
  list.add({time:time_var,levelA:levelA_var,levelB:levelB_var});
}

function pop() {
  var ret = list.first();
  list.remove(0);
  return ret;
}

function set_output(levelA_var,levelB_var) {
  var cmd = "A" + levelA_var;
  sendCommand(cmd)
  cmd = "B" + levelB_var;
  sendCommand(cmd)
}

function set_mode(mode_var) {
  var cmd = "M" + mode_var;
  console.log("new mode is:", cmd);
  sendCommand(cmd)
}

function set_power(power_var) {
  var cmd;
  if (power_var == "H") {
    cmd = "H";
  } else if (power_var == "Y") {
    cmd = "Y";
  } else {
    cmd = "L";
  }
  console.log("new mode is:", cmd);
  sendCommand(cmd)
}

function update_output() {
  if (current_setting.time == 0) {
    if (list.size()) {
      current_setting = pop();
      flag_end_stim = false;
      console.log("Set e-stim to:",current_setting.levelA, "for:", current_setting.time,"sec")
      set_output(current_setting.levelA,current_setting.levelB);
    } else if (!flag_end_stim) {
      console.log("End stim");
      set_output(0,0);
      flag_end_stim = true;
    }
  } else {
    current_setting.time --;
  }
}

function update_mode() {
    set_power(settings.power);
    set_mode(settings.mode);
}

function processTip(tip_val) {
  for (let specialTip of specialTips) {
    if (tip_val == specialTip.ammount) {
      push(specialTip.time,specialTip.levelA,specialTip.levelB);
      return(0);
    }
  }
  for (let tipLevel of tipLevels) {
    if (tip_val >= tipLevel.ammount) {
      push(tipLevel.time,tipLevel.levelA,tipLevel.levelB);
      return(0);
    }
  }
}

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
function sleep(n) {
  msleep(n*1000);
}

loadSettings();
update_mode();

setInterval(check_settings, 10000)
setInterval(update_output, 1000)

process.on('exit', () => close(null));
process.on('SIGTERM', () => close(null));
process.on('uncaughtException', (e) => close(e));


controller.on('state_change', (e) => {
  if (e == 'SOCKET_OPEN') {
    console.log(colors.black(colors.bgGreen(`Welcome to ${controller.room}'s room`)));  
  }
});


controller.on('receive_tip', (e) => {
  processTip(e.amount)
  console.log(colors.bgYellow(colors.black(`${e.fromUsername} tipped ${e.amount} tokens: ${e.message}`)));   
});

controller.on('settings_update', (e) => {
  console.log(colors.grey(`* Allow Privates: ${e.allowPrivates}`)); 
  console.log(colors.grey(`* Allow Groups: ${e.allowGroups}`)); 
  console.log(colors.grey(`* Min Users For Groups: ${e.minimumUsersForGroupShow}`)); 
  console.log(colors.grey(`* Private Price: ${e.privatePrice}`)); 
  console.log(colors.grey(`* Group Price: ${e.groupPrice}`)); 
  console.log(colors.grey(`* Spy Price: ${e.spyPrice}`)); 
});

controller.on('tip', (e) => {
  processTip(e.amount)
  console.log(colors.bgYellow(colors.black(`${e.user.username} tipped ${e.amount} tokens`)));   
});//receive_tip

controller.on('token_balance_update', (e) => {
  console.log(colors.grey(`* token balances: ${e.usernames} -> ${e.tokenAmounts}`));   
});

browser.start().then(async () => {
  const username = process.argv[2] || process.env['CB_USERNAME'];
  await browser.profile(username);
})