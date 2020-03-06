require('dotenv').config();
const Telegraf = require('telegraf');
const { sendFromGenesis } = require('./sendFromGenesis');
const { isAddressValid } = require('./isAddressValid');
const { canUserReceive, updateOrCreateUserTimestamp } = require('./fauna');
import { log, configureLogger } from './logger';
import { startLifeSignal } from './lifeSignal';
import getNtruPublicKey from './getNtruPublicKey';

if (process.env.NODE_ENV === 'production') {
  configureLogger(process.env.LOGDNA_KEY, process.env.LOGDNA_APP);
  startLifeSignal();
}
const admins: string[] = ['bstrehl', 'ceichinger', 'seb0zz', 'CorentinCl', 'Moecxck', 'tam_mo'];
const isAdmin = (username: string) => admins.some(a => a === username);

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx: any) => {
  ctx.reply('Welcome! 👋');
  ctx.reply('Please enter your address.');
});
bot.on('text', async (ctx: any) => {
  try {
    const address = ctx.message.text.trim();
    const username = ctx.message.from.username;
    log.info('User attempts to get funds', { address, username });
    const canReceive = await canUserReceive(username);

    if (isAdmin(username) || canReceive) {
      if (isAddressValid(address)) {
        log.info('User is being sent funds', { address, username });
        try {
          ctx.reply(`Understood. Your address is "${address}".`);
          ctx.reply(`*Please stand by as I fulfill your request.*`, {
            parse_mode: 'Markdown',
          });

          const ntruPublicKey = await getNtruPublicKey(address);

          if (!ntruPublicKey) {
            log.info('Public signature key has no corresponding blockchain');
            ctx.reply(`There does not seem to be a blockchain for this address.`);
            return;
          }

          const { sendAmount, hash } = await sendFromGenesis(ntruPublicKey);
          const txlAmount = sendAmount / BigInt(Math.pow(10, 7));

          ctx.reply(
            `I just sent you ~${txlAmount} TXL, you should receive it soon. The hash of the transaction is ${hash}.`,
          );
          ctx.reply(`You can track the transaction on https://explorer.tixl.dev`);

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
      ctx.reply(`You aleady received tokens for this account. Please wait 60 minutes.`);
    }
  } catch (error) {
    log.error(error);
  }
});
bot.launch();
