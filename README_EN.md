# LOL-tool (LOL Smart Assistant v1.0)

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.0-gold?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Language-Go%201.25%20%7C%20React%2019-blue?style=for-the-badge" alt="Tech Stack">
  <img src="https://img.shields.io/badge/GUI-Wails%20v2-emerald?style=for-the-badge" alt="Wails">
  <img src="https://img.shields.io/badge/Package%20Size-~4.0MB%20(UPX)-purple?style=for-the-badge" alt="Size">
  <img src="https://img.shields.io/badge/Anti--Ban-100%25%20Zero--Injection-brightgreen?style=for-the-badge" alt="Anti-Ban">
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="License">
</p>

<p align="center">
  <b>Clean · Smooth · Safe · Tailored for Hextech ARAM & Ranked Matchmaking</b>
</p>

<p align="center">
  <b>🌐 Language Switcher:</b> <a href="README_EN.md"><b>English Documentation</b></a> | <a href="README.md"><b>中文说明文档</b></a>
</p>

---

## 📖 Introduction

**LOL-tool** is a high-performance, lightweight, and modern desktop companion designed for League of Legends, built with **Wails v2 (Go 1.25) + React 19 + TypeScript + Tailwind CSS**.

### Core Philosophy
1. **100% Zero-Memory-Injection (Anti-Ban & Vanguard Safe)**: Interacts solely through Riot's official LCU (League Client Update) REST API and WebSocket full-duplex event bus. It never injects code into or alters the memory of the game executable (`League of Legends.exe`), making it completely compliant with Riot Developer Policies and Vanguard safe.
2. **Tiny Footprint & Ultra Performance**: Compressed using UPX down to just **~4.01 MB**. Operates as a single portable binary with zero external dependencies. Consumes merely **~30 MB RAM** and under 0.2% CPU in the background.
3. **Quiet & Non-Intrusive**: Runs silently in the background. It **never automatically spams in-game chat**; all match tactical reports are sent strictly under your explicit manual control.
4. **Instant Bilingual Support**: Features a built-in one-click English/Chinese toggle button in the top header, with persistent memory of your language preference.

---

## ✨ Features

### 1. ⚡ Core Automation
- **Auto Accept Ready Check**:
  - Millisecond-level WebSocket event detection triggers match acceptance the instant a match is found.
  - **Humanized Anti-Ban Delay Slider**: Configurable from 0ms (Instant lock), 800ms (Recommended human reflex), to 1800ms (Safe casual delay).
- **Smart Lobby Matchmaking (Smart Queue)**:
  - Intelligently senses party size and member readiness.
  - **Custom Target Party Size Filter**: Choose between `Any / Solo (1) / Duo (2) / Trio (3) / Quad (4) / Full Team (5)`.
  - Automatically starts matchmaking *only* when the target headcount is met and all players are ready, eliminating accidental early queues while friends are AFK or choosing lanes!
- **Auto Skip Honor & Play Again**:
  - Automatically skips lengthy post-game honor ceremonies and progression celebration animations.
  - Calls `/lol-lobby/v2/play-again` to return the entire party back into the lobby together without requiring the host to recreate the room or re-invite friends.

---

### 2. 🐎 Match Horse Radar & Hextech ARAM Horse Rating Algorithm

Upon entering **Champ Select** or an **Active Match (InProgress)**, the tool analyzes recent match records of all 10 players concurrently via high-speed Go routines, labeling `[YOU]`, `[Allies]`, and `[Enemies]` with comprehensive horse ratings and tactical tags.

#### 🧠 Horse Rating ("Top / Mid / Bottom Horse") Algorithm Breakdown

Traditional stat tools label players as "feeders" or "carries" simply based on KDA or short-term win rates. In high-intensity modes like **ARAM** and **Hextech ARAM**, this is often misleading. LOL-tool utilizes a specialized **multi-dimensional, big-sample weighted algorithm**:

```
                    ┌───────────────────────────────┐
                    │ Retrieve Recent 20-Game Sample│
                    └──────────────┬────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│ Big Sample & Rank Verification  │         │ Tactical Value Weighting (ARAM) │
│ - WR >= 65% (Requires >=15~20G) │         │ - Kill Participation KP = K + A │
│ - High Rank (Master/GM/Chall)   │         │ - Deaths (Frontline initiation) │
└────────────────┬────────────────┘         └────────────────┬────────────────┘
                 │                                           │
                 └─────────────────────────┬─────────────────┘
                                           │
                       ┌───────────────────┴───────────────────┐
                       ▼                                       ▼
        ┌─────────────────────────────┐         ┌─────────────────────────────┐
        │       🌟 Top Horse (上等马)  │         │    ⚠️ Bottom Horse (下等马) │
        │ - 20-Game proven big carry  │         │ - Low WR (<=35%) + Low KP   │
        │ - High rank dimension crush │         │ - True feeder / useless deaths│
        │ - Teamfight engine (high KP)│         │ - Tilt streak / zero KP AFK │
        └─────────────────────────────┘         └─────────────────────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────────┐
                        │        🛡️ Mid Horse (中等马)         │
                        │ - Sacrificial Tank (High D, High KP)│
                        │ - Steady performer / Team anchor    │
                        │ - Standard balanced player          │
                        └─────────────────────────────────────┘
```

#### Detailed Decision Dimensions:

1. **Big Sample Requirement for High Win Rate ($\ge 65\%$)**:
   - In ARAM, a player winning 3 to 4 games in a row (75%~100% win rate) is often just fortunate champion RNG or teammate luck.
   - The algorithm mandates: **Win rates $\ge 65\%$ must have at least 15~20 games in the sample** before being awarded `Top Horse / Hard Carry` status.
