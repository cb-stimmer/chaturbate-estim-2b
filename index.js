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
  switch(user.type) {
    case 'HOST':
      return colors.yellow(str);
    case 'MODERATOR':
      return colors.red(str);
    case 'FANCLUB':
      return colors.green(str);
    case 'TIPPED_TONS':
      // i ran out of colors...
    case 'TIPPED_ALOT':
      return colors.magenta(str);
    case 'TIPPED_RECENTLY':
      return colors.blue(str);
    case 'HAS_TOKENS':
      return colors.cyan(str);
    default:
      return colors.grey(str);
  }
}

process.on('exit', () => close(null));
process.on('SIGTERM', () => close(null));
process.on('uncaughtException', (e) => close(e));

events.on('silence', (e) => {
  console.log(`${e.target} was silenced by ${e.source}`);
});

events.on('kick', (e) => {
  console.log(`${e.target} was kicked`); 
});

events.on('notice', (e) => {
  console.log(colors.black(colors.bgCyan(`Notice: ${e.message}`)));  
});

events.on('tip', (e) => {
  console.log(colors.bgYellow(colors.black(`${e.user.username} tipped ${e.amount} tokens`)));   
});

events.on('message', (e) => {
  const username = getUserColor(e.user, e.user.username);
  console.log(`${username}: ${e.message}`);  
});

events.on('room_message', (e) => {
  console.log(colors.white(colors.bgBlue(`* ROOM: ${e.message}`)));  
});

events.on('moderator_message', (e) => {
  const username = colors.red(e.user.username);
  console.log(`${username} has ${e.action}`); 
});

events.on('fanclub_message', (e) => {
  const username = colors.green(e.user.username);
  console.log(`${username} has ${e.action}`); 
});

events.on('purchase', (e) => {
  console.log(colors.white(colors.bgMagenta(e.message)));
});

browser.start().then(() => {
  const username = process.argv[2] || process.env['CB_USERNAME'];
  browser.navigate(username);
})