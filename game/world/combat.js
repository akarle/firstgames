/*
 * This file contains combat related functions
 */

//Necesary resets before combat
function setup_combat(hero, enemy){
    // cant move
    canMove = false;

    // reset all effects
    for(var i = 0; i < effectList.length; i++){
        effectList[i].active = false;
    }

    // refresh enemy health
    enemy.vitality = enemy.maxVitality; //bc we use same objects across mult. fights

    // refresh enemy inventory
    enemy.regenInv()

    //set spell targets:
    for(var i = 0; i < hero.spells.length; i++){
        hero.spells[i].target = enemy;
        for(var n = 0; n < ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'].length; n++){
            if(ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target === 'enemy'){
                ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target = enemy;
            }
            else if(ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target === 'hero'){
                ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target = hero;
            }
        }
        for(var m = 0; m < ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'].length; m++){
            if(ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target === 'enemy'){
                ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target = enemy;
            }
            else if(ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target === 'hero'){
                ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target = hero;
            }
        }
    }
}


//Where the combat really happens
function fight_enemy(hero, enemy){
    // first set up the fight
    setup_combat(hero, enemy)

    // next begin the fight!
    txtmd.commentator("the enemy looms in the dark")
    txtmd.setPosition("combat", hero)

    cmbmd.openMod(hero, enemy) //open combat mod

    // Start the onslaught
    enemyAttack = setInterval(function() {
        if (hero_protected == true) {
            Damage(enemy, heroShield)
        } else {
            Damage(enemy, hero)
            txtmd.commentator("the enemy strikes!")
        }

        cmbmd.enemyAttackAnimation(enemy)

        // if the hero dies
        if (hero.vitality <= 0) {
            killPlayer("You died!");
        }

        // if the hero shield breaks
        if (heroShield.vitality <= 0) {
            // stop shielding
            window.clearInterval(shielded);
            window.clearTimeout(shieldUp);
            shieldUp = -1;
            hero_protected = false;
            heroShield.shieldReady();
            cmbmd.indicateShieldOff()
        }
    }, 10000 / enemy.dexterity);


    // handle attack button
    document.getElementById("attack").onclick = function() {
        if (ready) {
            ready = false;
            window.setTimeout(readyUp, 10000 / hero.dexterity);

            // Handle effect item buffs ----------------
            var weapon = hero.equip_inv.inv.weapon
            if (weapon != null && weapon.constructorName == 'effectItem') {
                console.log("buffing up")
                weapon.buffUp(hero);
                weapon.debuffUp(enemy);
            }
            var armor = hero.equip_inv.inv.armor
            if (armor != null) {
                if (armor.constructorName == 'effectItem') {
                    armor.buffUp(hero);
                    armor.debuffUp(enemy);
                }
            }
            var headgear = hero.equip_inv.inv.headgear
            if (headgear != null) {
                if (headgear.constructorName == 'effectItem') {
                    headgear.buffUp(hero);
                    headgear.debuffUp(enemy);
                }
            }

            // Do the damage + commentate
            hitprint = Damage(hero, enemy);
            if(enemy.vitality > 0){
                txtmd.commentator("You strike for " + hitprint + "damage!")
            }

            cmbmd.heroAttackAnimation(hero)
        }
    };

    // handle defense
    document.getElementById("defend").onclick = function() {
        if (hero_protected == false && heroShield.vitality > 0 && heroShield.shield_ready) {
            heroShield.shield_ready = false;
            cmbmd.startShieldUp()
            shieldUp = setTimeout(function(){
                Shield();
                // show the shield ascii
                cmbmd.showShieldUp()
                shielded = setInterval(function() {
                    Shield()
                }, heroShield.recovery * 1000);
            }, heroShield.weight * 1000);
        }
    }

    // if you click the module, stop shielding
    document.getElementById('combat-module').onclick = function() {
        if (heroShield.shield_ready == false && hero_protected == true || heroShield.vitality <= 0) {
            window.clearInterval(shielded);
            window.clearTimeout(shieldUp);
            shieldUp = -1;
            heroShield.shieldReady();
            hero_protected = false;
            cmbmd.indicateShieldOff()
        }
    }
}

//As of new txtmd, enter_combat is only for normal combat
function enter_combat(room) {
    //Its a normal combat, choose randomly from the en_list of the room
    enemy = room.enemy_list[Math.floor(Math.random() * room.enemy_list.length)];

    // set up enemy loot
    enemy.lootId = Math.floor(Math.random() * mobDrops.length);

    // decrease room's enemy count
    room.num_enemies--;

    // now actually fight the enemy
    var entermsg = "A fearsome " + enemy.name + " emerges from the shadows!"
    var enterfunc = function(){ txtmd.revertTxtMd(); fight_enemy(hero, enemy) }

    txtmd.parseTxtMdJSON({"msgs": [["finfunc", entermsg, "Engage", enterfunc]]})
}

