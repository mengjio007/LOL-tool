export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // Header
    appTitle: 'LOL 智能助手',
    version: 'v2.0.0',
    alwaysOnTop: '窗口置顶',
    unpin: '取消置顶',
    minimize: '最小化',
    maximize: '最大化',
    restore: '向下还原',
    close: '关闭 (退出程序)',
    langToggle: 'EN',
    langToggleTitle: 'Switch to English',

    // Tabs
    tabAutomation: '自动化控制',
    tabAnalysis: '对局马匹分析',
    tabSearch: '战力单查',
    tabAlgorithm: '算法原理解读',
    viewAlgorithmHelp: '点击查看 6 档战力与 5 大支柱算法解读',

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

    // 6-Tier System
    tierSPlus: 'S+ 特等 · 降维通天代',
    tierS: 'S 上等 · 全场掌舵者',
    tierA: 'A 中等 · 中流砥柱',
    tierB: 'B 次等 · 状态摇摆者',
    tierC: 'C 下等 · 红温突破口',
    tierD: 'D 劣等 · 下水道纯牛马',

    // Stats
    statDamage: '输出',
    statTank: '承伤',
    statHeal: '治疗',
    statGuardian: '守护者出装',
    statScore: '综合战力分',

    // Footer
    backgroundActive: '后台静默监控已启用',
    footerBrand: 'LOL 智能助手 v2.0.0 · 极简轻量·静默守护',

    // Updates
    checkUpdate: '检查更新',
    checkingUpdate: '正在检查最新版本...',
    alreadyLatest: '当前已是最新版本 ({version})',
    checkUpdateFailed: '检查更新失败，请稍后重试',
    newVersionFound: '发现新版本 {version}',
    currentVersionLabel: '当前版本: {version}',
    releaseNotes: '更新说明:',
    noReleaseNotes: '暂无详细更新说明',
    updateNow: '立即在线更新',
    updateDownloading: '正在下载更新 ({percent}%)...',
    updateSuccessRestarting: '下载完成，正在重启应用...',
    updateFailedFallback: '自动更新异常，已为您打开下载页面（GitHub / GitCode）',
    openInBrowser: 'GitHub 下载',
    openGitCode: 'GitCode 国内下载',
    remindLater: '稍后提醒',
    hasNewVersionDot: '发现新版本！点击查看',

    // Algorithm Guide Page
    algoTitle: '6档战力金字塔与5大支柱算法解读',
    algoSubtitle: '突破传统只看 KDA 与刷伤害的弊端，采用队伍均线占比、连败破防一票否决、动态守护者出装、高光终结与防误判机制，全方位还原真实战力。',
    algoPhilosophyTitle: '为什么需要这套算法？',
    algoPain1Title: '拒绝 KDA 虚假分奴',
    algoPain1Desc: '传统工具只看杀人/死亡比，无法识别人头狗与死蹲后排卖队友保 KDA 的毒瘤玩家。',
    algoPain2Title: '拒绝 Poke 虚高伤害',
    algoPain2Desc: '兰德里/面具类英雄无效消耗伤害虚高；而号角肉坦真前排往往无数据显示，本算法重点扶持。',
    algoPain3Title: '拒绝小样本胜率误导',
    algoPain3Desc: '打 2 局胜率 100% 并不代表通天代；45%~60% 属于常规波动，仅极端胜率与段位才介入压制。',

    algoTiersTitle: '6 档战力金字塔画像',
    algoTiersDesc: '根据 5 大支柱综合加权得分（满分约 180+），精准映射为 6 档直观战术评级：',
    tierSPlusBadge: '👑 S+ 特等 · 降维通天代',
    tierSPlusDesc: '全场真神：输出占比超 30%+、五杀收割、胜率 65%+ 且手感正热。实战建议：死保大腿，跟紧节奏！',
    tierSBadge: '⚔️ S 上等 · 全场掌舵者',
    tierSDesc: '团队大腿：伤害占比 26%+，或号角承伤 35%+ 钢铁真前排。实战建议：发挥极其可靠，重点配合。',
    tierABadge: '🛡️ A 中等 · 中流砥柱',
    tierADesc: '稳健基石：数据贴近 20% 均线，听指挥、不送头。实战建议：正常人水准，稳扎稳打。',
    tierBBadge: '⚠️ B 次等 · 状态摇摆者',
    tierBDesc: '轻微负重：输出占比偏低（13%~16%），极需队友兜底。实战建议：抗压较弱，需多关照。',
    tierCBadge: '🚨 C 下等 · 红温突破口',
    tierCDesc: '明显突破口：死得多、输出极低、极易脱节。实战建议：敌方首选秒杀目标 / 我方重点看护。',
    tierDBadge: '🐮 D 劣等 · 下水道纯牛马',
    tierDDesc: '移动炸弹：当天大连败破防红温中、局局死 10+ 次、负气送头。战报特别预警！',

    algoPillarsTitle: '5 大独立支柱评估模型拆解',
    algoPillarsDesc: '各模块各司其职，采用动态归一化算法，杜绝单一数据偏科导致的评价失真：',

    pillar1Title: '支柱 1: 团队战术占比 (40% 权重)',
    pillar1Subtitle: '以 5 人队伍均线 20% 为基准，拒绝绝对数值虚高',
    pillar1Desc: '计算该玩家在队伍中的真实伤害占比 (Damage Share %)、承伤占比 (Damage Taken Share %) 与治疗贡献率。输出占比超 25% 显著加分，低于 14% 扣分；号角硬汉承伤超 30% 享受专属大腿加分；软辅治疗亦纳入考核。',

    pillar2Title: '支柱 2: 装备与时长认知 (15% 权重)',
    pillar2Subtitle: '动态守护者出装判定，大后期卖号角绝不扣分',
    pillar2Desc: '监控大乱斗核心【守护者系列】（号角2051、战刃3177、战锤3184、宝珠3112）。结合对局时长（Game Duration）智能判定：前中期（<16分钟）严格考核号角抢线；20分钟以上大后期卖守护者换 6 神装绝不扣分！',

    pillar3Title: '支柱 3: 心态与即时状态 (20% 权重)',
    pillar3Subtitle: '连败红温破防一票否决权，手感滚烫光环',
    pillar3Desc: '实时监测当天近几小时对局战绩。当天连败 ≥ 4 场且场均阵亡剧增者，直接触发【⚠️ 当天连败红温】破防一票否决，强制剥夺 S/A 级评定资格，直落警告！反之，当天连胜 3+ 场点亮【🔥 手感滚烫】状态光环。',

    pillar4Title: '支柱 4: 高光爆发与终结贡献 (15% 权重)',
    pillar4Subtitle: '五杀/四杀残局收割与拆塔分奴',
    pillar4Desc: '统计近 20 场历史战绩中的【五杀 (PentaKill)】、【四杀 (QuadraKill)】残局收割表现；同时引入【对防御塔伤害 (Turret Damage)】，奖励真想赢、真点塔的推塔功臣，惩罚只浪不点塔的毒瘤。',

    pillar5Title: '支柱 5: 极端胜率激活与段位基石 (10% 权重)',
    pillar5Subtitle: '小样本防误判，极端胜率压制',
    pillar5Desc: '45%~60% 区间视为常规匹配随机波动，平滑中立；只有当胜率 ≥ 70% 或 ≤ 35% 时才激活大幅加权，配合单双排/灵活组排真实段位提供保底压制力。',

    algoReportTitle: '战报智能提炼与受控发送原则',
    algoReportDesc: '助手坚决反对未经允许在公共聊天区乱发弹幕。战报智能精炼为 2~3 条高价值战术提醒（敌方通天代集火防针对、敌方突破口开团首选、我方大腿跟节奏），支持选人房间秒发或局内一键复制。',

    algoSafetyTitle: '100% 绿色安全合规承诺',
    algoSafetyDesc: '纯基于拳头官方 LCU (League Client Update) REST API 与 WebSocket 全双工事件总线，绝不注入游戏本体进程，不修改任何内存，完全兼容 Vanguard 拳头反作弊机制。',

    // Player Search View
    searchTabTitle: '召唤师战力独立侦测',
    searchTabDesc: '基于 5 大支柱与 6 档战力模型，单人穿透查询近 10~20 场实战数据与马匹评级。',
    searchPlaceholder: '输入召唤师昵称 / Riot ID (如 Uzi#001) / 留空查自己...',
    searchBtn: '查询战力',
    searchSelfBtn: '查我自己',
    searching: '正在穿透战绩并深度计算...',
    searchRecent: '最近查询:',
    clientRequiredWarning: '⚠️ 需英雄联盟客户端在线（待机即可，无需在对局中）。国服没有公开免登录数据接口，必须通过本地客户端与服务器的官方通道安全获取数据。',
    searchEmptyHint: '请输入召唤师名称，或点击“查我自己”快速查看当前登录账号战力评级。',
    searchFailed: '查询失败',
    searchNoGames: '未能拉取到该玩家近期的有效对局记录',
    searchHistoryEmpty: '暂无历史查询',
    searchScoreDetail: '5 大支柱综合评估画像',
    statGamesDetail: '{games} 场 · {wins}胜 {losses}负',
    statWinrateRate: '胜率 {rate}%',

    // Settings & About Modal
    settingsModalTitle: '设置与关于',
    settingsTabUpdates: '软件更新',
    settingsTabAlgorithm: '算法体系',
    settingsTabChangelog: '版本历程',
    settingsTabContact: '联系与反馈',
    contactTitle: '开发者联系方式',
    contactDesc: '如果您在使用过程中遇到任何问题，或对大乱斗马匹算法、自动化功能有任何改进建议，欢迎随时与我联系！',
    contactEmail: '谷歌邮箱 (Gmail)',
    contactEmailDesc: 'mengjio007@gmail.com',
    contactGithub: 'GitHub 官方开源仓库',
    contactGithubDesc: 'https://github.com/mengjio007/LOL-tool',
    contactGitcode: 'GitCode 国内发行版镜像',
    contactGitcodeDesc: 'https://gitcode.com/mengjio007/lol-tool',
    copyEmailBtn: '复制邮箱',
    sendEmailBtn: '发送邮件',
    openLinkBtn: '浏览器打开',
    copyLinkBtn: '复制链接',
    aboutAppDesc: 'LOL 智能助手是一款基于 Wails v2 + React 19 构建的超轻量级英雄联盟桌面工具，零内存注入，不修改任何游戏文件，100% 绿色安全。',
  },
  en: {
    // Header
    appTitle: 'LOL Smart Assistant',
    version: 'v2.0.0',
    alwaysOnTop: 'Always on Top',
    unpin: 'Unpin',
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close (Quit App)',
    langToggle: '中文',
    langToggleTitle: '切换为中文',

    // Tabs
    tabAutomation: 'Automation',
    tabAnalysis: 'Horse Radar',
    tabSearch: 'Player Lookup',
    tabAlgorithm: 'Algorithm Guide',
    viewAlgorithmHelp: 'Click to view 6-Tier and 5-Pillar Algorithm Guide',

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

    // 6-Tier System
    tierSPlus: 'S+ Grand · Transcendent Carry',
    tierS: 'S Core · Team Helmsman',
    tierA: 'A Solid · Team Anchor',
    tierB: 'B Wavering · Rollercoaster',
    tierC: 'C Vulnerable · Tilt Point',
    tierD: 'D Disaster · Bottom Feeder',

    // Stats
    statDamage: 'Damage',
    statTank: 'Tank',
    statHeal: 'Heal',
    statGuardian: 'Guardian Build',
    statScore: 'Combat Rating',

    // Footer
    backgroundActive: 'Background monitoring active',
    footerBrand: 'LOL Smart Assistant v2.0.0 · Lightweight & Non-intrusive',

    // Updates
    checkUpdate: 'Check for Updates',
    checkingUpdate: 'Checking for updates...',
    alreadyLatest: 'You are on the latest version ({version})',
    checkUpdateFailed: 'Failed to check for updates, please try again later',
    newVersionFound: 'New Version Available: {version}',
    currentVersionLabel: 'Current Version: {version}',
    releaseNotes: 'Changelog:',
    noReleaseNotes: 'No detailed release notes provided',
    updateNow: 'Update Now',
    updateDownloading: 'Downloading update ({percent}%)...',
    updateSuccessRestarting: 'Download complete, restarting app...',
    updateFailedFallback: 'Auto-update failed, opening release download pages...',
    openInBrowser: 'GitHub Download',
    openGitCode: 'GitCode Mirror',
    remindLater: 'Remind Me Later',
    hasNewVersionDot: 'New version available! Click to view',

    // Algorithm Guide Page
    algoTitle: '6-Tier Radar & 5-Pillar Algorithm Guide',
    algoSubtitle: 'Eliminating the pitfalls of raw KDA and inflated poke damage through team tactical share, loss-streak tilt override, dynamic Guardian item recognition, highlight finishing, and extreme-winrate safeguards.',
    algoPhilosophyTitle: 'Why This Algorithm?',
    algoPain1Title: 'Say No to Fake KDA Baiters',
    algoPain1Desc: 'Traditional tools only check KDA ratios, failing to recognize baiters who hide behind allies just to protect their stats.',
    algoPain2Title: 'Say No to Inflated Poke Damage',
    algoPain2Desc: 'Liandry / poke mages pad pointless tick damage, while Guardian Horn frontlines get zero recognition despite being the real heroes.',
    algoPain3Title: 'Say No to Small Sample Bias',
    algoPain3Desc: 'A 2-game 100% winrate does not equal a smurf; 45%~60% is normal variance, while extreme winrates and ranked tiers provide genuine suppression.',

    algoTiersTitle: 'The 6-Tier Battle Power Hierarchy',
    algoTiersDesc: 'Calculated via 5 weighted pillar scores (max ~180+), accurately mapped into 6 intuitive tactical tiers:',
    tierSPlusBadge: '👑 S+ Tier · Smurf Carry',
    tierSPlusDesc: 'Godlike: 30%+ damage share, pentakill finisher, 65%+ win rate, hot streak. Tip: Play around them for an easy win!',
    tierSBadge: '⚔️ S Tier · Pillar Carry',
    tierSDesc: 'Team Anchor: 26%+ damage share or 35%+ Horn frontline tank damage taken. Tip: Highly reliable, play with them.',
    tierABadge: '🛡️ A Tier · Steady Backbone',
    tierADesc: 'Solid Foundation: Close to 20% team average, follows calls, avoids feeding. Tip: Normal solid player.',
    tierBBadge: '⚠️ B Tier · Shaky Performer',
    tierBDesc: 'Slight Burden: Lower damage share (13%~16%), needs strong teammates to carry. Tip: Fragile under pressure.',
    tierCBadge: '🚨 C Tier · Major Liability',
    tierCDesc: 'Obvious Gap: High deaths, very low impact, out of position. Tip: Primary target for enemies / focus of protection.',
    tierDBadge: '🐮 D Tier · Absolute Bot',
    tierDDesc: 'Ticking Bomb: On a severe tilt loss streak, dying 10+ times per game, griefing. Special tactical warning in report!',

    algoPillarsTitle: '5-Pillar Composite Engine Breakdown',
    algoPillarsDesc: 'Each module serves an independent function with dynamic normalization, preventing single-stat skewing:',

    pillar1Title: 'Pillar 1: Team Tactical Share (40% Weight)',
    pillar1Subtitle: '20% team baseline, eliminating raw stat inflation',
    pillar1Desc: 'Evaluates Damage Share %, Damage Taken Share %, and Heal Share % against the 20% 5-player average. 25%+ damage grants huge bonus; frontline tanks taking 30%+ damage with Horn receive dedicated carry bonus; support heals also rewarded.',

    pillar2Title: 'Pillar 2: Itemization & Duration Intelligence (15% Weight)',
    pillar2Subtitle: 'Dynamic Guardian recognition, selling items in late game is never penalized',
    pillar2Desc: 'Monitors ARAM Guardian items (Horn 2051, Blade 3177, Hammer 3184, Orb 3112). Intelligently checks game duration: early/mid game (<16m) strictly checks Horn rush; late game (20m+) selling Guardian items for 6 full items incurs zero penalty!',

    pillar3Title: 'Pillar 3: Mental State & Tilt Index (20% Weight)',
    pillar3Subtitle: 'Tilt loss-streak veto override, hot hand aura',
    pillar3Desc: 'Tracks today\'s recent hours of match history. Players on 4+ loss streaks with surging deaths trigger the Tilt Override, instantly stripping S/A tier eligibility and dropping them to D warning! Conversely, 3+ win streaks grant the Hot Hand aura.',

    pillar4Title: 'Pillar 4: Highlights & Finishing Impact (15% Weight)',
    pillar4Subtitle: 'Penta/Quadra clutch finishes & objective tower pushers',
    pillar4Desc: 'Counts PentaKill, QuadraKill, and TripleKill clutch finishes across the last 20 games; incorporates Turret Damage to reward objective-focused winners and penalize careless show-offs.',

    pillar5Title: 'Pillar 5: Extreme Win Rate Activation & Ranked Baseline (10% Weight)',
    pillar5Subtitle: 'Small sample safeguard, extreme winrate suppression',
    pillar5Desc: 'The 45%~60% range is treated as normal matchmaking variance (neutral); only extreme win rates (≥ 70% or ≤ 35%) activate heavy adjustments, backed by Solo/Flex ranked tier baseline.',

    algoReportTitle: 'Smart Tactical Report & Non-Spam Policy',
    algoReportDesc: 'Strictly zero automated in-game spam. The assistant condenses 10-player stats into 2~3 high-value bullet points (enemy carries to focus, enemy gaps to engage, allied carries to support), ready for 1-click champion select send or in-game paste.',

    algoSafetyTitle: '100% Anti-Ban & Vanguard Safe Commitment',
    algoSafetyDesc: '100% Zero-Memory-Injection. Operates entirely through Riot\'s official LCU REST API and WebSocket events. Fully compliant with Riot Developer Policies and Vanguard safe.',

    // Player Search View
    searchTabTitle: 'Summoner Combat Rating Lookup',
    searchTabDesc: 'Individual 10~20 game penetration analysis and 6-tier combat rating powered by the 5-pillar engine.',
    searchPlaceholder: 'Enter summoner name / Riot ID (e.g. Uzi#001) or leave empty for self...',
    searchBtn: 'Search',
    searchSelfBtn: 'Check Myself',
    searching: 'Penetrating match history and calculating...',
    searchRecent: 'Recent:',
    clientRequiredWarning: '⚠️ Note: Requires the League of Legends client running (lobby/idle is fine, no need to be in a match). Match histories must be securely fetched through the official local client bridge.',
    searchEmptyHint: 'Enter a summoner name or click "Check Myself" to analyze your current account.',
    searchFailed: 'Search failed',
    searchNoGames: 'No recent valid match records found for this player',
    searchHistoryEmpty: 'No search history',
    searchScoreDetail: '5-Pillar Tactical Evaluation Breakdown',
    statGamesDetail: '{games} games · {wins}W {losses}L',
    statWinrateRate: 'Win Rate {rate}%',

    // Settings & About Modal
    settingsModalTitle: 'Settings & About',
    settingsTabUpdates: 'Updates',
    settingsTabAlgorithm: 'Algorithm',
    settingsTabChangelog: 'Changelog',
    settingsTabContact: 'Contact & About',
    contactTitle: 'Developer Contact',
    contactDesc: 'If you encounter any issues or have suggestions for the Hextech ARAM rating algorithm or automation features, feel free to reach out!',
    contactEmail: 'Google Mail (Gmail)',
    contactEmailDesc: 'mengjio007@gmail.com',
    contactGithub: 'GitHub Official Repository',
    contactGithubDesc: 'https://github.com/mengjio007/LOL-tool',
    contactGitcode: 'GitCode Domestic Mirror',
    contactGitcodeDesc: 'https://gitcode.com/mengjio007/lol-tool',
    copyEmailBtn: 'Copy Email',
    sendEmailBtn: 'Send Email',
    openLinkBtn: 'Open in Browser',
    copyLinkBtn: 'Copy URL',
    aboutAppDesc: 'LOL Smart Assistant is an ultra-lightweight League of Legends desktop companion built on Wails v2 + React 19. 100% Zero-Memory-Injection and Vanguard safe.',
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

