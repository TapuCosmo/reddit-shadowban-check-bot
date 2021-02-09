"use strict";

const Snoowrap = require("snoowrap");

const config = require("../config.json");

const bot = new Snoowrap({
  username: config.account.username,
  password: config.account.password,
  clientId: config.account.clientID,
  clientSecret: config.account.clientSecret,
  userAgent: `nodejs:reddit-shadowban-check-bot:v${require("../package.json").version} (by /u/${config.owner})`
});

const usernamePrefixRegex = new RegExp(`^/?u/${config.account.username}`, "iu");

let botRunning = true;

(async () => {
  await checkMentions();
  await checkPosts();
  console.log("Initial loop successful.");
})();

async function checkMentions() {
  if (!botRunning) return;
  try {
    const msgs = await bot.getUnreadMessages();
    for (const msg of msgs) {
      try {
        if (!usernamePrefixRegex.test(msg.body)) return;
        const args = msg.body.replace(usernamePrefixRegex, "").trim().split(/\s+/);
        const targetUsername = args[0]?.match(/^\/?u\/([A-Za-z0-9_-]{3,20})$/)?.[1] ?? msg.author.name;
        try {
          const targetUser = await bot.getUser(targetUsername).fetch();
          if (targetUser.is_suspended) {
            msg.reply(`**/u/${targetUsername} is suspended**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
            console.log(`Checked ${targetUsername}: suspended`);
            continue;
          }
        } catch (e) {
          if (e.statusCode === 404) {
            if (await bot.checkUsernameAvailability(targetUsername)) {
              msg.reply(`**/u/${targetUsername} does not currently exist**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
              console.log(`Checked ${targetUsername}: does not exist`);
              continue;
            } else {
              msg.reply(`**/u/${targetUsername} is shadowbanned**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
              console.log(`Checked ${targetUsername}: shadowbanned`);
              continue;
            }
          } else {
            console.error(e);
          }
        }
        msg.reply(`**/u/${targetUsername} is __not__ shadowbanned**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
        console.log(`Checked ${targetUsername}: not shadowbanned`);
      } catch (e) {
        console.error(e);
      }
    }
    if (msgs.length) {
      await bot.markMessagesAsRead(msgs);
    }
  } catch (e) {
    console.error(e);
  }
  setTimeout(checkMentions, config.mentionCheckTimeout);
}

async function checkPosts() {
  if (!botRunning) return;
  try {
    const unprocessedPosts = await bot.getNew(config.targetSubreddit, {
      limit: 100,
      show: "all"
    });
    const filteredPosts = unprocessedPosts.filter(p => !p.hidden && p.created_utc * 1000 > config.postCheckTimestampLimit);
    for (const msg of filteredPosts) {
      try {
        const targetUsername = msg.author.name;
        try {
          const targetUser = await bot.getUser(targetUsername).fetch();
          if (targetUser.is_suspended) {
            msg.reply(`**/u/${targetUsername} is suspended**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
            console.log(`Checked ${targetUsername}: suspended`);
            await msg.hide();
            continue;
          }
        } catch (e) {
          if (e.statusCode === 404) {
            if (await bot.checkUsernameAvailability(targetUsername)) {
              msg.reply(`**/u/${targetUsername} does not currently exist**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
              console.log(`Checked ${targetUsername}: does not exist`);
              await msg.hide();
              continue;
            } else {
              msg.reply(`**/u/${targetUsername} is shadowbanned**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
              console.log(`Checked ${targetUsername}: shadowbanned`);
              await msg.hide();
              continue;
            }
          } else {
            console.error(e);
          }
        }
        msg.reply(`**/u/${targetUsername} is __not__ shadowbanned**.\n---\n*^(This is an automatic reply. Contact) ^[/u/${config.owner}](https://www.reddit.com/user/${config.owner}) ^(if there are any issues.)*`);
        console.log(`Checked ${targetUsername}: not shadowbanned`);
        await msg.hide();
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
  setTimeout(checkPosts, config.postCheckTimeout);
}

// Graceful shutdown
process.on("SIGINT", () => {
  botRunning = false;
  setTimeout(() => {
    console.log("Exiting...");
    process.exit();
  }, 5000);
});

process.on("SIGTERM", () => {
  botRunning = false;
  setTimeout(() => {
    console.log("Exiting...");
    process.exit();
  }, 5000);
});