function exit_combat(room, customCombat) {
    console.log('exiting combat');
    // Give hero xp
    hero.xp += room.xp;
    refreshOpenMods();

    // If not a room-clearing fight
    if (room.num_enemies > 0 || customCombat == true ) {
        $("#worldMap").show();
        txtmd.revertTxtMd()
    }
    // Room cleared!
    else {
        console.log("room cleared!")

        // Print cleared message
        var clearmsg = "The fog clears, and looking around there seemed to be no more monsters... A hole in the floor seems to be the only way out of this hellish place."
        clearFunc = function() {
                $("#worldMap").show();
                txtmd.revertTxtMd();
            }

        txtmd.parseTxtMdJSON({"msgs": [["finfunc", clearmsg, "Return", clearFunc]]});

        // Clear room and redraw map (fog changes)
        room.roomCleared = true;
        room_list[curr_floor][curr_room].clearAllFogTimeouts();
        room_list[curr_floor][curr_room].buildRoomHTML(avatarX,avatarY, torchlight,fog_radius);
    }

    // Handle the spells @mbkarle is responsible here down
    for(var i = 0; i < hero.spells.length; i++){
        hero.spells[i].target = enemy;
        for(var n = 0; n < ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'].length; n++){
            if(ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target.constructorName === 'Enemy' || ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target.constructorName === 'Boss'){
                ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['buffs'][n].target = 'enemy';
            }
        }
        for(var m = 0; m < ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'].length; m++){
            if(ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target.constructorName === 'Enemy' || ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target.constructorName === 'Boss'){
                ACTIVE_SPELL_EFFECTS[hero.spells[i].name]['debuffs'][m].target = 'enemy';
            }
        }
    }
}

function Damage(source, target) {
    // Check if custom combat (determines mob-drops)
    var customCombat = false;
    if(target.constructorName == 'Boss'){
        customCombat = true;
    }
    room = room_list[curr_floor][curr_room];

    // calculate damage and deal it
    hit = Math.floor(Math.random() * source.strength + source.strength);
    target.vitality -= hit;

    // refresh html indications of damage
    cmbmd.refreshOnDamage(target)
    refreshOpenMods();

    //if the source was a hero (check based on if target is enemy or boss), and target dead
    if ((target.constructorName == 'Enemy' || customCombat) && target.vitality <= 0) {
        // set vit to 0 (nonneg)
        target.vitality = 0;

        // stop the onslaught
        window.clearInterval(enemyAttack);
        window.clearInterval(shielded);
        window.clearInterval(shieldUp)
        hero_protected = false;
        heroShield.shieldReady();

        // hide appropriate things
        cmbmd.close()

        //Handle mob drops
        var exitFunc = function() { exit_combat(room, customCombat) }
        if(target.inv.size() > 0){
            var txtmodmsg = {"msgs": [
                ["trans", "You've defeated the beast!"],
                ["finfunc", "a treasure from the fight is left behind", "Examine",
                    function(){ txtmd.showInventory(target.inv, exitFunc)} ]] }
        }
        else{
            var txtmodmsg = {"msgs": [["finfunc", "You've defeated the beast!", "X", exitFunc]]}
        }

        // print messages
        txtmd.setPosition("high")
        txtmd.parseTxtMdJSON(txtmodmsg)
    }
    return hit;
}

function Shield() {
    if(hero.vitality + heroShield.healthBoost <= hero.maxVitality){
        hero.vitality += heroShield.healthBoost;
    }
    else if(hero.vitality + heroShield.healthBoost > hero.maxVitality && hero.vitality < hero.maxVitality){
      hero.vitality = hero.maxVitality;
    }
    refreshOpenMods();
    hero_protected = true;
}

function readyUp() {
    ready = true;
    return ready;
}

function killPlayer(deathMessage){
    // Stop the onslaught
    window.clearInterval(enemyAttack);
    window.clearInterval(shielded);
    window.clearTimeout(shieldUp);

    // cant go below zero
    hero.vitality = 0;
    refreshOpenMods();

    // prepare to restart
    var restartFunc = function() {
        start_game();
        txtmd.revertTxtMd()
    }

    var txtmdmsg = {"msgs": [["finfunc", deathMessage, "Restart", restartFunc]]}
    txtmd.parseTxtMdJSON(txtmdmsg)

    // Clear the timeouts in this room
    room_list[curr_floor][curr_room].clearAllFogTimeouts();

    // Hide combat stuff
    cmbmd.close()
    shieldUp = -1;

    // Save gold
    doge.inv.gold = Math.floor(hero.inv.gold * doge.goldCarryFrac)
}
