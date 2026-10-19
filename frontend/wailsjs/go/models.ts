export namespace analysis {
	
	export class ChampionStat {
	    championId: number;
	    championName: string;
	    games: number;
	    wins: number;
	    winRate: number;
	
	    static createFrom(source: any = {}) {
	        return new ChampionStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.championId = source["championId"];
	        this.championName = source["championName"];
	        this.games = source["games"];
	        this.wins = source["wins"];
	        this.winRate = source["winRate"];
	    }
	}
	export class PlayerAnalysis {
	    summonerId: number;
	    puuid: string;
	    summonerName: string;
	    team: string;
	    isSelf: boolean;
	    role: string;
	    rankTier: string;
	    totalGames: number;
	    wins: number;
	    losses: number;
	    winRate: number;
	    avgKills: number;
	    avgDeaths: number;
	    avgAssists: number;
	    avgKp: number;
	    kda: number;
	    horseTier: string;
	    horseName: string;
	    horseTag: string;
	    tags: string[];
	    topChampions: ChampionStat[];
	
	    static createFrom(source: any = {}) {
	        return new PlayerAnalysis(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summonerId = source["summonerId"];
	        this.puuid = source["puuid"];
	        this.summonerName = source["summonerName"];
	        this.team = source["team"];
	        this.isSelf = source["isSelf"];
	        this.role = source["role"];
	        this.rankTier = source["rankTier"];
	        this.totalGames = source["totalGames"];
	        this.wins = source["wins"];
	        this.losses = source["losses"];
	        this.winRate = source["winRate"];
	        this.avgKills = source["avgKills"];
	        this.avgDeaths = source["avgDeaths"];
	        this.avgAssists = source["avgAssists"];
	        this.avgKp = source["avgKp"];
	        this.kda = source["kda"];
	        this.horseTier = source["horseTier"];
	        this.horseName = source["horseName"];
	        this.horseTag = source["horseTag"];
	        this.tags = source["tags"];
	        this.topChampions = this.convertValues(source["topChampions"], ChampionStat);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MatchAnalysisResult {
	    phase: string;
	    hasData: boolean;
	    blueTeam: PlayerAnalysis[];
	    redTeam: PlayerAnalysis[];
	    lastUpdated: string;
	
	    static createFrom(source: any = {}) {
	        return new MatchAnalysisResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.phase = source["phase"];
	        this.hasData = source["hasData"];
	        this.blueTeam = this.convertValues(source["blueTeam"], PlayerAnalysis);
	        this.redTeam = this.convertValues(source["redTeam"], PlayerAnalysis);
	        this.lastUpdated = source["lastUpdated"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace config {
	
	export class Config {
	    autoAccept: boolean;
	    acceptDelayMs: number;
	    autoQueue: boolean;
	    targetMembers: number;
	    autoPlayAgain: boolean;
	    autoHonor: boolean;
	    startWithOS: boolean;
	    minimizeToTray: boolean;
	    alwaysOnTop: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.autoAccept = source["autoAccept"];
	        this.acceptDelayMs = source["acceptDelayMs"];
	        this.autoQueue = source["autoQueue"];
	        this.targetMembers = source["targetMembers"];
	        this.autoPlayAgain = source["autoPlayAgain"];
	        this.autoHonor = source["autoHonor"];
	        this.startWithOS = source["startWithOS"];
	        this.minimizeToTray = source["minimizeToTray"];
	        this.alwaysOnTop = source["alwaysOnTop"];
	    }
	}

}

export namespace lcu {
	
	export class SummonerInfo {
	    summonerId: number;
	    puuid: string;
	    displayName: string;
	    gameName: string;
	    tagLine: string;
	    profileIconId: number;
	    summonerLevel: number;
	
	    static createFrom(source: any = {}) {
	        return new SummonerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summonerId = source["summonerId"];
	        this.puuid = source["puuid"];
	        this.displayName = source["displayName"];
	        this.gameName = source["gameName"];
	        this.tagLine = source["tagLine"];
	        this.profileIconId = source["profileIconId"];
	        this.summonerLevel = source["summonerLevel"];
	    }
	}

}

export namespace service {
	
	export class LogEntry {
	    time: string;
	    level: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new LogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.time = source["time"];
	        this.level = source["level"];
	        this.message = source["message"];
	    }
	}
	export class ServiceStatus {
	    connected: boolean;
	    port: number;
	    phase: string;
	    summoner?: lcu.SummonerInfo;
	
	    static createFrom(source: any = {}) {
	        return new ServiceStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connected = source["connected"];
	        this.port = source["port"];
	        this.phase = source["phase"];
	        this.summoner = this.convertValues(source["summoner"], lcu.SummonerInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

