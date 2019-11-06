'use strict';

const colors = require('colors/safe');
const ChaturbateBrowser = require('@paulallen87/chaturbate-browser');
const ChaturbateController = require('@paulallen87/chaturbate-controller');

const browser = new ChaturbateBrowser();
const controller = new ChaturbateController(browser);

const ArrayList = require('arraylist')
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 })

const fs = require('fs')
const sleep = require('sleep');

var list = new ArrayList;
var current_setting = {time:0,level:0}
var flag_end_stim = false

var tipLevels = new ArrayList;
var specialTips = new ArrayList;
var current_setting = {time:0,level:0}
var flag_end_stim = false
var current_setting = {time:0,level:0}
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

function push(time_var, level_var) {
  list.add({time:time_var,level:level_var});
}

function pop() {
  var ret = list.first();
  list.remove(0);
  return ret;
}

function set_output(level_var) {
  var cmd = "A" + level_var + "\n\r";
  port.write(cmd, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
  })
}

function set_mode(mode_var) {
  var cmd = "M" + mode_var + "\n\r";
  console.log("new mode is:", mode_var);
  port.write(cmd, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
  })
}

function set_power(power_var) {
  var cmd;
  if (power_var == "H") {
    cmd = "H\n\r";
  } else {
    cmd = "L\n\r";
  }
  port.write(cmd, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
  })
}

function update_output() {
  if (current_setting.time == 0) {
    if (list.size()) {
      current_setting = pop();
      flag_end_stim = false;
      set_output(current_setting.level);
      console.log("Set e-stim to:",current_setting.level, "for:", current_setting.time,"sec")
    } else if (!flag_end_stim) {
      console.log("End stim");
      set_output(0);
      flag_end_stim = true;
    }
  } else {
    current_setting.time --;
  }
}

function update_mode() {
    //set_power(settings.power);
    //set_mode(settings.mode);
}

function processTip(tip_val) {
  for (let specialTip of specialTips) {
    if (tip_val == specialTip.ammount) {
      push(specialTip.time,specialTip.level);
      return(0);
    }
  }
  for (let tipLevel of tipLevels) {
    if (tip_val >= tipLevel.ammount) {
      push(tipLevel.time,tipLevel.level);
      return(0);
    }
  }
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


//controller.on('receive_tip', (e) => {
//  processTip(e.amount)
//  console.log(colors.bgYellow(colors.black(`${e.fromUsername} tipped ${e.amount} tokens: ${e.message}`)));   
//});

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