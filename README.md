# LOL-tool (英雄联盟智能助手 v1.0.4)

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.0.4-gold?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Language-Go%201.25%20%7C%20React%2019-blue?style=for-the-badge" alt="Tech Stack">
  <img src="https://img.shields.io/badge/GUI-Wails%20v2-emerald?style=for-the-badge" alt="Wails">
  <img src="https://img.shields.io/badge/Package%20Size-~4.0MB%20(UPX)-purple?style=for-the-badge" alt="Size">
  <img src="https://img.shields.io/badge/Anti--Ban-100%25%20Zero--Injection-brightgreen?style=for-the-badge" alt="Anti-Ban">
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="License">
</p>

<p align="center">
  <b>极简 · 丝滑 · 绿色 · 专为海克斯大乱斗与排位量身定制的桌面级智能伴侣</b>
</p>

<p align="center">
  <b>🌐 语言切换 / Language:</b> <a href="README_EN.md"><b>English Documentation</b></a> | <a href="README.md"><b>中文说明文档</b></a>
</p>

---

## 📖 项目简介

**LOL-tool** 是一款基于 **Wails v2 (Go 1.25) + React 19 + TypeScript + Tailwind CSS** 构建的高性能、高颜值的英雄联盟桌面智能辅助工具。

### 核心设计原则
1. **零内存注入（100% 安全防封）**：纯基于 Riot 官方 LCU (League Client Update) REST API 与 WebSocket 全双工事件总线，绝不注入游戏本体进程，不修改任何内存，完全兼容 Vanguard 拳头反作弊机制。
2. **极小体积与极致性能**：整包经 UPX 深度极限压缩后仅 **~4.01 MB**，单文件独立运行，无需安装繁杂运行库，常驻内存仅约 **30 MB**，CPU 占用率低于 0.2%。
3. **静默贴心，拒绝打扰**：全自动化链路默默守护（秒接、智能排队、赛后带回），对局战报**绝不自动滥发骚扰聊天框**，由召唤师自主决定是否发送。
4. **全球化中英双语**：顶部自带一键中英文切换按钮，全界面即时响应，记忆用户偏好。

---

## 📸 运行效果截图 (Screenshots)

<div align="center">
  <table border="0">
    <tr>
      <td align="center" width="50%">
        <b>⚡ 自动化控制与实时双语运行日志</b><br/><br/>
        <img src="docs/images/preview-automation.png" alt="Automation Preview" width="380" />
      </td>
      <td align="center" width="50%">
        <b>🐎 对局马匹雷达与海克斯战绩诊断</b><br/><br/>
        <img src="docs/images/preview-horse-radar.png" alt="Horse Radar Preview" width="380" />
      </td>
    </tr>
  </table>
</div>

---

## ✨ 核心功能全览

### 1. ⚡ 核心自动化控制 (Core Automation)
- **自动接受对局 (ReadyCheck)**：
  - 毫秒级监听 LCU 匹配状态，对局就绪即刻触发接受。
  - **拟人化防封延迟调节**：支持 0ms (秒点抢路)、800ms (推荐人类反射延迟)、1800ms (稳妥拟人延迟) 自定义拖动。
- **智能房间排队 (Smart Queue)**：
  - 智能感知房间人数与准备状态，独家支持**目标组队人数限定（不限 / 单排1人 / 双排2人 / 三排3人 / 四排4人 / 五黑5人）**。
  - 只有当房间达到设定人数且全员就绪时才会自动点排队，**彻底杜绝“队友上厕所/刚进房就被误开”的尴尬**。
- **自动跳过荣誉点赞 & 再来一局 (Auto Play Again)**：
  - 结算界面自动跳过漫长的荣誉点赞与结算过渡动画。
  - 自动调用 `/lol-lobby/v2/play-again`，**直接将全车队开黑好友一同带回组队房间**，无需房主手动一遍遍拉人。

---

### 2. 🐎 6档全阶战力先知与海克斯复合赛马算法 (Match 6-Tier Radar)

助手在进入【英雄选择 (ChampSelect)】或【对局进行中 (InProgress)】时，通过高并发协程瞬间对全场 10 名玩家最近 10~20 场战绩进行深度穿透诊断，输出直观的 **6档战力金字塔评级** 与战术情报标签。

#### 🏆 6 档战力金字塔结构详解

