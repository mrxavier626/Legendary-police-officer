import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  TextChannel,
  Guild,
  GuildMember,
} from "discord.js";
import { getGuildConfig } from "./storage.js";

export async function sendVerificationEmbed(guild: Guild) {
  const config = getGuildConfig(guild.id);
  if (!config.verifyChannelId || !config.verifyRoleId) {
    return { success: false, message: "Verification channel or role not set. Use /setverify first." };
  }

  const channel = guild.channels.cache.get(config.verifyChannelId) as TextChannel;
  if (!channel) return { success: false, message: "Verification channel not found." };

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🔒 Server Verification")
    .setDescription(
      "Click the **Verify** button below to gain access to the server.\n\n" +
      "**Why verify?**\n" +
      "• Prevent bots\n" +
      "• Protect the community\n" +
      "• Unlock all channels"
    )
    .setFooter({ text: `${guild.name} • Verification System` })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId("verify_button")
    .setLabel("✅ Verify")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await channel.send({ embeds: [embed], components: [row] });
  return { success: true, message: "Verification embed sent!" };
}

export async function handleVerifyButton(interaction: ButtonInteraction) {
  if (interaction.customId !== "verify_button") return;

  const config = getGuildConfig(interaction.guildId!);
  if (!config.verifyRoleId) {
    await interaction.reply({ content: "❌ Verification role not configured.", ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  if (member.roles.cache.has(config.verifyRoleId)) {
    await interaction.reply({ content: "✅ You are already verified!", ephemeral: true });
    return;
  }

  try {
    await member.roles.add(config.verifyRoleId);
    await interaction.reply({
      content: "✅ You have been verified! Welcome to the server. You now have access to all channels.",
      ephemeral: true,
    });
  } catch {
    await interaction.reply({
      content: "❌ Failed to verify you. Please contact an admin.",
      ephemeral: true,
    });
  }
}
