const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const { StartGameInfo, AlreadyInGameWarning, InvalidPlayerCountWarning, InitStateInfo }  = require('../utils/replies.js');
const { TryGetPlayer, DeleteGame, CreateGame, AddPlayerToGame, GetMinionCount, CanStart }  = require('../utils/db.js');

const NAME = 'create';
const DESCRIPTION = 'Create a new lobby';

function generate_user_embed(author, users)
{
	let participant_string = "";
	
	users.forEach(function(user, index) {
		participant_string += "<@" + user+">\n";
	});

	if (participant_string === "")
	{
		participant_string = "Lobby Empty";
	}

	let embed = new MessageEmbed()
	.setAuthor("<@" + author.username+">")
	.setTitle("<@" + author.username+">'s Avalon Lobby")
	.addFields(
		{ name: 'Owner', value: "<@" + author+">" },
		{ name: 'Participants', value: participant_string },
	)
	.setTimestamp()
	.setFooter(StartGameInfo);

	return embed;
}

module.exports = {
	name: NAME,
    description: DESCRIPTION,
	data: new SlashCommandBuilder()
		.setName(NAME)
		.setDescription(DESCRIPTION),
	async execute(interaction) {
		
		const userIds = [];

		let threadPromise = interaction.channel.threads.create({
			name: "<@" + interaction.user.username+">'s Avalon Game",
			autoArchiveDuration: 60,
			reason: "Game Lobby"
		})
		/* 
				Initial Response
		*/

		// Check if user already owns or is playing in a game
		let {success, game_id} = await TryGetPlayer(interaction.user.id);
		if (success)
		{
			// If this is the case, send an ephemeral failure message
			await interaction.reply({ content: AlreadyInGameWarning, ephemeral: true});
			return;
		}
		// Else, INSTANTIATE GAME
		game_id = await CreateGame(threadPromise, interaction.user.id);
		
		const embed = generate_user_embed(interaction.user, userIds);
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('join')
					.setLabel('Join')
					.setStyle('PRIMARY'),
			)
			.addComponents(
				new MessageButton()
					.setCustomId('start')
					.setLabel('Start')
					.setStyle('SECONDARY'),
			);
		await interaction.reply({ content: "New Game:", embeds: [embed], components: [ row ], ephemeral: false});

		/* 
				Collectors + Call additional methods.
		*/
        let message = await interaction.fetchReply();
		let started = false;

		const filter = i => (i.customId === 'join' && i.user.id === interaction.user.id) || (i.customId === 'start' && i.user.id === interaction.user.id);
        const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000 });
		
		// Collect folks and add them to the db
        collector.on('collect', async i => {
			// now we know that the game exists. check: 

			let {success, g_id} = await TryGetPlayer(i.user.id);
			console.log(success, " ", g_id)
			if (i.customId === 'join')
			{
				if (!success)
				{
					await AddPlayerToGame(i.user.id, game_id);
					userIds.push(i.user.id)
					threadPromise.then(threadChannel => threadChannel.members.add(i.user));
					await interaction.editReply({ embeds: [generate_user_embed(interaction.user, userIds)] });
					await i.reply({ content: `Joined <@${interaction.user.id}>'s game!`, ephemeral: true });
				}
				else {
					await i.reply({ content: AlreadyInGameWarning, ephemeral: true });
				}
			} else {
				if (await CanStart(game_id)) {
					started = true;
					await interaction.editReply({ components: [] });
					await interaction.followUp({ content: `Started <@${interaction.user.id}>'s game!`, ephemeral: 67 });
					// Send thread message indicating the next steps.
					let count = await GetMinionCount(g_id);
					threadPromise.then(threadChannel => threadChannel.send({ content: InitStateInfo.format( count ) }))
				// Send messages in threadChannel?
				} else {
					await interaction.followUp({ content: InvalidPlayerCountWarning, ephemeral: true });
				}
			}
        });
		
        collector.on('end', async () => {
			if (!started)
			{
				await interaction.editReply({ content: `<@${interaction.user.id}>'s game timed out.`, components: [], embeds: [] });
				threadPromise.then(threadChannel => threadChannel.delete())
				await DeleteGame(game_id);
			}
        });
	},
};