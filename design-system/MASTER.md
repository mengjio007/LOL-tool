# LOL Assistant Design System (Master)

> Generated based on `ui-ux-pro-max` skill guidelines.
> Optimized for Wails v2 + React Desktop Client.

---

## 1. Design Thesis & Visual Style
- **Core Aesthetic**: Hextech Dark Gaming (OLED Deep Blue-Black + Hextech Gold & Arcane Cyan).
- **Design Metaphor**: League of Legends LCU native Hextech UI look-and-feel — metallic micro-borders, glassmorphism cards, glowing status orbs, clean modern controls.
- **Window Size**: 560px × 680px (Compact desktop tool, frameless window with custom titlebar, supports drag & minimize to system tray).

---

## 2. Color Palette Tokens

```css
:root {
  /* Backgrounds */
  --bg-app: #010a13;             /* Deepest Runeterra obsidian background */
  --bg-card: rgba(10, 20, 40, 0.75); /* Frosted glass card */
  --bg-card-hover: rgba(15, 30, 60, 0.85);
  --bg-input: #091428;           /* Input / log console background */

  /* Hextech Metallic Accents */
  --gold-primary: #c89b3c;       /* Classic Hextech Gold */
  --gold-hover: #f0e6d2;         /* Pale Gold highlight */
  --gold-border: rgba(200, 155, 60, 0.35); /* Subtle metallic border */

  /* Arcane Magic & State Accents */
  --arcane-cyan: #0ac8b9;        /* Active / Connected glow */
  --arcane-blue: #0397ab;        /* Interactive buttons / badges */
  --status-success: #10b981;     /* ReadyCheck Accept */
  --status-warning: #f59e0b;     /* Lobby waiting / Matching */
  --status-error: #f43f5e;       /* Disconnected / Exception */

  /* Typography */
  --text-main: #f0e6d2;          /* High contrast warm ivory */
  --text-muted: #8b99ad;         /* Secondary descriptive labels */
  --text-dim: #465468;           /* Disabled / watermark */
}
```

---

## 3. Component Architecture & Guidelines

### 3.1 Header / Custom Titlebar (Window Controls)
- 36px height, draggable region (`--wails-draggable: drag`).
- App icon + Title ("LOL 助手 v3.0") + Live status pill (e.g. `● 客户端已连接`).
- Pin-on-top toggle, Minimize button, Close button (minimize to system tray by default).

### 3.2 Status Hero Card (Game Flow Monitor)
- Displays current phase (`Lobby`, `Matchmaking`, `ReadyCheck`, `ChampSelect`, `InProgress`, `EndOfGame`).
- Visual indicator: Breathing glow dot (Cyan for idle/lobby, Amber pulse for matchmaking, Emerald strobe for ReadyCheck).

### 3.3 Core Automation Toggles (Card Grid)
- **Auto Accept**: Switch + Delay Slider (0ms ~ 3000ms with 800ms default recommendation).
- **Smart Matchmaking**: Switch with teammate readiness badge tooltip.
- **Skip Post-Game**: Switch to auto dismiss stats and re-enter lobby.

### 3.4 Live Activity Terminal (Log Console)
- Monospace font (`font-mono`, 12px).
- Syntax-highlighted timestamps (`text-slate-500`), status tags (`[接受成功]` in green, `[状态转换]` in cyan).
- Auto-scroll lock with "清空日志" (Clear) action.

---

## 4. Anti-Patterns to Avoid
1. ❌ **Do not use pure white backgrounds** or harsh high-contrast black/white; keep inside Hextech navy/gold tones.
2. ❌ **Avoid cluttered multi-layer modals**; use smooth drawer or inline accordion for secondary options.
3. ❌ **Do not block the UI** during LCU WebSocket reconnection or HTTP calls; all operations must be asynchronous with clear loading/skeleton states.
