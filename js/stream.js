/* js/stream.js - 고확신 저장 레이어 및 동적 실마리 연동판 */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("⚙️ [타래 메인] 고확신 비주얼 저장 엔진 가동");

    const submitBtn = document.getElementById("submit-thought-btn");
    const thoughtInput = document.getElementById("thought-input");
    const placeholderText = document.getElementById("dynamic-placeholder");
    const tagCloudContainer = document.getElementById("tag-cloud");

    // 🔒 [강력한 시각적 저장 인지 피드백 장치]
    function triggerSuccessVisuals() {
        if (!submitBtn) return;
        
        // 버튼을 초록색 성공 상태로 전환하여 유저에게 확신 부여
        const originalText = submitBtn.innerText;
        const originalBg = submitBtn.style.background;
        
        submitBtn.style.background = "#2ecc71";
        submitBtn.innerText = "✓ 수파베이스 클라우드 저장 완료!";
        submitBtn.disabled = true;

        // 입력창에 일시적인 세레머니 테두리 넛지
        if (thoughtInput) {
            thoughtInput.style.transition = "all 0.3s";
            thoughtInput.style.border = "2px solid #2ecc71";
            thoughtInput.style.background = "rgba(46, 204, 113, 0.02)";
        }

        setTimeout(() => {
            submitBtn.style.background = originalBg;
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            if (thoughtInput) {
                thoughtInput.style.border = "";
                thoughtInput.style.background = "";
            }
        }, 2200);
    }

    async function updateDynamicMetrics(allThoughtsData) {
        try {
            const elements = Array.from(document.querySelectorAll(".metric-card, p, span, div"));
            
            // 1. 풀려 있는 실가닥 매핑
            const cardUnraveled = elements.find(el => el.textContent.includes("풀려 있는 실가닥"));
            if (cardUnraveled) {
                const num = cardUnraveled.querySelector(".metric-num") || cardUnraveled.parentElement.querySelector(".metric-num");
                if (num) num.innerText = `${allThoughtsData.length}개`;
            }
        } catch(e) { console.error(e); }
    }

    async function loadSavedThoughts() {
        try {
            const result = typeof TaraeStorage !== 'undefined' ? await TaraeStorage.getThoughts() : { data: [] };
            const data = (result && result.data) ? result.data : [];

            await updateDynamicMetrics(data);

            // 입력창 위 문구는 단순한 유도 멘트로 고정 (과거 생각 미리보기는 "뜻밖의 공명" 섹션이 전담)
            if (placeholderText) {
                placeholderText.innerText = data.length > 0
                    ? "오늘 하루 고생 많았어요. 마음에 가득 찬 잔상들을 털어내 보세요."
                    : "🧵 아직 적재된 사유가 없습니다. 첫 실마리를 던져보세요!";
            }
        } catch (err) {
            if (placeholderText) placeholderText.innerText = "오늘 하루 고생 많았어요. 마음에 가득 찬 잔상들을 털어내 보세요.";
        }
    }

    function showNotice(message, isError = true) {
        const noticeEl = document.getElementById("thought-notice");
        if (!noticeEl) return;
        noticeEl.innerText = message;
        noticeEl.style.color = isError ? "#e67e22" : "#2ecc71";
        setTimeout(() => { if (noticeEl.innerText === message) noticeEl.innerText = ""; }, 3000);
    }

    // 🎨 저장 직후, AI 분류를 기다리지 않고 화면에 바로 임시 태그를 보여주는 함수
    function showQuickPreviewTag(content) {
        if (!tagCloudContainer) return;

        // 아주 단순한 규칙으로 임시 키워드 하나만 뽑음 (AI가 아니라 그냥 화면 반응용)
        const words = content.split(/\s+/).filter(w => w.length >= 2);
        const quickWord = words[0] || content.slice(0, 6);

        const badge = document.createElement("span");
        badge.id = "quick-preview-badge";
        badge.style.cssText = "padding: 0.3rem 0.8rem; background: rgba(46,204,113,0.12); border-radius: 20px; font-size: 0.85rem; color: #2ecc71; font-weight: 500;";
        badge.innerText = `#${quickWord} (정리 중...)`;
        tagCloudContainer.prepend(badge);
    }

    function removeQuickPreviewTag() {
        const badge = document.getElementById("quick-preview-badge");
        if (badge) badge.remove();
    }

    // 🤖 백그라운드에서 진짜 AI 분류를 실행하고, 끝나면 조용히 태그를 교체 (화면 반응 속도에는 영향 없음)
    async function classifyInBackground(thoughtId, content) {
        try {
            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
            if (!response.ok) throw new Error("분류 실패");
            const aiData = await response.json();
            if (aiData.error || !aiData.tags) throw new Error(aiData.error || "태그 없음");

            await TaraeStorage.updateThoughtTags(thoughtId, aiData.tags, aiData.comfort || "");

            // 최신 데이터로 태그 클라우드만 조용히 새로고침 (다른 화면 요소는 안 건드림)
            removeQuickPreviewTag();
            if (typeof buildTagCloud === "function") {
                const { data } = await TaraeStorage.getThoughts();
                buildTagCloud(data || []);
            }
        } catch (e) {
            console.error("백그라운드 분류 실패:", e);
            removeQuickPreviewTag(); // 실패해도 임시 태그는 정리 (사용자에게 별도 에러는 안 띄움 — 태그는 부가 기능)
        }
    }

    async function processThought() {
        const thoughtValue = thoughtInput.value.trim();

        if (!thoughtValue) {
            showNotice("🧵 빈 손으로는 실을 던질 수 없어요. 짧게라도 한 가닥 적어주세요.");
            thoughtInput.focus();
            return;
        }

        // 🎯 낙관적 UI: 실제 저장을 기다리지 않고 먼저 "던져졌다"는 확신을 즉시 보여줌
        thoughtInput.value = "";
        triggerSuccessVisuals();
        showQuickPreviewTag(thoughtValue); // 머릿속 기상도에 바로 임시 태그 반짝 표시

        try {
            let newThoughtId = null;
            if (typeof TaraeStorage !== 'undefined') {
                const { data, error } = await TaraeStorage.saveThought(thoughtValue, ["정리 중"], "");
                if (error) throw error;
                newThoughtId = data && data[0] ? data[0].id : null;
            }
            await loadSavedThoughts(); // 메트릭 카운트 즉시 동기화 리사이클

            // AI 분류는 백그라운드에서 진행 — 화면은 이미 반응을 마쳤으니 여기서 기다리지 않음
            if (newThoughtId) {
                classifyInBackground(newThoughtId, thoughtValue);
            } else {
                removeQuickPreviewTag();
            }
        } catch (error) {
            console.error(error);
            // 저장이 실은 실패했다면, 조용히 되돌리고 사용자에게 알림 + 입력값 복구
            removeQuickPreviewTag();
            showNotice("🌙 저장 중 실이 살짝 엉켰어요. 다시 한 번 던져봐 주세요.");
            thoughtInput.value = thoughtValue;
        }
    }

    if (typeof TaraeStorage !== 'undefined') {
        TaraeStorage.init().then(() => { loadSavedThoughts(); });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", processThought);
        thoughtInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); processThought(); } });
    }
});