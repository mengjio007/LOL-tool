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

export function translateLog(msg: string, lang: Language): string {
  if (lang === 'zh') return msg;

  // English translation rules for real-time logs
  // 1. Connection & Setup
  if (msg.includes('检测到英雄联盟客户端')) {
    const portMatch = msg.match(/端口:\s*(\d+)/);
    const port = portMatch ? portMatch[1] : '';
    return `Detected League of Legends client (Port: ${port}), establishing connection...`;
  }
  if (msg.includes('已成功订阅 LCU 事件总线')) {
    return 'Subscribed to LCU event bus. Automation engine ready!';
  }
  if (msg.includes('与客户端连接断开')) {
    return 'Disconnected from client, preparing to reconnect...';
  }
  if (msg.includes('欢迎召唤师:')) {
    return msg.replace('欢迎召唤师:', 'Welcome Summoner:');
  }
  if (msg.includes('游戏阶段状态转换 ➔')) {
    return msg.replace('游戏阶段状态转换 ➔', 'Gameflow Phase Transition ➔');
  }

  // 2. Smart Queue
  if (msg.includes('已退出组队房间，已停止自动排队')) {
    return '[Smart Queue] Exited lobby, auto-queue stopped.';
  }
  if (msg.includes('[智能排队] 检测到处于房间中')) {
    return '[Smart Queue] In lobby, checking readiness in 2s...';
  }
  if (msg.includes('房间已达目标人数') && msg.includes('全员就绪！立即发起排队')) {
    const match = msg.match(/\((\d+)\/(\d+)人\)/);
    const counts = match ? ` (${match[1]}/${match[2]})` : '';
    return `[Smart Queue] >>> Target reached${counts} & all ready! Starting matchmaking... <<<`;
  }
  if (msg.includes('房间全员就绪') && msg.includes('立即发起排队')) {
    const match = msg.match(/\((\d+)人\)/);
    const count = match ? ` (${match[1]} players)` : '';
    return `[Smart Queue] >>> Party ready${count}! Starting matchmaking... <<<`;
  }
  if (msg.includes('已成功进入排队队列！')) {
    return '[Smart Queue] >>> Successfully entered matchmaking queue! <<<';
  }
  if (msg.includes('目标人数') && msg.includes('等待队友进房')) {
    const match = msg.match(/目标人数\s*(\d+)\s*人，当前房间仅\s*(\d+)\s*人.*?\((\d+)\/45秒\)/);
    if (match) {
      return `[Smart Queue] Target ${match[1]} players, currently ${match[2]}, waiting for party... (${match[3]}/45s)`;
    }
    return '[Smart Queue] Waiting for party members to join...';
  }
  if (msg.includes('房间人数已达标') && msg.includes('正在等待全员就绪')) {
    const match = msg.match(/\((\d+)人\).*?\((\d+)\/45秒\)/);
    if (match) {
      return `[Smart Queue] Party full (${match[1]} players), waiting for ready/lane selection... (${match[2]}/45s)`;
    }
    return '[Smart Queue] Waiting for all party members to be ready...';
  }
  if (msg.includes('智能排队超时') || msg.includes('已取消本次自动排队')) {
    return '[Smart Queue Timeout] Waiting timed out (45s), auto-queue canceled.';
  }
  if (msg.includes('发起排队失败')) {
    return msg.replace('[智能排队] 发起排队失败', '[Smart Queue] Failed to start matchmaking');
  }

  // 3. Ready Check & Accept
  if (msg.includes('对局就绪] 自动接受已关闭')) {
    return '[Ready Check] Auto-accept is disabled. Please accept manually.';
  }
  if (msg.includes('发现匹配对局！将在') && msg.includes('自动接受')) {
    const delayMatch = msg.match(/将在\s*(\d+)\s*ms/);
    const delay = delayMatch ? delayMatch[1] : '800';
    return `[Ready Check] Match found! Auto-accepting in ${delay} ms...`;
  }
  if (msg.includes('已成功自动接受对局！')) {
    return '[Auto Accept] >>> Successfully accepted match! <<<';
  }
  if (msg.includes('[自动接受失败]')) {
    return msg.replace('[自动接受失败]', '[Auto Accept Failed]');
  }

  // 4. Analysis
  if (msg.includes('进入选人/对局阶段，正在自动评估玩家最近10场战绩')) {
    return '[Match Analysis] Analyzing recent 10-match histories of all players...';
  }
  if (msg.includes('玩家战绩与马匹评定已完成！')) {
    const teamMatch = msg.match(/蓝方:(\d+)人,\s*红方:(\d+)人/);
    if (teamMatch) {
      return `[Match Analysis] Horse ratings complete! (Allies: ${teamMatch[1]}, Enemies: ${teamMatch[2]})`;
    }
    return '[Match Analysis] Player stats and horse ratings completed!';
  }

  // 5. Post Game & Play Again
  if (msg.includes('游戏已结束，正在等待客户端加载战绩数据')) {
    return '[Post Game] Match ended, waiting for client stats...';
  }
  if (msg.includes('检测到荣誉点赞界面，正在自动跳过')) {
    return '[Post Game] Honor screen detected, skipping animation...';
  }
  if (msg.includes('已进入战绩结算界面，正在点击【再来一局】')) {
    return '[Post Game] In post-game lobby, clicking [Play Again] to return party...';
  }
  if (msg.includes('已成功点击【再来一局】，正在返回组队房间')) {
    return '[Post Game] >>> Clicked [Play Again] successfully, returning to lobby... <<<';
  }
  if (msg.includes('自动点击【再来一局】未响应')) {
    return '[Post Game] [Play Again] unresponsive, please click manually.';
  }

  // 6. Manual Actions
  if (msg.includes('[手动排队] 正在发起寻找对局')) {
    return '[Manual Queue] Starting matchmaking...';
  }
  if (msg.includes('[手动取消] 正在取消寻找对局')) {
    return '[Manual Queue] Canceling matchmaking...';
  }
  if (msg.includes('[手动接受] 正在点击接受对局')) {
    return '[Manual Accept] Accepting match...';
  }
  if (msg.includes('[手动发言] 正在发送战报到房间聊天:')) {
    return msg.replace('[手动发言] 正在发送战报到房间聊天:', '[Manual Chat] Sending report to chat:');
  }

  return msg;
}

