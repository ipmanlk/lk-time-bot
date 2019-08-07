const DiscordJs = require("discord.js");
const Channel = require("./controllers/channel");
const Config = require("./config/config.json");
const Time = require("./controllers/time");
const DevLog = require("./libs/lkDevLog");
const client = new DiscordJs.Client();

client.on("message", message => {
    // check if user has admin perms
    if (!(message.member && message.member.hasPermission("ADMINISTRATOR"))) {
        return;
    }

    // handle msg
    try {
        handleMessage(message);
    } catch (error) {
        console.log(error);
    }

});

const handleMessage = (message) => {
    const msgTxt = message.content;
    // check msg start with prefix
    if (msgTxt.startsWith(Config.BOT_PREFIX)) {

        // check if command exists
        if (msgTxt.split(" ")[1]) {
            // get command from prefix
            const command = msgTxt.split(" ")[1].toLowerCase().trim();
            // do relevent action to that command
            switch (command) {
                case "setup":
                    Channel.create(message.guild).catch(error => console.log(error));
                    message.reply("Setting up the bot channel.");
                    break;
                case "start":
                    Time.start(message.guild);
                    message.reply("Starting the bot channel.");
                    break;
                case "eval":
                    runEval(message);
                    break;
                default:
                    message.reply("I don't know that command boi.");
            }
            // delete msg
            message.delete(1000);
        }
    }
};

// when bot is ready, update time on current guilds
client.on("ready", () => {
    client.guilds.forEach(guild => {
        Time.start(guild);
        // get and post invites for guilds in devLog
        guild.fetchInvites().then(invites => {
            invites.every(invite => {
                DevLog.postLog(client, `**Name: ${guild.name}** | **ID: ${guild.id}** | **Invite: ${invite.code}** | LKTime Started!.`);
                return;
            });
        });
    });

    // activity
    updateActivity();
});

// when bot is added to a new server, create a time channel
client.on("guildCreate", (guild) => {
    Channel.create(guild);
    updateActivity();
    DevLog.postLog(client, `**{${guild.name}}:** LKTime Joined!.`);
});

// when bot is removed from a server, update activity
client.on("guildDelete", (guild) => {
    updateActivity();
    Time.stop(guild);
    DevLog.postLog(client, `**{${guild.name}}:** LKTime Left!.`);
});

const updateActivity = (message) => {
    client.user.setActivity(`Serving ${client.guilds.size} servers | By LK Developers 🇱🇰`);
};

const runEval = async(message) => {
    let command = message.content.split(`${Config.BOT_PREFIX} eval`)[1].trim();

    const owners = ["468009964263178262", "522099856563765249"]
    if(!owners.includes(message.author.id)) return message.channel.send('Suck a fat one');

    let evaled;
    try {
        evaled = await eval(command);
    } catch (err) {
        const embed = new DiscordJs.RichEmbed();
        embed.setTitle('JavaScript Eval');
        embed.setColor('RED');
        embed.setDescription(`[Error]\n \`\`\`js\n${err}\`\`\``);
        embed.setFooter(client.user.username, client.user.avatarURL);
        embed.setTimestamp();
        return message.channel.send(embed);
    }

    if (typeof evaled === 'string') {
        evaled = evaled.replace(client.token, '[TOKEN]');
    }


    if (typeof evaled === 'object') {
        evaled = require('util').inspect(evaled, {
            depth: 0
        });
    }
    if (evaled == undefined) {
        evaled = 'undefined';
    }

    const embed = new DiscordJs.RichEmbed();
    embed.setTitle('JavaScript Eval');
    embed.setColor('GREEN');
    embed.setDescription(`\`\`\`js\n${evaled}\`\`\``);
    embed.setFooter(client.user.username, client.user.avatarURL);
    embed.setTimestamp();
    message.channel.send(embed);
}

// login to client
client.login(Config.BOT_TOKEN);