| 档位级别 | 战力区间 | 复合全称徽章 | 核心画像与实战表现 |
| :---: | :---: | :--- | :--- |
| **S+ 级** | $\ge 140$ 分 | **👑 S+ 特等 · 降维通天代** | **全场真神**：输出占比超 30%+、五杀收割、胜率 65%+ 且手感正热，死保稳赢！ |
| **S 级** | $120 \sim 139$ | **⚔️ S 上等 · 全场掌舵者** | **团队大腿**：伤害占比 26%+，或号角承伤 35%+ 钢铁真前排，发挥极其可靠。 |
| **A 级** | $100 \sim 119$ | **🛡️ A 中等 · 中流砥柱** | **稳健基石**：数据贴近 20% 均线，正常人水平，不送头、听指挥。 |
| **B 级** | $85 \sim 99$ | **⚠️ B 次等 · 状态摇摆者** | **轻微负重**：输出占比偏低（13%~16%），需要其他队友兜底。 |
| **C 级** | $70 \sim 84$ | **🚨 C 下等 · 红温突破口** | **明显突破口**：死得多、输出极低，敌方首选秒杀目标 / 我方重点看护对象。 |
| **D 级** | $< 70$ 分 | **🐮 D 劣等 · 下水道纯牛马** | **移动炸弹**：当天大连败破防红温中、局局死 10+ 次、负气送头。战报特别预警！ |

#### 🧠 5 大支柱综合评估算法引擎

针对海克斯大乱斗伤害虚高、开局乱憋装备、连败红温等顽疾，算法研发了 5 大独立支柱评估模型：

1. **团队战术占比 (40%) —— 拒绝绝对数值虚高**：
   - 彻底打破传统工具只看“绝对伤害量”的误区；
   - 计算该玩家在队伍中的**真实伤害占比 (Damage Share %)**、**承伤占比 (Damage Taken Share %)** 与 **治疗贡献率 (Heal Share %)**，以队伍均线 20% 为准绳精准衡量其实战贡献。
2. **装备与时长认知 (15%) —— 动态守护者出装判定**：
   - 监控【守护者系列】（号角2051、战刃3177、战锤3184、宝珠3112）的出装偏好；
   - 结合**对局时长（Game Duration）**智能判定：在 $<16$ 分钟局考核号角抢线能力，在 $\ge 20$ 分钟大后期卖掉守护者换 6 神装不扣分！
3. **心态与即时状态 (20%) —— 连败红温破防一票否决权**：
   - 当天近几小时连败 $\ge 4$ 场且阵亡激增的玩家，直接判定为 `⚠️ 当天连败红温`，**强制剥夺 S/A 级资格**，降至下水道预警；
   - 当天连胜 3+ 场点亮 `🔥 手感滚烫` 状态光环。
4. **高光爆发与终结贡献 (15%) —— 五杀/四杀与拆塔分奴**：
   - 统计近 20 场中的【五杀 (PentaKill)】、【四杀 (QuadraKill)】残局收割能力；
   - 引入【对防御塔伤害 (Turret Damage)】，识别真想赢、真点塔的团队分奴功臣。
5. **极端胜率激活与段位基石 (10%) —— 小样本防误判**：
   - 45%~60% 区间视为常规随机波动，平滑中立；
   - 唯有 $\ge 70\%$ 或 $\le 35\%$ 极端战绩才大幅拉高或拉低权重，配合单排峡谷段位提供保底压制力。

---

### 3. 💬 智能战报信息组合与受控发送 (Horse Report Console)

**坚决反对未经用户允许自动向公共聊天频道乱发弹幕！**

助手提供精致的【战报信息组合】模块，将全场关键信息凝练为一条条理分明的战术情报：
- ⚠️ **我方注意防崩**：提示胜率低迷的队友，建议打法多加稳健。
- 🚨 **敌方通天代**：醒目标注对面高胜率或高分段的大爹选手，提醒集火防针对。
- 🎯 **敌方突破口**：标记对面状态极差、无效阵亡多的选手，作为开团突破首选。
- 💪 **我方核心大腿**：标示我方的稳定大腿，跟紧节奏。

#### 两种极速发送方式：
1. **选人 BP 界面直发**：点击【选人时发给队友】，助手将直接调用客户端接口，秒发到选人房间聊天框。
2. **游戏对局内一键复制**：进入峡谷/极地后，点击【局内发给队友】，战报将存入剪贴板；在游戏内按下 `Enter` ➔ `Ctrl+V` ➔ `Enter`，0.5秒即可将战术情报同步给全队！

---

### 4. 🌐 顶部中英双语即时切换 (Bilingual UI)
- 顶部标题栏配有精致的 `🌐 EN` / `🌐 中文` 切换按钮。
- 全界面（状态显示、自动化控制、日志记录、马匹评定、战报提示）无缝即时热切换。
- 本地存储记忆语言选择，重启软件保持一致。

---

### 5. 🛡️ 进程级防闪退架构 (Zero-Crash Architecture)
- **底层内存保护**：修正 Win32 PEB 动态缓冲区溢出与索引越界。
- **全协程 Recover 兜底**：Go 后端所有并发分支全部装备 `defer recover()` 异常拦截，杜绝未捕获 panic 导致的进程退出。
- **前端防御性渲染**：所有数值计算配备 `nullish coalescing` 与类型守卫，杜绝前端白屏。

