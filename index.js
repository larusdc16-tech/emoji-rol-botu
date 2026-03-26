const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', () => {
    console.log(`Minecraft Sunucu Botu ${client.user.tag} adıyla hazır!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'kurulum') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Bu komutu kullanmak için yönetici yetkiniz olmalı!');
        }

        const embed = new EmbedBuilder()
            .setTitle('⛏️ Minecraft Sunucusu - Rol Seçimi')
            .setDescription('Lütfen kendine uygun rolleri aşağıdaki emojilere tıklayarak seç!')
            .setColor('Green')
            .addFields(
                { name: '🖥️ Platform', value: '🎮: Xbox\n💻: PC\n📱: Mobile', inline: false },
                { name: '🗺️ Bölge', value: '🇪🇺: EU | 🇺🇸: NA | 🌏: AS\n🇦🇺: OCE | 🇧🇷: SA | 🌍: AF', inline: false },
                { name: '🎂 Yaş', value: '🧔: 30+ | 🧑: 25-29 | 👨: 21-24\n👱: 18-20 | 👦: 15-17 | 👶: 13-14', inline: false }
            );

        const msg = await message.channel.send({ embeds: [embed] });
        
        // config.json'u mesaj ID'si ile güncelle (Bot kapanıp açılsa da çalışması için)
        config.setup_message_id = msg.id;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

        // Emojileri ekle
        for (const emoji of Object.keys(config.roles_data)) {
            await msg.react(emoji);
        }

        await message.delete();
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.id !== config.setup_message_id) return;

    if (reaction.partial) await reaction.fetch();

    const roleId = config.roles_data[reaction.emoji.name];
    if (roleId) {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(roleId);

        if (role && member) {
            await member.roles.add(role).catch(console.error);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.id !== config.setup_message_id) return;

    if (reaction.partial) await reaction.fetch();

    const roleId = config.roles_data[reaction.emoji.name];
    if (roleId) {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(roleId);

        if (role && member) {
            await member.roles.remove(role).catch(console.error);
        }
    }
});

client.login(config.token);