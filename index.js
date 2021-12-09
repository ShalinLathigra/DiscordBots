#!/usr/bin/env node
const { token } = require('./config.json');

const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');

// Initialize connection to mongoDb
// const db = require('./util/db.js');
// db.init();

/*
        Set Up Client
 */
const client = new Client({ intents: [Intents.FLAGS.GUILDS]});
client.commands = generate_commands_from_dir("./commands");
function generate_commands_from_dir(path)
{
    const ret = new Collection();
    const commandFiles = fs.readdirSync(path).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`${path}/${file}`);
        console.log(command)
        ret.set(command.data.name, command);
    }  
    return ret;
}


/*
        Event handlers
 */

client.once('ready', async () => {
    console.log(`Logged into discord as ${client.user.tag}`);
});

// Command listener
client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while executing command!' + command, ephemeral: true });
	}
});
/*
client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) return;
    const button = client.buttons.get(interaction.customId);
    try {
		await button.execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while pressing button: ' + button, ephemeral: true });
	}
});*/

// Select menu listener
client.on('interactionCreate', interaction => {
	if (!interaction.isSelectMenu()) return;
    console.log(interaction.customId)
});


/*
        Log In
 */
client.login(token);