2. **Recognition of the "Sacrificial Tank" in Hextech ARAM (Why High Deaths $\ne$ Feeder)**:
   - In ARAM, dying is mandatory to purchase items and restore health, and frontline tanks must soak cooldowns and initiate teamfights.
   - If a player averages 8~10 deaths per game but maintains high kill participation ($KP = Kills + Assists \ge 26 \sim 32$), **they are the true teamfight engine of the squad!**
   - The algorithm rewards this playstyle with tags like `🐎 Mid Horse · Aggressive Initiator / Sacrificial Tank`, never misclassifying them as feeders.
3. **Strict Criteria for Bottom Horse (The True Liability)**:
   - A player is tagged as `🐴 Bottom Horse · ATM Machine / Useless Deaths` only when meeting all three conditions: **Low Win Rate ($\le 40\%$) AND High Deaths ($\ge 9$) AND Low KP ($\le 18$)**.
   - Players who play passively to preserve KDA with zero damage output and under 14 KP are tagged as `🐴 Bottom Horse · Spectator / Zero KP`.
   - Players on a $\ge 4$-game losing streak with sub-45% win rate receive the `Tilt Streak / Collapsed State` warning.
4. **High-Rank Solo Queue Dimension Reduction**:
   - Analyzes players' 5v5 Solo Queue rank (Challenger, Grandmaster, Master, Diamond) and LP to highlight elite players entering casual queues.

---

### 3. 💬 Assembled Horse Report Console (Manual Control)

**We strictly oppose uninvited automatic chat flooding.**

The helper assembles a clean, concise single-line briefing summarizing key intelligence:
- ⚠️ **Ally Liability Warning**: Informs the team of struggling allies to play more defensively around them.
- 🚨 **Enemy Smurf Alert**: Highlights enemy high-winrate or high-rank threats to prioritize in fights.
- 🎯 **Enemy Weak Link**: Identifies low-participation, tilting opponents as prime targets to initiate upon.
- 💪 **Ally Core Carry**: Highlights dependable teammates to play around.

#### Two Convenient Sharing Modes:
1. **Champ Select Team Chat**: Click `Send to Champ Select Chat` to immediately output the tactical summary into the lobby chat via official client endpoints.
2. **In-Game 1-Click Copy**: In loading or in-game, click `In-Game Chat (Copy & Paste)` to copy to clipboard; in-game, simply press `Enter` ➔ `Ctrl+V` ➔ `Enter` (0.5 seconds).

---

### 4. 🌐 Real-Time Bilingual Toggle
- Features a top-right header button (`🌐 EN` / `🌐 中文`).
- Instantly translates the entire interface with zero lag or screen flicker.
- Remembers your selection automatically using local browser storage.

---

### 5. 🛡️ Process-Level Zero-Crash Architecture
- **Win32 Memory Bounds Safety**: Guards against PEB buffer overflows and indexing exceptions during client startup/shutdown.
- **Sub-Goroutine Panic Isolation**: All Go service routines and event handlers are enclosed in `defer recover()` boundaries. Even if the League client abruptly closes or sends malformed payloads, the helper handles it gracefully without closing.
- **Defensive React Rendering**: All statistical calculations feature nullish coalescing to prevent UI white-screen crashes.

---

## 🚀 Getting Started

### Option 1: Run the Precompiled Binary (Recommended)
1. Download the latest single executable directly from GitHub Releases: [**lol-helper-v1.0.exe**](https://github.com/mengjio007/LOL-tool/releases/latest/download/lol-helper-v1.0.exe) (~3.85 MB, direct download).
2. Launch the League of Legends client (any order works; the assistant automatically detects and hooks the LCU event bus).
3. Double-click `lol-helper-v1.0.exe` to run.

---

### Option 2: Build from Source

#### Prerequisites:
- [Go](https://go.dev/) 1.22+ or 1.25+
- [Node.js](https://nodejs.org/) 18+ (with npm)
- [Wails CLI v2](https://wails.io/): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- [UPX](https://upx.github.io/) (optional, for PE binary compression)

#### Build Instructions:
```powershell
# 1. Clone this repository
git clone git@github.com:mengjio007/LOL-tool.git
cd LOL-tool

# 2. Install frontend dependencies
cd frontend
npm install
cd ..

# 3. Execute automated build & compression script
powershell -ExecutionPolicy Bypass -File .\build.ps1
```
The compressed single binary `lol-helper-v1.0.exe` (~4.0 MB) will be generated in the root directory.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Desktop Framework** | [Wails v2](https://wails.io/) | High-performance Go + native WebView2 bridge (No bulky Electron runtime) |
| **Backend Core** | [Go 1.25](https://go.dev/) | Ultra-fast concurrency, Win32 PEB process discovery, LCU REST & WebSocket |
| **Frontend UI** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Modern component architecture, type-safe state management |
| **Bundler** | [Vite 8](https://vitejs.dev/) | Sub-second HMR and optimized production bundling |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Hextech dark fantasy UI theme |
| **Iconography** | [Lucide React](https://lucide.dev/) | Crisp modern vector icons |
| **Compressor** | [UPX 5.2.1](https://upx.github.io/) | Lossless executable packaging (11.5MB -> 4.0MB) |

---

## ⚖️ Disclaimer

1. This project is an open-source educational utility intended to assist League of Legends players with team formation and pick decisions.
2. It interacts exclusively with public Riot Games LCU client APIs. **It does not contain any memory injection, disassembly tampering, bot scripts, or unfair competitive advantages.**
3. Please use this tool responsibly and respectfully.
4. League of Legends is a registered trademark of Riot Games, Inc. This project is not affiliated with or endorsed by Riot Games.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
