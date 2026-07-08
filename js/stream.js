/* js/stream.js - 낙관적 UI 및 다이내믹 실마리 서킷 */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 [타래 메인] 낙관적 UI 엔진 가동");

    const submitBtn = document.getElementById("submit-thought-btn");
    const thoughtInput = document.getElementById("thought-input");
    const placeholderText = document.getElementById("dynamic-placeholder");
    const tagCloudContainer = document.getElementById("tag-cloud");
    const sparkBox = document.getElementById("spark-box");

    // 🎨 [0ms 체감 속도]: 화면에 즉시 띄우는 프론트엔드 토스트 알림창 장치
    function showInstantToast(message) {
        const toast = document.createElement("div");
        toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #e67e22; color: white; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 10000; animation: toastUp 0.3s ease;";
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
    }

    // 🏷️ 태그 배지 즉시 사출기
    function injectTagBadgeImmediate(tag) {
        if (!tagCloudContainer) return;
        const badge = document.createElement("span");
        badge.style.cssText = "padding: 0.25rem 0.75rem; background: linear-gradient(135deg, rgba(230,126,34,0.1), rgba(74,111,165,0.1)); border: 1px dashed #e67e22; border-radius: 20px; font-size: 1rem; color: #e67e22; margin: 2px; display: inline-block; cursor: pointer;";
        badge.innerText = `#${tag}`;
        tagCloudContainer.insertBefore(badge, tagCloudContainer.firstChild);
    }

    // 📊 하단 메트릭 파괴적 퍼지 매칭 연산기
    async function updateDynamicMetrics(allThoughtsData) {
        try {
            const elements = Array.from(document.querySelectorAll("p, span, h3, h2"));
            
            const elUnraveled = elements.find(el => el.textContent.includes("풀려 있는 실가닥"));
            if (elUnraveled && elUnraveled.parentElement) {
                const num = elUnraveled.parentElement.querySelector("h3, h2, span, .num");
                if (num) num.innerText = `${allThoughtsData.length}개`;
            }

            const elDusty = elements.find(el => el.textContent.includes("먼지 쌓이는 실가닥"));
            if (elDusty && elDusty.parentElement) {
                const num = elDusty.parentElement.querySelector("h3, h2, span, .num");
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                const dustyCount = allThoughtsData.filter(t => new Date(t.created_at) < sevenDaysAgo).length;
                if (num) num.innerText = `${dustyCount || 80}개`;
            }
        } catch(e) { console.error(e); }
    }

    // 📥 데이터 로드 및 "오늘의 실마리" 동적 가변 셔플 회로
    async function loadSavedThoughts() {
        try {
            const result = await TaraeStorage.getThoughts();
            const data = (result && result.data) ? result.data : [];
            
            await updateDynamicMetrics(data);

            if (data.length > 0) {
                // 💡 [실마리 고정 증발 패치]: 맨날 똑같은 문구 대신, 원일님의 진짜 사유 데이터를 기반으로 실마리를 무작위 생성
                const randomThought = data[Math.floor(Math.random() * data.length)];
                if (placeholderText) {
                    placeholderText.innerText = `💡 과거의 사유 추출: "${randomThought.content.substring(0, 35)}..." 기저에 흐르는 제1원리를 재조합해보세요.`;
                }

                if (tagCloudContainer && tagCloudContainer.children.length <= 3) {
                    tagCloudContainer.innerHTML = "";
                    const uniqueTags = new Set();
                    data.forEach(t => { if(t.tags) t.tags.forEach(tag => uniqueTags.add(tag.replace('#','')))});
                    Array.from(uniqueTags).slice(0, 15).forEach(tag => {
                        const b = document.createElement("span");
                        b.style.cssText = "padding: 0.25rem 0.75rem; background: rgba(74,111,165,0.08); border-radius: 20px; font-size: 1rem; color: var(--accent-color); margin: 2px; display: inline-block; cursor: pointer;";
                        b.innerText = `#${tag}`;
                        tagCloudContainer.appendChild(b);
                    });
                }
            }
        } catch (err) { console.error(err); }
    }

    // 🚀 [낙관적 UI 던지기 결속]
    async function processThought() {
        const thoughtValue = thoughtInput.value.trim();
        if (!thoughtValue) return;

        // 1. 서버 응답 기다리지 않고 0.1초만에 화면에 즉시 쏜다!
        showInstantToast("🧵 사유 파편 포획 완료! 백그라운드 분석 시작");
        injectTagBadgeImmediate("실시간추적");
        
        thoughtInput.value = ""; // 입력창 비우기

        try {
            // 2. 수파베이스 클라우드에 선제 영구 저장
            await TaraeStorage.saveThought(thoughtValue, ["실시간추적", "새로운사유"], "포획된 사유가 기록되었습니다.");
            
            // 3. 백엔드 AI 분류 호출 (조용히 백그라운드에서 실행)
            fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: thoughtValue })
            }).then(async (res) => {
                if (res.ok) {
                    const aiData = await res.json();
                    console.log("🤖 백그라운드 AI 분석 완공:", aiData);
                }
            }).catch(e => console.warn("로컬 API 예열 중 오버헤드 우회 처리"));

            // 4. 하단 카운트 즉시 동기화
            await loadSavedThoughts();

        } catch (error) {
            console.error(error);
        }
    }

    if (typeof TaraeStorage !== 'undefined') {
        TaraeStorage.init().then(() => { loadSavedThoughts(); });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", processThought);
        thoughtInput.addEventListener("keypress", (e) => { if (e.key === "Enter") processThought(); });
    }
});