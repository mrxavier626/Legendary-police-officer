const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const helpPages = [
  {
    title: "👮 Setup Commands",
    description:
      "`#setlog #channel` / `/setlog`\nSet the log channel\n\n" +
      "`#setwelcome #channel` / `/setwelcome`\nSet the welcome channel\n\n" +
      "`#setverify #channel @role` / `/setverify`\nSet verify channel and role\n\n" +
      "`#setupverify` / `/setupverify`\nPost the verify button\n\n" +
      "`#help` / `/help`\nShow the help menu"
  },
  {
    title: "🔨 Moderation Commands 1",
    description:
      "`#ban @user [reason]` / `/ban`\nBan a user\n\n" +
      "`#unban <userid>` / `/unban`\nUnban by user ID\n\n" +
      "`#kick @user [reason]` / `/kick`\nKick a user\n\n" +
      "`#mute @user <duration>` / `/mute`\nTimeout a user\n\n" +
      "`#unmute @user` / `/unmute`\nRemove timeout"
  },
  {
    title: "🔨 Moderation Commands 2",
    description:
      "`#warn @user <reason>` / `/warn`\nWarn a user\n\n" +
      "`#warnings @user` / `/warnings`\nSee warnings\n\n" +
      "`#clearwarn @user` / `/clearwarn`\nClear warnings\n\n" +
      "`#purge <amount>` / `/purge`\nDelete messages"
  },
  {
    title: "🔒 Channel Commands",
    description:
      "`#lock [#channel]` / `/lock`\nLock a channel\n\n" +
      "`#unlock [#channel]` / `/unlock`\nUnlock a channel\n\n" +
      "`#say <message>` / `/say`\nMake the bot say something"
  },
  {
    title: "📝 Notes and VC",
    description:
      "`#note @user <text>` / `/note`\nAdd note to user\n\n" +
      "`#notes @user` / `/notes`\nShow notes\n\n" +
      "`#vcban @user` / `/vcban`\nVC ban a user"
  },
  {
    title: "ℹ️ Info Commands",
    description:
      "`#ping` / `/ping`\nShow bot ping\n\n" +
      "`#userinfo [@user]` / `/userinfo`\nShow user info\n\n" +
      "`#avatar [@user]` / `/avatar`\nShow avatar\n\n" +
      "`#serverinfo` / `/serverinfo`\nShow server info"
  }
];

function buildHelpEmbed(page) {
  const item = helpPages[page];

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(item.title)
    .setDescription(item.description)
    .setFooter({ text: `Page ${page + 1} / ${helpPages.length}` });
}

function buildHelpRow(page, userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev_${page}_${userId}`)
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),

    new ButtonBuilder()
      .setCustomId(`help_next_${page}_${userId}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === helpPages.length - 1)
  );
}

module.exports = {
  helpPages,
  buildHelpEmbed,
  buildHelpRow
};
