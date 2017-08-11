var NPCList = {
    "alchemist": {
        "charID": "alchemist",
        "charDisplay": "the alchemist",
        "active": false,
        "roomIdx": 2,
        'symbol': 'A',
        'description': 'A pungent smell wafts towards you from where the alchemist sits, peddling his wares.'
    },
    "shieldMaker":{
        "charID": "shieldMaker",
        "charDisplay": "the shield maker",
        "active": false,
        "roomIdx": 1,
        'symbol': 'S',
        'description': 'The shield maker can improve your shield, for a price.'
    }
}

var activeNPCs = [];
var NPCListKeys = Object.keys(NPCList);
for(var i = 0; i < NPCListKeys.length; i++){
    if(NPCList[NPCListKeys[i]]['active']){
        activeNPCs.push(NPCList[NPCListKeys[i]]);
    }
}

function addNPC(name, room_map, xCoord, yCoord){
    var newNPC = new NPC(yCoord, xCoord, name);
    room_map[yCoord][xCoord] = newNPC;
}
