(async () => {
    const Logger = {
        prefix: '%c[QuestComp]%c',
        style: 'color: #5865F2; font-weight: 800; border-radius: 4px; padding: 2px 4px; background: rgba(88, 101, 242, 0.1);',
        reset: 'color: inherit; font-weight: normal; background: transparent;',
        info: (msg) => console.log(`${Logger.prefix} ${msg}`, Logger.style, Logger.reset),
        success: (msg) => console.log(`${Logger.prefix} %c${msg}`, Logger.style, Logger.reset, 'color: #57F287; font-weight: 600;'),
        warn: (msg) => console.log(`${Logger.prefix} %c${msg}`, Logger.style, Logger.reset, 'color: #FEE75C; font-weight: 600;'),
        error: (msg) => console.log(`${Logger.prefix} %c${msg}`, Logger.style, Logger.reset, 'color: #ED4245; font-weight: 600;')
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const randomJitter = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    delete window.$;
    let wpRequire;
    window.webpackChunkdiscord_app.push([[Symbol()], {}, r => { wpRequire = r; }]);
    window.webpackChunkdiscord_app.pop();

    const getModule = (filter) => Object.values(wpRequire.c).find(filter);
    
    try {
        const ApplicationStreamingStore = getModule(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.A;
        const RunningGameStore = getModule(x => x?.exports?.Ay?.getRunningGames)?.exports?.Ay;
        const QuestsStore = getModule(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
        const ChannelStore = getModule(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
        const GuildChannelStore = getModule(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
        const FluxDispatcher = getModule(x => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports?.h;
        const api = getModule(x => x?.exports?.Bo?.get)?.exports?.Bo;

        if (!QuestsStore || !FluxDispatcher || !api) {
            throw new Error("Failed to extract critical Discord Webpack modules. Discord may have updated.");
        }

        const isApp = typeof DiscordNative !== "undefined";
        const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];

        const activeQuests = [...QuestsStore.quests.values()].filter(x => 
            x.userStatus?.enrolledAt && 
            !x.userStatus?.completedAt && 
            new Date(x.config.expiresAt).getTime() > Date.now() && 
            supportedTasks.some(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))
        );

        if (activeQuests.length === 0) {
            Logger.warn("No active, uncompleted quests found in your queue.");
            return;
        }

        Logger.info(`Found ${activeQuests.length} active quest(s). Initializing execution sequence...`);

        const handleVideoQuest = async (quest, taskName, secondsNeeded, secondsDone) => {
            const speed = 7;
            let completed = false;
            
            Logger.info(`Spoofing video engagement for: ${quest.config.messages.questName}`);

            while (true) {
                const remaining = Math.min(speed, secondsNeeded - secondsDone);
                await sleep((remaining * 1000) + randomJitter(200, 800)); // Added jitter for safety

                const timestamp = secondsDone + Math.min(speed, remaining);
                const payload = { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) };
                
                const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: payload });
                completed = res.body.completed_at != null;
                secondsDone = Math.min(secondsNeeded, timestamp);

                Logger.info(`Video Progress: ${Math.floor(secondsDone)}/${secondsNeeded}s`);

                if (secondsDone >= secondsNeeded) break;
            }

            if (!completed) {
                await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
            }
        };

        const handleDesktopGameQuest = async (quest, applicationId, secondsNeeded, secondsDone, pid) => {
            if (!isApp) return Logger.error("Desktop app required for Game Quests. Aborting task.");

            const res = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
            const appData = res.body[0];
            const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "");
            
            const fakeGame = {
                cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                exeName,
                exePath: `C:\\Program Files\\${appData.name.toLowerCase()}\\${exeName}`,
                hidden: false,
                isLauncher: false,
                id: applicationId,
                name: appData.name,
                pid: pid,
                pidPath: [pid],
                processName: appData.name,
                start: Date.now(),
            };

            const realGames = RunningGameStore.getRunningGames();
            const realGetRunningGames = RunningGameStore.getRunningGames;
            const realGetGameForPID = RunningGameStore.getGameForPID;

            Logger.info(`Mocking process payload for: ${appData.name}. Windows 11 environment assumed. Please wait ~${Math.ceil((secondsNeeded - secondsDone) / 60)} minutes.`);

            return new Promise((resolve) => {
                let progressListener;

                try {
                    RunningGameStore.getRunningGames = () => [fakeGame];
                    RunningGameStore.getGameForPID = (searchPid) => searchPid === pid ? fakeGame : undefined;
                    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: [fakeGame] });

                    progressListener = (data) => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                        Logger.info(`Game Progress: ${progress}/${secondsNeeded}s`);

                        if (progress >= secondsNeeded) {
                            resolve();
                        }
                    };

                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", progressListener);
                } finally {
                    // Cleanup mechanism ensuring client stability
                    const cleanupInterval = setInterval(() => {
                        if (quest.userStatus?.completedAt || secondsDone >= secondsNeeded) {
                            RunningGameStore.getRunningGames = realGetRunningGames;
                            RunningGameStore.getGameForPID = realGetGameForPID;
                            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", progressListener);
                            clearInterval(cleanupInterval);
                        }
                    }, 5000);
                }
            });
        };

        const handleStreamQuest = async (quest, applicationId, secondsNeeded, secondsDone, pid) => {
            if (!isApp) return Logger.error("Desktop app required for Stream Quests. Aborting task.");

            const realGetStreamerMetadata = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
            Logger.info(`Mocking stream state for: ${quest.config.messages.questName}. You MUST share a window in a VC with at least 1 other user.`);

            return new Promise((resolve) => {
                let progressListener;

                try {
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                        id: applicationId,
                        pid,
                        sourceName: null
                    });

                    progressListener = (data) => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                        Logger.info(`Stream Progress: ${progress}/${secondsNeeded}s`);

                        if (progress >= secondsNeeded) {
                            resolve();
                        }
                    };

                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", progressListener);
                } finally {
                    const cleanupInterval = setInterval(() => {
                        if (quest.userStatus?.completedAt || secondsDone >= secondsNeeded) {
                            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realGetStreamerMetadata;
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", progressListener);
                            clearInterval(cleanupInterval);
                        }
                    }, 5000);
                }
            });
        };

        const handleActivityQuest = async (quest, secondsNeeded) => {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0)?.VOCAL[0]?.channel?.id;
            
            if (!channelId) return Logger.error("Could not locate a valid channel for Activity simulation.");
            
            const streamKey = `call:${channelId}:1`;
            Logger.info(`Emulating Embedded Activity heartbeat for: ${quest.config.messages.questName}`);

            while (true) {
                const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
                const progress = res.body.progress.PLAY_ACTIVITY.value;
                Logger.info(`Activity Progress: ${progress}/${secondsNeeded}s`);

                await sleep(20000 + randomJitter(500, 2000)); // 20s + random jitter

                if (progress >= secondsNeeded) {
                    await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
                    break;
                }
            }
        };
 
        for (const quest of activeQuests) {
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
            
            if (!taskName) continue;

            const secondsNeeded = taskConfig.tasks[taskName].target;
            const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
            const pid = Math.floor(Math.random() * 30000) + 1000;
            const applicationId = quest.config.application.id;

            try {
                if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                    await handleVideoQuest(quest, taskName, secondsNeeded, secondsDone);
                } else if (taskName === "PLAY_ON_DESKTOP") {
                    await handleDesktopGameQuest(quest, applicationId, secondsNeeded, secondsDone, pid);
                } else if (taskName === "STREAM_ON_DESKTOP") {
                    await handleStreamQuest(quest, applicationId, secondsNeeded, secondsDone, pid);
                } else if (taskName === "PLAY_ACTIVITY") {
                    await handleActivityQuest(quest, secondsNeeded);
                }
                
                Logger.success(`Quest Completed: ${quest.config.messages.questName} [Claim manually in Discover tab]`);
                await sleep(2000); // Breathe between quests

            } catch (error) {
                Logger.error(`Task failure on ${quest.config.messages.questName}: ${error.message}`);
            }
        }

        Logger.success("All queued quests have been processed successfully.");

    } catch (err) {
        Logger.error(`Fatal execution error: ${err.message}`);
    }
})();
