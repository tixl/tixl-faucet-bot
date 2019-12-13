require('dotenv').config();
const Telegraf = require('telegraf');
const { sendFromGenesis } = require('./sendFromGenesis');
const { isAddressValid } = require('./isAddressValid');
const { canUserReceive, updateOrCreateUserTimestamp } = require('./fauna');
import { log, configureLogger } from './logger';
import { startLifeSignal } from './lifeSignal';

if (process.env.NODE_ENV === 'production') {
  configureLogger(process.env.LOGDNA_KEY, process.env.LOGDNA_APP);
  startLifeSignal();
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx: any) => {
  ctx.reply('Welcome! 👋');
  ctx.reply('Please enter your address.');
});
bot.on('text', async (ctx: any) => {
  const address = ctx.message.text.trim();
  const username = ctx.message.from.username;
  log.info('User attempts to get funds', { address, username });
  const canReceive = await canUserReceive(username);
  if (canReceive) {
    if (isAddressValid(address)) {
      log.info('User is being sent funds', { address, username });
      try {
        ctx.reply(`Understood. Your address is "${address}".`);
        ctx.reply(`*Please stand by as I fulfill your request.*`, {
          parse_mode: 'Markdown',
        });

        const { sendAmount, hash } = await sendFromGenesis(address);
        const txlAmount = sendAmount / BigInt(Math.pow(10, 7));

        ctx.reply(
          `I just sent you ~${txlAmount} TXL, you should receive it soon. The hash of the transaction is ${hash}.`,
        );

        log.info('User got confirmation', { address, username, amount: String(sendAmount), hash });
        await updateOrCreateUserTimestamp(username);
      } catch (error) {
        ctx.reply(`Sorry, there was an error, please try again later.`);
        log.error(error);
      }
    } else {
      log.info('User entered invalid address', { address, username });
      ctx.reply('This does not seem like a valid address. Check your address and send it again.');
    }
  } else {
    log.info('User is on timeout', { address, username });
    ctx.reply(`You aleady received tokens for this account. Please wait 48 hours.`);
  }
});
bot.launch();
