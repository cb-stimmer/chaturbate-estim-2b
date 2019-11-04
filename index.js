'use strict';

const colors = require('colors/safe');
const ChaturbateBrowser = require('@paulallen87/chaturbate-browser');
const ChaturbateController = require('@paulallen87/chaturbate-controller');

const browser = new ChaturbateBrowser();
const controller = new ChaturbateController(browser);

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
const ArrayList = require('arraylist')
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 })

var list = new ArrayList;
var current_setting = {time:0,level:0}
var flag_end_stim = false

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
  console.log('message written', cmd)
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

function processTip(tip_val) {
  if (tip_val <= 1) {
    push(5,20);
  } else if (tip_val < 15) {
    push(15,25);
  } else if (tip_val < 30) {
    push(20,30);
  } else if (tip_val < 50) {
    push(20,35);
  } else {
    push(5,40);
  }
}
/*
Sp5cial shock - Tip (100) 1 sec painful shock
  } else if (tip_val == 100) {
    push(1,50);
*/


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
});

controller.on('token_balance_update', (e) => {
  console.log(colors.grey(`* token balances: ${e.usernames} -> ${e.tokenAmounts}`));   
});

browser.start().then(async () => {
  const username = process.argv[2] || process.env['CB_USERNAME'];
  await browser.profile(username);
})