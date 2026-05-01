# Discord Quest Completer

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Join Discord](https://img.shields.io/badge/Join%20Discord-5865F2?logo=discord&logoColor=white&style=flat)](https://discord.gg/cqX6eAmcrp)

A lightweight, streamlined utility for the Discord desktop developer console designed to accelerate the completion of promotional Quests. If this tool saves you time, please consider dropping a ⭐ on the repository.

> [!WARNING]
> **CRITICAL NOTICE: As of April 7th 2026, Discord has expressed their intent to crack down on automating quest completion. Use this script at your own risk, as you most likely WILL get flagged by doing so.**

---

### ⚡ Core Functionality

This script automates the background progress of Discord Quests, eliminating the need to manually execute the required tasks.

* **Video Quests:** Simulates continuous watch time, typically completing the requirement in 5–15 minutes instead of real-time.
* **Game Quests:** Emulates an active game presence, tricking the client into registering playtime even if the application is closed.
* **Stream Quests:** Simulates an active broadcast state within a voice channel (requires initiating a standard stream first).
* **Embedded Activities:** Transmits automated activity payloads every ~20 seconds to maintain an active session.
* **Auto-Claim (Optional):** Automatically interacts with the reward claim endpoint upon reaching 100% completion.

*Note: You must manually accept the quest within the Discord client first. Non-video quests require you to wait the advertised duration, though the script handles the progress ticking automatically.*

---

### ⚠️ Risk & Compliance

**Usage of this utility violates Discord's Terms of Service.**
Automating service interactions and spoofing activity states falls under violations of service integrity. 

* **Ban Risk:** While mass bans for this specific method are currently rare for casual users (1–3 quests weekly), aggressive farming, Nitro abuse, or public bragging significantly increases your risk of a permanent account suspension.
* **Auto-Claim Risks:** The auto-claim variant is inherently riskier. It may trigger CAPTCHA challenges, causing the silent failure of the claim endpoint and flagging the account with bot-like behavior.
* **Best Practices:** Utilize an alternate account for farming. Do not exceed 2–4 quests daily. Never share screenshots of automated rewards on public forums. 

*For optimal safety on a primary account, use the standard manual-claim script.*

---

### 🛠️ Execution Guide

No prior coding experience is required. Follow these steps precisely:

1.  **Environment:** Ensure you are running the official Discord desktop application (Windows 11, macOS, or Linux). *Browser environments and custom clients (Vesktop, ArmCord) generally only support video quests.*
2.  **Activation:** Navigate to **Discover > Quests** in the Discord sidebar and accept your desired quest.
3.  **Console Access:** Press `Ctrl + Shift + I` to open the Developer Tools. Navigate to the **Console** tab.
4.  **Bypass Restrictions:** If you receive a warning that pasting is disabled, type `allow pasting` and press Enter.
5.  **Inject Script:** Copy the entirety of either `quest-completer.js` (Recommended) or `quest-completer-with-auto-claim.js`. Right-click within the Console, select Paste, and press Enter.
6.  **Monitor:** The script initializes immediately. Monitor the console output for progress logs (e.g., `Play progress: 1245/3600`).
7.  **Completion:** Once the console indicates completion, verify your reward in the Quests tab. If auto-claim fails or prompts a CAPTCHA, claim the reward manually.

*Special Instruction for Stream Quests: You must join a voice channel with at least one other user and begin sharing your screen (any application will suffice) for the script to properly log time.*

---

### ❓ Frequently Asked Questions

**The console returns red error text. What went wrong?**
This is typically caused by using an unsupported client or an incomplete copy-paste. Restart the official Discord desktop application and try again. If the stable build fails, try Discord PTB or Canary.

**Ctrl+Shift+I opens a screenshot tool instead of the console.**
Your GPU software (e.g., AMD Radeon or NVIDIA GeForce Experience) has bound this shortcut globally. Disable the conflicting hotkey in your graphics control panel.

**Why does the script identify my custom client (e.g., Vesktop) as a browser?**
Custom wrappers often lack the native hooks required for game and stream detection. You must use the official client for non-video quests.

**Can the script automatically accept new quests?**
No. The acceptance endpoint frequently triggers a CAPTCHA, making automation too risky and unreliable.

**Is there a BetterDiscord or Vencord plugin version?**
Community ports exist (search for "QuestAuto"), but standard plugins often update slower than this raw script when Discord patches their API.

---

### ⚖️ Disclaimer

This repository is maintained for **educational and research purposes only**. The authors are not affiliated with Discord Inc. You assume all responsibility and liability for any account suspensions, bans, or data loss that may occur from utilizing these scripts. 

Made with ❤️ by Emy (ciuqe @ discord) who likes to poke at how software works.
