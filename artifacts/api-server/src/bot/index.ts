import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  Interaction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import { logger } from "../lib/logger.js";
import { slashCommands } from "./slash-defs.js";
import { handleSlashCommand } from "./command-handlers.js";
import { handlePrefixCommand } from "./prefix-handler.js";
import { handleVerifyButton } from "./verification.js";
import { getGuildConfig, dmRelaySessions, isVcBanned } from "./storage.js";
import { buildHelpEmbed, buildHelpRow, TOTAL_PAGES } from "./help-pages.js";

const token = process.env["DISCORD_BOT_TOKEN"];
if (!token) throw new Error("DISCORD_BOT_TOKEN is required");

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
  ],
});

client.once(Events.ClientReady, async (c) => {
  logger.info({ tag: c.user.tag }, "Discord bot logged in");
  try {
    const rest = new REST().setToken(token!);
    await rest.put(Routes.applicationCommands(c.user.id), {
      body: slashCommands.map(cmd => cmd.toJSON()),
    });
    logger.info(`Registered ${slashCommands.length} slash commands`);
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
});

// Slash commands + button interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction as ChatInputCommandInteraction);
    } else if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;
      if (btn.customId.startsWith("hp:")) {
        // Help pagination buttons: hp:p|n:PAGE:USER_ID
        const parts = btn.customId.split(":");
        const dir = parts[1];
        const currentPage = parseInt(parts[2], 10);
        const ownerId = parts[3];
        if (btn.user.id !== ownerId) {
          await btn.reply({ content: "Only the user who ran `/help` can flip through pages.", ephemeral: true });
          return;
        }
        if (dir === "info") { await btn.deferUpdate(); return; }
        const newPage = dir === "n" ? currentPage + 1 : currentPage - 1;
        if (newPage < 0 || newPage >= TOTAL_PAGES) { await btn.deferUpdate(); return; }
        await btn.update({ embeds: [buildHelpEmbed(newPage)], components: [buildHelpRow(newPage, ownerId)] });
      } else {
        await handleVerifyButton(btn);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error handling interaction");
  }
});

// VC ban enforcement — kick from VC if they join while vcbanned
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (!newState.channel || !newState.guild || !newState.member) return;
  if (isVcBanned(newState.guild.id, newState.member.id)) {
    await newState.member.voice.disconnect().catch(() => {});
  }
});

// Prefix # commands + DM relay forwarding
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // DM relay — forward user DMs to the mod log channel
  if (!message.guild) {
    const session = dmRelaySessions.get(message.author.id);
    if (session) {
      const guild = client.guilds.cache.get(session.guildId);
      if (!guild) return;
      const relayChannel = guild.channels.cache.get(session.relayChannelId) as TextChannel;
      if (relayChannel) {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(`📨 DM from ${message.author.username}`)
          .setDescription(message.content || "*(no text content)*")
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: `User ID: ${message.author.id}` })
          .setTimestamp();
        await relayChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
    return;
  }

  // Prefix # commands
  await handlePrefixCommand(message);
});

// Welcome message on member join
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  const config = getGuildConfig(member.guild.id);
  if (!config.welcomeChannelId) return;
  const channel = member.guild.channels.cache.get(config.welcomeChannelId) as TextChannel;
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("👮 New Member Arrived!")
    .setDescription(`Welcome to **${member.guild.name}**, <@${member.id}>!\n\nPlease head to the verification channel and click **Verify** to access the server.`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.Error, (err) => {
  logger.error({ err }, "Discord client error");
});

export function startBot() {
  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
    process.exit(1);
  });
}
