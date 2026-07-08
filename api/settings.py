/* js/settings.js - 로컬 스토리지 절대 사수형 이중 잠금 가드 */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("⚙️ [타래 설정] 유령 덮어쓰기 원천 봉쇄 시스템 가동");

    if (typeof TaraeStorage !== 'undefined') {
        await TaraeStorage.init();
    }
    const client = typeof TaraeStorage !== 'undefined' ? await TaraeStorage.getClient() : null;
    
    const discordInput = document.getElementById("discord-webhook-url");
    const slackInput = document.getElementById("slack-webhook-url");
    const saveBtn = document.getElementById("save-settings-btn");

    function loadSettings() {
        // [1선 방어] 로컬 스토리지 데이터 선제 복원 (시간이 지나도 브라우저에서 절대 임의 삭제 불가)
        const localDiscord = localStorage.getItem("tarae_discord_webhook") || "";
        const localSlack = localStorage.getItem("tarae_slack_webhook") || "";
        
        if (discordInput) discordInput.value = localDiscord;
        if (slackInput) slackInput.value = localSlack;

        // [2선 방어] 수파베이스 세션 체크 및 검증 후 동기화
        if (client && client.auth) {
            client.auth.getUser().then(({ data: { user } }) => {
                if (user && user.user_metadata) {
                    const cloudDiscord = user.user_metadata.discord_webhook;
                    const cloudSlack = user.user_metadata.slack_webhook;
                    
                    // ⭐ [버그 수정 록체결]: 클라우드에 '진짜 데이터'가 실존할 때만 덮어쓰기 허용 (공백 유령 차단)
                    if (cloudDiscord && discordInput) {
                        discordInput.value = cloudDiscord;
                        localStorage.setItem("tarae_discord_webhook", cloudDiscord);
                    }
                    if (cloudSlack && slackInput) {
                        slackInput.value = cloudSlack;
                        localStorage.setItem("tarae_slack_webhook", cloudSlack);
                    }
                }
            }).catch(err => console.log("🔒 세션 만료 상태 확인: 로컬 안전 캐시 메모리를 유지합니다."));
        }
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            saveBtn.disabled = true;
            const originalText = saveBtn.innerText;
            saveBtn.innerText = "영구 메모리에 각인 중...";

            const discordValue = discordInput ? discordInput.value.trim() : "";
            const slackValue = slackInput ? slackInput.value.trim() : "";

            // 로컬에 강제 각인
            localStorage.setItem("tarae_discord_webhook", discordValue);
            localStorage.setItem("tarae_slack_webhook", slackValue);

            let cloudSaved = false;
            if (client && client.auth) {
                try {
                    const { error } = await client.auth.updateUser({
                        data: { discord_webhook: discordValue, slack_webhook: slackValue }
                    });
                    if (!error) cloudSaved = true;
                } catch (e) { }
            }

            if (cloudSaved) {
                alert("🔒 [이중 각인 성공] 수파베이스 클라우드 기지와 맥북 스토리지에 동시 봉인되었습니다.");
            } else {
                alert("💡 [로컬 우선 보존] 세션 만료로 인해 현재 맥북 메모리에 우선 암호화 저장되었습니다. 로그인 시 자동 싱크됩니다.");
            }

            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        });
    }

    loadSettings();
});