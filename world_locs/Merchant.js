/*
 * This file should be for the Merchat location
 *
 * Most of the buy/sell logic happens in module/vendormod.js
 */
class Merchant extends Location{
    constructor(rowID, colID, itemList){
        super(rowID, colID, "Merchant", "merchant", "m", "Another wanderer has set up shop here, vending his wares – for a price.", false, true);
        this.itemList = itemList;

        // Generate an inventory for the merchant
        // See #125 for "The Poor Merchant" description
        this.inv = new Inventory(itemList, 10, 3, 1000) //items, maxItems, minItems, maxGoldSpawn
    }

    hero_interact(){
        var merch = this;
        var shopFunc = function(){
            txtmd.revertTxtMd();
            vndmd.openModForInvTransfer(hero.inv, merch.inv, true) //true means can sell
        }
        txtmd.parseTxtMdJSON({"msgs": [["dec", merch.message, "Shop", "Leave", shopFunc]]})
    }
}
