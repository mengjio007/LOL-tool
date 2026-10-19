export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // Header
    appTitle: 'LOL 智能助手',
    version: 'v1.0',
    alwaysOnTop: '窗口置顶',
    unpin: '取消置顶',
    minimize: '最小化',
    close: '关闭 (退出程序)',
    langToggle: 'EN',
    langToggleTitle: 'Switch to English',

    // Tabs
    tabAutomation: '自动化控制',
    tabAnalysis: '对局马匹分析',

    // Client Status
    clientReady: '客户端已就绪',
    waitingClient: '等待英雄联盟客户端启动...',
    port: '端口',
    summoner: '召唤师',
    level: 'Lv.',
    findMatch: '寻找对局',
    cancelMatch: '取消寻找',
    acceptNow: '立即接受',

    // Phases
    phaseLobby: '房间组队中',
    phaseMatchmaking: '正在排队寻找对局...',
    phaseReadyCheck: '对局匹配成功！等待接受',
    phaseChampSelect: '英雄选择中',
    phaseInProgress: '正在游戏中',
    phasePostGame: '对局结算中',
    phaseIdle: '客户端在线 (待机)',

    // Automation Settings
    coreAutomation: '核心自动化设置',
    autoAcceptTitle: '自动接受对局 (ReadyCheck)',
    enabledBadge: '开启中',
    autoAcceptDesc: '检测到对局匹配完成时自动点击“接受”按钮',
    humanDelay: '拟人化延迟:',
    delayInstant: '秒点 (0ms)',
    delayRecommended: '推荐 (800ms)',
    delaySafe: '稳妥 (1800ms)',

    autoQueueTitle: '自动寻找对局 (智能排队)',
    autoQueueDesc: '检测房间人数达到设定目标且分路就绪后，自动发起排队',
    targetMembers: '目标组队人数:',
    targetMembersAny: '不限 (全员就绪即开)',
    targetMembersWait: '满 {count} 人才开 (防止误开)',
    memberAny: '不限',
    memberSolo: '单排',
    memberDuo: '双排(2)',
    memberTrio: '三排(3)',
    memberQuad: '四排(4)',
    memberFull: '五黑(5)',

    autoPlayAgainTitle: '自动跳过荣誉 & 再来一局返回房间',
    autoPlayAgainDesc: '赛后自动跳过荣誉点赞，点击【再来一局】将车队全员带回组队房间',

    // Logs
    activityLogs: '实时运行日志',
    clearLogs: '清空',
    noLogs: '暂无运行动态，等待客户端事件...',

    // Horse Analysis
    horseRadarTitle: '对局马匹雷达 (近10场分析)',
    localOnlyBadge: '仅本地显示 · 不发送聊天消息',
    reAnalyze: '重新诊断',
    filterAll: '全部玩家',
    filterAlly: '我方队友',
    filterEnemy: '敌方对手',

    // Horse Report Console
    reportTitle: '战报信息组合 (由你决定是否发送)',
    sendChampSelect: '选人时发给队友 (BP队伍聊天)',
    sending: '发送中...',
    sendInGame: '局内发给队友 (复制后进游戏Ctrl+V)',
    copied: '已复制！',
    reportPlaceholder: '战报组合内容生成中...',
    reportTip: '💡 选人BP时点击“选人时发给队友”可直接上屏；进入峡谷对局后点击“局内发给队友”，游戏里按 Enter + Ctrl+V 即可秒发。',
    copySuccess: '已复制到剪贴板！进入游戏后按 Enter -> Ctrl+V 即可发出',
    copyFailed: '复制失败，请手动选取文本复制',
    sendSuccess: '战报已成功发送至房间/选人队伍聊天！',
    sendFailed: '发送失败，请确认是否处于选人房间',

    // Empty Analysis
    noActiveMatch: '当前尚未检测到活跃对局',
    noActiveMatchDesc: '当进入【英雄选择】或【对局进行中】时，助手将自动并行读取全员最近10场战绩，并即时评定【上等马 / 中等马 / 下等马】！',
    tryDetect: '立即尝试检测',

    // Player Card
    allyBadge: '我方',
    enemyBadge: '敌方',
    selfBadge: '你自己',
    unknownPlayer: '未知玩家',
    recentWr: '近{count}场胜率',
    winLoss: '{wins}胜{losses}负',
    avgKda: '场均 K / D / A',
    avgKp: '场均参团(K+A)',
    kdaRatio: 'KDA',
    oftenPlays: '常玩:',
    noData: '暂无数据',
    topHorse: '上等马',
    midHorse: '中等马',
    bottomHorse: '下等马',

    // Footer
    backgroundActive: '后台静默监控已启用',
    footerBrand: 'LOL 智能助手 v1.0 · 静默无打扰',
  },
  en: {
    // Header
    appTitle: 'LOL Smart Assistant',
    version: 'v1.0',
    alwaysOnTop: 'Always on Top',
    unpin: 'Unpin',
    minimize: 'Minimize',
    close: 'Close (Quit App)',
    langToggle: '中文',
    langToggleTitle: '切换为中文',

    // Tabs
    tabAutomation: 'Automation',
    tabAnalysis: 'Horse Radar',

    // Client Status
    clientReady: 'Client Ready',
    waitingClient: 'Waiting for League of Legends...',
    port: 'Port',
    summoner: 'Summoner',
    level: 'Lv.',
    findMatch: 'Find Match',
    cancelMatch: 'Cancel',
    acceptNow: 'Accept Now',

    // Phases
    phaseLobby: 'In Lobby',
    phaseMatchmaking: 'Finding Match...',
    phaseReadyCheck: 'Match Found! Ready Check',
    phaseChampSelect: 'Champ Select',
    phaseInProgress: 'In Game',
    phasePostGame: 'Post Game',
    phaseIdle: 'Client Online (Idle)',

    // Automation Settings
    coreAutomation: 'Core Automation Settings',
    autoAcceptTitle: 'Auto Accept Match (ReadyCheck)',
    enabledBadge: 'ACTIVE',
    autoAcceptDesc: 'Automatically clicks Accept as soon as a match is found',
    humanDelay: 'Humanized Delay:',
    delayInstant: 'Instant (0ms)',
    delayRecommended: 'Recommended (800ms)',
    delaySafe: 'Safe (1800ms)',

    autoQueueTitle: 'Auto Matchmaking (Smart Queue)',
    autoQueueDesc: 'Automatically starts searching once target party size & positions are ready',
    targetMembers: 'Target Party Size:',
    targetMembersAny: 'Any (Queue when ready)',
    targetMembersWait: 'Wait for {count} players (Prevents early queue)',
    memberAny: 'Any',
    memberSolo: 'Solo (1)',
    memberDuo: 'Duo (2)',
    memberTrio: 'Trio (3)',
    memberQuad: 'Quad (4)',
    memberFull: 'Full (5)',

    autoPlayAgainTitle: 'Auto Skip Honor & Play Again',
    autoPlayAgainDesc: 'Automatically skips honor animation and clicks Play Again to return party to lobby',

    // Logs
    activityLogs: 'Live Activity Logs',
    clearLogs: 'Clear',
    noLogs: 'No activity yet, waiting for client events...',

    // Horse Analysis
    horseRadarTitle: 'Match Horse Radar (Recent 10 Matches)',
    localOnlyBadge: 'Local Display Only · No Auto Chat',
    reAnalyze: 'Re-analyze',
    filterAll: 'All Players',
    filterAlly: 'Allies',
    filterEnemy: 'Enemies',

    // Horse Report Console
    reportTitle: 'Assembled Horse Report (Send at your discretion)',
    sendChampSelect: 'Send to Champ Select Chat',
    sending: 'Sending...',
    sendInGame: 'In-Game Chat (Copy & Paste)',
    copied: 'Copied!',
    reportPlaceholder: 'Assembling match report...',
    reportTip: '💡 In Champ Select, click "Send to Champ Select Chat" to post directly. In-game, click copy and press Enter + Ctrl+V.',
    copySuccess: 'Copied to clipboard! Press Enter -> Ctrl+V inside the game to post',
    copyFailed: 'Copy failed, please copy text manually',
    sendSuccess: 'Report sent to champ select team chat successfully!',
    sendFailed: 'Failed to send. Please make sure you are in champ select.',

    // Empty Analysis
    noActiveMatch: 'No Active Match Detected',
    noActiveMatchDesc: 'When entering Champ Select or In-Game, match histories will be analyzed with horse tier ratings (Top / Mid / Bottom Horse)!',
    tryDetect: 'Check Now',

    // Player Card
    allyBadge: 'ALLY',
    enemyBadge: 'ENEMY',
    selfBadge: 'YOU',
    unknownPlayer: 'Unknown Player',
    recentWr: 'Recent {count}G WR',
    winLoss: '{wins}W {losses}L',
    avgKda: 'Avg K / D / A',
    avgKp: 'Avg KP (K+A)',
    kdaRatio: 'KDA',
    oftenPlays: 'Picks:',
    noData: 'No data',
    topHorse: 'Top Horse',
    midHorse: 'Mid Horse',
    bottomHorse: 'Bottom Horse',

    // Footer
    backgroundActive: 'Background monitoring active',
    footerBrand: 'LOL Smart Assistant v1.0 · Non-intrusive',
  },
};