---

### 6. 🚀 智能多源版本检测与国内无阻平滑更新 (Smart & Dual-Channel Update)
- **国内双渠道智能互备 (GitCode + GitHub)**：应用启动时后台静默检测，同时接入 **GitCode 国内镜像源** 与 **GitHub 官方源**，智能规避 GitHub 在国内的 DNS 污染与 60次/小时 API 频控限制。
- **国内 CDN 自动故障转移**：应用内点击【立即在线更新】时，底层自动配置国内高速加速节点与 Windows PE 二进制完整性校验，国内直连用户无需梯子或 VPN 即可享受秒级极速下载。
- **绝对非强制，使用零打扰**：检测到新版本时仅优雅浮现弹窗与呼吸提示灯，绝不强制阻塞用户正常使用，支持随时查看更新说明。

---

### 7. 🔍 召唤师战力独立穿透单查与设置中心 (Player Lookup & Settings Center)
- **战力单人穿透查询**：输入任意玩家昵称、Riot ID（如 `游戏名#001`）或点击“查我自己”，一秒计算其在 6 档战力金字塔下的定位与 5 大支柱数据。
- **全新聚合设置中心**：将软件更新、算法原理解读、版本日志与开发者联系方式收纳进【设置与关于】面板，顶部主导航聚焦对局核心功能。
- **开发者直连反馈**：内置一键复制官方联系邮箱（`mengjio007@gmail.com`）与 GitHub 仓库地址，方便随时交流建议与 Issue 提报。


---

## 🚀 快速使用指南

### 方式一：直接运行成品 (推荐)
- **国内直连用户 (推荐)**：[**前往 GitCode 发行版下载**](https://gitcode.com/mengjio007/lol-tool/releases)（电信/联通/移动满速，无需代理）。
- **海外或 GitHub 用户**：[**前往 GitHub Releases 官方下载**](https://github.com/mengjio007/LOL-tool/releases/latest)。
1. 下载最新版的可执行文件 `lol-helper-v1.0.4.exe`（单文件仅 ~3.89 MB，免安装解压即用）。
2. 打开英雄联盟客户端（先后启动顺序无所谓，助手会自动侦测连接）。
3. 双击运行 `lol-helper-v1.0.4.exe` 即可享受全自动静默守护。

---

### 方式二：从源码编译打包

#### 环境要求：
- [Go](https://go.dev/) 1.22+ 或 1.25+
- [Node.js](https://nodejs.org/) 18+ (包含 npm)
- [Wails CLI v2](https://wails.io/): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- [UPX](https://upx.github.io/) (可选，用于最终体积极限压缩)

#### 编译步骤：
```powershell
# 1. 克隆本仓库
git clone git@github.com:mengjio007/LOL-tool.git
cd LOL-tool

# 2. 安装前端依赖
cd frontend
npm install
cd ..

# 3. 运行自动化编译与压缩脚本
powershell -ExecutionPolicy Bypass -File .\build.ps1
```
编译完成后，根目录即可得到体积仅 **~4.0 MB** 的 `lol-helper-v1.0.exe`。

---

## 🛠️ 技术栈详情

| 层次 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **桌面框架** | [Wails v2](https://wails.io/) | Go + Webview2 原生高性能桥接，彻底告别 Electron 的庞大体积 |
| **核心后端** | [Go 1.25](https://go.dev/) | 极致性能、轻量并发、底层 Win32 内存嗅探、安全 WebSocket |
| **现代前端** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | 强类型现代化组件架构，极致丝滑 |
| **构建打包** | [Vite 8](https://vitejs.dev/) | 秒级热重载与生产打包 |
| **UI 样式库** | [Tailwind CSS v4](https://tailwindcss.com/) | 英雄联盟海克斯科技深色极简风格 |
| **图标库** | [Lucide React](https://lucide.dev/) | 现代高清矢量图标 |
| **二进制压缩** | [UPX 5.2.1](https://upx.github.io/) | 极限无损 PE 体积压缩 (11.5MB -> 4.0MB) |

---

## ⚖️ 免责声明 (Disclaimer)

1. 本项目是一个基于开源技术的辅助工具，旨在提升英雄联盟玩家的组队便利与选人决策参考。
2. 本工具仅使用 Riot Games 官方提供的客户端公开接口（LCU API），**不包含任何内存注入、反汇编篡改、自动走位脚本或破坏竞技公平性的功能**。
3. 请合理使用本工具，文明交流，共同维护良好的竞技游戏环境。
4. League of Legends 是 Riot Games, Inc. 的注册商标。本项目与 Riot Games 无任何官方关联。

---

## 📄 开源许可证

本项目遵循 [MIT License](LICENSE) 开源协议。
