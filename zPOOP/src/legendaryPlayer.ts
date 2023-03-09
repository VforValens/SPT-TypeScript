import { IBotBase } from "@spt-aki/models/eft/common/tables/IBotBase";
import { GlobalValues as gv} from "./GlobalValuesModule";
import { POOPDifficulty as pd} from "./POOPDifficulty";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import * as crypto from 'crypto';
import { IPmcData } from "@spt-aki/models/eft/common/IPmcData";
import { Difficulties } from "@spt-aki/models/eft/common/tables/IBotType";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";

export class LegendaryPlayer {

	//store legendary player into the botgenerationcache
	static PushLegendaryPlayer(SessionID: string)
	{
		
		let player = this.ReadFileEncrypted(`${gv.modFolder}/donottouch/legendary.json`);
		if (player == null) {
			return;
		}

		//legendary player chance is 15 percent right now
		const LegendaryPlayerModeChance: boolean = gv.randomUtil.getChance100(85);

		if (LegendaryPlayerModeChance) {
			
			//create array of bots based on player.info.side and player.info.settings.difficulty
			let botarray: IBotBase[] = [];
			let difficultyArray: string[] = ["easy", "normal", "hard", "impossible"];

			//loop through the difficulty array and create 2 bots for each difficulty 
			for (let i = 0; i < difficultyArray.length; i++) {
				let difficulty = difficultyArray[i];
				let bot = this.CreateBot(player);
				bot.Info.Settings.Difficulty = difficulty;
				bot.Info.Settings.Role = "Savage";
				bot.Info.Side = "Savage";
				botarray.push(bot);
				botarray.push(bot);
			}

			//generate the key as it is a string value of player.info.side + player.info.settings.difficulty
			let key = player.Info.Settings.Role + player.Info.Settings.Difficulty;
			//push the botarray into the botgenerationcache using storemethod
			gv.botGenerationCacheService.storeBots(player.Info.Side, botarray);
		}


	}

	static CreateBot(player: IPmcData): IBotBase
	{
		let bot: IBotBase = player;
		this.PreparePlayerStashIDs(bot.Inventory.items);
		return bot;
	}

	static StoreLegendBotFile(SessionID: string)
	{
		if(gv.config.EnableLegendaryPlayerMode){
			let data: IPmcData = gv.profileHelper.getPmcProfile(SessionID);
			let legendaryFile: IPmcData = gv.clone(data);
			
			let items = legendaryFile.Inventory.items;
			this.PreparePlayerStashIDs(items);
	
			this.SaveToFileEncrypted(legendaryFile, `${gv.modFolder}/donottouch/legendary.json`);
		}
	}

	static PreparePlayerStashIDs(items: any): Item[] {

		let newItems = [];
		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			if (item._id == "hideout") {
				continue;
			}
			item._id = gv.hashUtil.generate();
			newItems.push(item);
		}
		return newItems;
	}

	static SaveToFileEncrypted(data: any, filePath: string) {
		var fs = require('fs');
		const hashedData = { ...data, hash: this.HashEncode(data) };
		fs.writeFile(gv.modFolder + filePath, JSON.stringify(hashedData, null, 4), function (err) {
			if (err) throw err;
		});
	}

	static HashEncode(data: any): string {
		const hash = crypto.createHash('sha256');
		hash.update(JSON.stringify(data));
		return hash.digest('hex');
	  }

	static ReadFileEncrypted(filePath: string): any {
		var fs = require('fs');
		const jsonString = fs.readFileSync(filePath, 'utf-8');
		const data = JSON.parse(jsonString);

		// Now you can access the original data and the hash
		const originalData = { ...data };
		delete originalData.hash;
		const hash = data.hash;

		// Verify the hash by comparing it to a new hash of the original data
		const newHash = this.HashEncode(originalData);
		const isHashValid = hash === newHash;

		if (isHashValid) {
			return originalData;
		}
		else {
			gv.logger.error(`POOP:${filePath} Hash is not valid`);
			return null;
		}
	}

	//does it know if it should be a death or survival?
	static progDifficultygenerated(survivalcount: number, threshold: number, step: number): number {
		let change = Math.round(Math.pow(step, survivalcount) * 100) / 100
		change -= 1;

		if (change > threshold) {
			return threshold
		} else {
			let output = change.toFixed(2)
			return parseFloat(output);
		}
	}

	static serialize(data: { err: number; errmsg: any; data: any; }, prettify = false) {
		if (prettify) {
			return JSON.stringify(data, null, "\t");
		}
		else {
			return JSON.stringify(data);
		}
	}

	static clone(data: any) {
		return JSON.parse(JSON.stringify(data));
	}

}