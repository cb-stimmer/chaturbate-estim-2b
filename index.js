'use strict';

const colors = require('colors/safe');
const ChaturbateBrowser = require('@paulallen87/chaturbate-browser');
const ChaturbateEvents = require('@paulallen87/chaturbate-events');

const browser = new ChaturbateBrowser();
const events = new ChaturbateEvents(browser);

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

process.on('exit', () => close(null));
process.on('SIGTERM', () => close(null));
process.on('uncaughtException', (e) => close(e));

events.on('app_error_log', (e) => {
  console.log(colors.white(colors.bgRed(`ERROR: ${e.message}`)));  
});

events.on('app_notice', (e) => {
  e.messages.forEach((message) => {
    console.log(colors.black(colors.bgCyan(`Notice: ${message}`)));  
  })
});

events.on('app_tab_refresh', () => {
  console.log(colors.grey('* tab refreshed'));  
});

events.on('away_mode_cancel', () => {
  console.log(colors.grey('* away mode canceled'));  
});

events.on('clear_app', () => {
  console.log(colors.grey('* clear app'));  
});

events.on('group_show_approve', (e) => {
  console.log(colors.grey(`* group show approved for ${e.tokensPerMinute} tokens per minute`));  
});

events.on('group_show_cancel', () => {
  console.log(colors.grey(`* group show canceled`));  
});

events.on('group_show_request', (e) => {
  console.log(colors.grey(`* group show request ${e.usersWaiting}/${e.usersRequired} for ${e.tokensPerMinute} tokens per minute`));  
});

events.on('hidden_show_approve', (e) => {
  console.log(colors.grey(`* hidden show approved, hidden is ${e.initialHideCam}`));  
});

events.on('kick', (e) => {
  console.log(`${e.username} was kicked`); 
});

events.on('leave_private_room', (e) => {
  console.log(colors.grey(`* ${username} has left the private show`));  
});

events.on('log', (e) => {
  console.log(colors.grey(`LOG [${e.message}]`));  
});

events.on('message_change_request', (e) => {
  console.log(colors.grey(`* message '${e.subject}' has been changed`)); 
});

events.on('personally_kicked', (e) => {
  console.log(colors.grey(`* you have been kicked because '${e.reason}'`)); 
});

events.on('private_message', (e) => {
  const username = getUserColor(e.user, e.user.username);
  console.log(`[PRIVATE MESSAGE] ${username}: ${e.message}`);  
});

events.on('private_show_approve', (e) => {
  console.log(colors.grey(`* private show approved for ${e.tokensPerMinute} tokens per minute`)); 
});

events.on('private_show_cancel', (e) => {
  console.log(colors.grey(`* private show canceled`)); 
});

events.on('private_show_request', (e) => {
  console.log(colors.grey(`* private show requested by '${e.requesterUsername}' for ${e.tokensPerMinute} tokens per minute`)); 
});

events.on('promotion', (e) => {
  console.log(colors.grey(`* '${e.toNick}' has been promoted to moderator by ${e.fromNick}`)); 
});

events.on('promotion', (e) => {
  console.log(colors.grey(`* '${e.toNick}' has been promoted to moderator by ${e.fromNick}`)); 
});

events.on('purchase', (e) => {
  console.log(colors.white(colors.bgMagenta(e.message))); 
});

events.on('receive_tip', (e) => {
  console.log(colors.bgYellow(colors.black(`${e.fromUsername} tipped ${e.amount} tokens: ${e.message}`)));   
});

events.on('refresh_panel', (e) => {
  console.log(colors.grey(`* panel refreshed`)); 
});

events.on('revoke', (e) => {
  console.log(colors.grey(`* '${e.fromNick}' has revoked moderator privs from ${e.toNick}`)); 
});

events.on('room_count', (e) => {
  console.log(colors.black(colors.bgWhite(`${e.count} viewers`))); 
});

events.on('room_entry', (e) => {
  const username = getUserColor(e.user, e.user.username);
  console.log(`${username} has joined the room`);  
});

events.on('room_leave', (e) => {
  const username = getUserColor(e.user, e.user.username);
  console.log(`${username} has left the room`);  
});

events.on('room_message', (e) => {
  const username = getUserColor(e.user, e.user.username);
  console.log(`${username}: ${e.message}`);  
});

events.on('settings_update', (e) => {
  console.log(colors.grey(`* Allow Privates: ${e.allowPrivates}`)); 
  console.log(colors.grey(`* Allow Groups: ${e.allowGroups}`)); 
  console.log(colors.grey(`* Min Users For Groups: ${e.minimumUsersForGroupShow}`)); 
  console.log(colors.grey(`* Private Price: ${e.privatePrice}`)); 
  console.log(colors.grey(`* Group Price: ${e.groupPrice}`)); 
  console.log(colors.grey(`* Spy Price: ${e.spyPrice}`)); 
});

events.on('silence', (e) => {
  console.log(`${e.silencedNick} was silenced by ${e.silencerNick}`);
});

events.on('tip', (e) => {
  console.log(colors.bgYellow(colors.black(`${e.user.username} tipped ${e.amount} tokens`)));   
});

events.on('title_change', (e) => {
  console.log(colors.white(colors.bgBlue(`room title changed to: ${e.title}`)));  
});

events.on('token_balance_update', (e) => {
  console.log(colors.grey(`* token balances: ${e.usernames} -> ${e.tokenAmounts}`));   
});

browser.start().then(() => {
  const username = process.argv[2] || process.env['CB_USERNAME'];
  browser.navigate(username);
})