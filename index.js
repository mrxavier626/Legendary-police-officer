const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  REST,
  Routes,
  EmbedBuilder,
} = require("discord.js");

// ---------- ENV LOADER ----------
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PREFIX = process.env.PREFIX || "#";

if (!TOKEN) {
  console.error("❌ Missing DISCORD_BOT_TOKEN in .env");
  process.exit(1);
}

// ---------- IMPORTS ----------
const { slashCommands } = require("./commands/slashDefs");
const { handleSlashCommand } = require("./commands/commandHandlers");
const { handlePrefixCommand } = require("./commands/prefixHandler");
const { handleVerifyButton, handleHelpButtons } = require("./commands/verification");
const {
  ensureDataFiles,
  getGuildConfig,
} = require("./managers/storage");

// ---------- CLIENT ----------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
client.prefix = PREFIX;

// ---------- READY ----------
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);

  ensureDataFiles();

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(Routes.applicationCommands(readyClient.user.id), {
      body: slashCommands,
    });

    console.log(`✅ Registered ${slashCommands.length} slash commands`);
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
});

// ---------- GUILD MEMBER JOIN ----------
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const config = getGuildConfig(member.guild.id);

    if (!config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("👮 Welcome")
      .setDescription(
        `Welcome to **${member.guild.name}**, <@${member.id}>!\n\nPlease go to the verification channel and click the button to get access.`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("GuildMemberAdd error:", error);
  }
});

// ---------- PREFIX COMMANDS ----------
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    await handlePrefixCommand(client, message);
  } catch (error) {
    console.error("MessageCreate error:", error);
  }
});

// ---------- SLASH + BUTTONS ----------
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(client, interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("verify_")) {
        await handleVerifyButton(client, interaction);
        return;
      }

      if (interaction.customId.startsWith("help_")) {
        await handleHelpButtons(client, interaction);
        return;
      }
    }
  } catch (error) {
    console.error("InteractionCreate error:", error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Something went wrong while handling that interaction.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

// ---------- LOGIN ----------
client.login(TOKEN);
