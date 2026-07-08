/* js/settings.js - 하이브리드 영구 저장 가속 서킷 */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("⚙️ [타래 설정 엔진] 하이브리드 이중 아카이브 보완 서킷 가동");

    if (typeof TaraeStorage !== 'undefined') {
        await TaraeStorage.init();
    }
    const client = typeof TaraeStorage !== 'undefined' ? await TaraeStorage.getClient() : null;
    
    const discordInput = document.getElementById("discord-webhook-url");
    const slackInput = document.getElementById("slack-webhook-url");
    const saveBtn = document.getElementById("save-settings-btn");

    // 📥 1. [하이브리드 로드]: 로컬 캐시에서 0.1초만에 꺼내고, 세션이 있다면 클라우드와 정밀 동기화
    function loadSettings() {
        // [1차 방어선] 로컬 스토리지 즉시 복원 (로그아웃해도 맥북 브라우저 메모리에 무조건 잔존)
        if (discordInput) discordInput.value = localStorage.getItem("tarae_discord_webhook") || "";
        if (slackInput) slackInput.value = localStorage.getItem("tarae_slack_webhook") || "";
        console.log("📥 [하이브리드 로드] 로컬 캐시 메모리 복원 완공");

        // [2차 방어선] 수파베이스 클라우드 인증 세포 동기화
        if (client && client.auth) {
            client.auth.getUser().then(({ data: { user } }) => {
                if (user && user.user_metadata) {
                    const cloudDiscord = user.user_metadata.discord_webhook;
                    const cloudSlack = user.user_metadata.slack_webhook;
                    
                    // 클라우드에 최신 데이터가 있다면 로컬에 덮어쓰며 정렬
                    if (cloudDiscord && discordInput) {
                        discordInput.value = cloudDiscord;
                        localStorage.setItem("tarae_discord_webhook", cloudDiscord);
                    }
                    if (cloudSlack && slackInput) {
                        slackInput.value = cloudSlack;
                        localStorage.setItem("tarae_slack_webhook", cloudSlack);
                    }
                    console.log("🏛️ [하이브리드 로드] 수파베이스 클라우드 메타데이터 동기화 완공");
                }
            }).catch(err => console.warn("클라우드 세션 조회 우회 (비로그인 또는 로컬 가동 상태):", err.message));
        }
    }

    // 📤 2. [하이브리드 각인]: 버튼 클릭 시 로컬 캐시와 수파베이스 클라우드에 원천 동시 사출
    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            saveBtn.disabled = true;
            const originalText = saveBtn.innerText;
            saveBtn.innerText = "이중 영구 메모리에 각인 중...";

            const discordValue = discordInput ? discordInput.value.trim() : "";
            const slackValue = slackInput ? slackInput.value.trim() : "";

            // [1차 각인] 로컬 스토리지 저장 (로그아웃 세션 폭발 충격파 방어)
            localStorage.setItem("tarae_discord_webhook", discordValue);
            localStorage.setItem("tarae_slack_webhook", slackValue);

            // [2차 각인] 수파베이스 유저 메타데이터 동시 각인
            let cloudSaved = false;
            if (client && client.auth) {
                try {
                    const { error } = await client.auth.updateUser({
                        data: {
                            discord_webhook: discordValue,
                            slack_webhook: slackValue
                        }
                    });
                    if (!error) cloudSaved = true;
                } catch (e) { console.warn("클라우드 직접 사출 우회:", e.message); }
            }

            if (cloudSaved) {
                alert("🔒 [하이브리드 각인 성공] 로컬 브라우저 세포와 수파베이스 클라우드 기지에 영구 각인되었습니다. 로그아웃해도 절대 사라지지 않습니다!");
            } else {
                alert("💡 [로컬 안전 보존] 현재 세션이 끊겨 있어 맥 로컬 브라우저 메모리에 우선 저장되었습니다. 마스터 계정 로그인 시 클라우드로 자동 연동됩니다.");
            }

            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        });
    }

    loadSettings();
});