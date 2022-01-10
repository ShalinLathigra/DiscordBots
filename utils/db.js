const game_set = {};
const player_set = {};

let game_id = 0;
const owner = "owner_id";
const players = "player_ids";
const allies = "ally_ids";
const minions = "minion_ids";
const voters = "voter_ids";
const voted = "voted_ids";
const stage = "stage";
const phase = "phase";
const quest_successes = "quest_successes";
const quest_failures = "quest_failures";
const proposals = "proposal_failures";
const thread = "thread";

const SETUP = 0;    // Game not started
const START = 1;    // Game Started, waiting for a PROPOSAL
const PROPOSAL = 2; // Currently on a PROPOSAL, waiting for a QUEST
const QUEST = 3;    // Currently on a QUEST, waiting for a vote

/*
    Player Management
*/
async function TryGetPlayer(id){
    let success = id in player_set;
    if(success)
    {
        return {"success": success, "gameId": player_set[id]};
    } else {
        return {"success": false, "gameId": undefined};
    }
}
async function AddPlayerToGame(p_id, g_id){
    if (!g_id in game_set)
    {
        return false;
    } else if (p_id in player_set){
        return false;
    } else {
        game_set[g_id][players].push(p_id);
        player_set[p_id] = g_id;
        return g_id;
    }
}

/*
    GAME Management
*/
async function CreateGame(threadPromise, ownerID) {
    game_id += 1;
    game_set[game_id] = { 
        owner_id: ownerID,
        player_ids: [],
        ally_ids: [],
        minion_ids: [],
        voter_ids: [],
        voted_ids: [],
        stage: 0,
        phase: SETUP,
        quest_successes: 0,
        quest_failures: 0,
        proposal_failures: 0,
        thread: threadPromise,
        };
    return game_id;
}
async function TryGetGame(id)
{
    let success = id in game_set;
    return { "success": success, "id": game_set[id] };
}
async function DeleteGame(id)
{
    if (id in game_set){
        game_set[id][players].forEach(player_id => {
            if (player_set.hasOwnProperty(player_id))
            {
                delete player_set[player_id];
            }
        });
        return true;
    }
    return false;
}

/*
    GAME Accessors
*/
async function GenerateGameEmbed(gameId)
{
    let {success, game} = TryGetGame(gameId); 
    let embed = new MessageEmbed()

    // State
	let state_string = "";
	let description_string = "";
    switch(game.phase)
    {
        case SETUP: state_string = "Set Up"; description_string = "Waiting for the owner <@" + game[owner] + "> to press start!"; break;
        case START: state_string = "Waiting for Proposal"; description_string = "Error"; break;
        case PROPOSAL: state_string = "Waiting for Votes"; description_string = "Error"; break;
        case QUEST: state_string = "Questing"; description_string = "Error"; break;
        default: state_string = "Error"; description_string = "Error";
    }

    embed.setTitle(state_string);
    embed.setDescription(description_string);
    
    // Wins vs Losses
	let victory_string = "";
    for (let i = 0; i < game.quest_successes; i++) { victory_string += ":Aerin: "; }
    victory_string += " | ";
    for (let i = 0; i < game.quest_failures; i++) { victory_string += ":japanese_goblin: "; }

    // Participants
	let participant_string = "";
	game.player_ids.forEach(function(id) {
		participant_string += "<@" + id+">\n";
	});
	if (participant_string === "") { participant_string = "Lobby Empty"; }

    embed.addFields(
        { name: 'Progress', value: victory_string },
        { name: 'Participants', value: participant_string },
    );
    // If phase SETUP:
    //  Tell owner to start

    // Else If phase START:
    //  Tell the first owner to make proposal
    //  Indicate how many consecutive failures there have been

    // Else If phase PROPOSAL
    //  Print out remaining proposal voters

    // Else if phase QUEST
    //  Print out remaining Quest voters

    embed.setTimestamp()
    .setFooter("Next Step: ");

    return embed;
}
async function GetMinionCount(id)
{
    let success, game = TryGetGame(id);
    if (success)
    {
        return game[minions].length;
    } else {
        return -1;
    }
}
async function CanStart(id)
{
    let { success, game } = await TryGetGame(id);
    if (success /* Check participant count here*/) {
        return true;
    } else {
        return false;
    }
}
module.exports = {

    TryGetPlayer,
    DeleteGame,
    AddPlayerToGame,
    CreateGame,
    TryGetGame,
    GetMinionCount,
    CanStart
};