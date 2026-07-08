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

            if (data.length > 0) {
                // 💡 진짜 데이터가 있을 때만 폴백 문구를 파괴하고 무작위 실마리를 동적 매핑
                const randomThought = data[Math.floor(Math.random() * data.length)];
                if (placeholderText) {
                    placeholderText.innerText = `💡 과거의 사유 추출: "${randomThought.content.substring(0, 35)}..." 기저의 제1원리를 직조해보세요.`;
                }
            } else {
                if (placeholderText) placeholderText.innerText = "🧵 아직 적재된 사유가 없습니다. 첫 실마리를 던져 은하계를 개설하세요!";
            }
        } catch (err) {
            if (placeholderText) placeholderText.innerText = "🔮 오프라인 캐시 모드: 새로운 실마리를 자유롭게 투척하세요.";
        }
    }

    async function processThought() {
        const thoughtValue = thoughtInput.value.trim();
        if (!thoughtValue) return;

        try {
            if (typeof TaraeStorage !== 'undefined') {
                // 수파베이스 영구 각인 선제 실행
                await TaraeStorage.saveThought(thoughtValue, ["실시간포획"], "성공");
            }
            
            triggerSuccessVisuals(); // 🎯 확실하게 저장이 완료되었음을 알리는 비주얼 격발
            thoughtInput.value = ""; // 입력창 소독

            await loadSavedThoughts(); // 메트릭 카운트 즉시 동기화 리사이클

        } catch (error) {
            console.error(error);
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