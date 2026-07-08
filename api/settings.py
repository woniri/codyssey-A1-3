/* js/settings.js */

document.addEventListener("DOMContentLoaded", async () => {
    await TaraeStorage.init();
    const client = await TaraeStorage.getClient();
    
    const discordInput = document.getElementById("discord-webhook-url");
    const slackInput = document.getElementById("slack-webhook-url");
    const saveBtn = document.getElementById("save-settings-btn");

    // 📥 1. 페이지 열릴 때 수파베이스 고유 메타데이터에서 웹훅 주소 영구 풀링
    async function loadUserSettings() {
        const { data: { user }, error } = await client.auth.getUser();
        if (user && user.user_metadata) {
            if (discordInput) discordInput.value = user.user_metadata.discord_webhook || "";
            if (slackInput) slackInput.value = user.user_metadata.slack_webhook || "";
            console.log("🎯 [타래 인프라] 수파베이스 클라우드에서 웹훅 주소 동킹 완공");
        }
    }

    // 📤 2. 저장 버튼 클릭 시 브라우저가 아닌 수파베이스 유저 메타데이터에 영구 각인
    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            saveBtn.disabled = true;
            saveBtn.innerText = "클라우드에 각인 중...";

            const { data, error } = await client.auth.updateUser({
                data: {
                    discord_webhook: discordInput ? discordInput.value.trim() : "",
                    slack_webhook: slackInput ? slackInput.value.trim() : ""
                }
            });

            if (error) {
                alert("❌ 인프라 영구 저장 실패: " + error.message);
            } else {
                alert("🔒 수파베이스 클라우드 세포에 웹훅 주소가 영구 각인되었습니다. 로그아웃해도 유지됩니다!");
            }
            saveBtn.disabled = false;
            saveBtn.innerText = "설정 저장";
        });
    }

    loadUserSettings();
});