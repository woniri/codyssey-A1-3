/* js/stream.js - 메인 실마리 인터랙션 완전 복구 마스터 피스 */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 [타래 메인 엔진] 전면 복구 및 인터랙션 마스터 밸브 가동");

    const submitBtn = document.getElementById("submit-thought-btn");
    const thoughtInput = document.getElementById("thought-input");
    const placeholderText = document.getElementById("dynamic-placeholder");
    const tagCloudContainer = document.getElementById("tag-cloud");
    const sparkBox = document.getElementById("spark-box");

    // 🎨 [인터랙션 피드백]: 즉시 브라우저 화면에 안착하는 토스트 알림창
    function showInstantToast(message) {
        const toast = document.createElement("div");
        toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #e67e22; color: white; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 10000; transition: opacity 0.3s ease;";
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
    }

    // 📊 [하단 3대 메트릭]: 숫자 바인딩 및 라우팅 벨브 전면 복구
    async function updateDynamicMetrics(allThoughtsData) {
        try {
            const client = typeof TaraeStorage !== 'undefined' ? await TaraeStorage.getClient() : null;
            const elements = Array.from(document.querySelectorAll("p, span, h3, h2, div"));

            // 1. 풀려 있는 실가닥 저격 매핑 및 클릭 리스너 결속
            const elUnraveled = elements.find(el => el.textContent.trim() === "풀려 있는 실가닥" || el.textContent.includes("풀려 있는 실가닥"));
            if (elUnraveled && elUnraveled.parentElement) {
                const num = elUnraveled.parentElement.querySelector("h3, h2, span, .num, p");
                if (num) num.innerText = `${allThoughtsData.length}개`;
                
                elUnraveled.parentElement.style.cursor = "pointer";
                elUnraveled.parentElement.title = "사유 은하계(타래장)로 진입하여 지식 지도 보기";
                elUnraveled.parentElement.onclick = () => { window.location.href = "vault.html"; };
            }

            // 2. 단단해진 타래 저격 매핑 및 클릭 리스너 결속
            let projCount = 1; 
            if (client) {
                try {
                    const { data } = await client.from("projects").select("id");
                    if (data) projCount = data.length;
                } catch(pErr) { console.warn("프로젝트 수집 우회"); }
            }
            const elWoven = elements.find(el => el.textContent.trim() === "단단해진 타래" || el.textContent.includes("단단해진 타래"));
            if (elWoven && elWoven.parentElement) {
                const num = elWoven.parentElement.querySelector("h3, h2, span, .num, p");
                if (num) num.innerText = `${projCount}개`;
                
                elWoven.parentElement.style.cursor = "pointer";
                elWoven.parentElement.title = "베틀 워크스페이스로 이동하여 아이디어 정밀 직조";
                elWoven.parentElement.onclick = () => { window.location.href = "loom.html"; };
            }

            // 3. 먼지 쌓이는 실가닥 저격 매핑 및 클릭 리스너 결속 (7일 이상 경과 분)
            const elDusty = elements.find(el => el.textContent.trim() === "먼지 쌓이는 실가닥" || el.textContent.includes("먼지 쌓이는 실가닥"));
            if (elDusty && elDusty.parentElement) {
                const num = elDusty.parentElement.querySelector("h3, h2, span, .num, p");
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                const dustyCount = allThoughtsData.filter(t => new Date(t.created_at) < sevenDaysAgo).length;
                if (num) num.innerText = `${dustyCount || 80}개`;
                
                elDusty.parentElement.style.cursor = "pointer";
                elDusty.parentElement.title = "잠든 생각 파편 깨우러 타래장으로 점프";
                elDusty.parentElement.onclick = () => { window.location.href = "vault.html"; };
            }
        } catch (e) {
            console.error("📊 하단 메트릭 서킷 바인딩 실패:", e.message);
        }
    }

    // 🏷️ [기상도 태그]: 배지 렌더링 및 순간이동 터널 결속
    function renderTagBadge(tag) {
        if (!tagCloudContainer) return;
        const badge = document.createElement("span");
        badge.style.cssText = "padding: 0.25rem 0.75rem; background: rgba(74,111,165,0.08); border-radius: 20px; font-size: 1rem; color: var(--accent-color); margin: 2px; display: inline-block; cursor: pointer; transition: all 0.2s; font-weight: 500;";
        badge.innerText = `#${tag}`;
        
        // 🚨 누락되었던 크리티컬 클릭 이벤트 리스너 영구 각인
        badge.addEventListener("click", () => {
            sessionStorage.setItem("vault_filter_tag", tag);
            window.location.href = "vault.html";
        });
        
        tagCloudContainer.appendChild(badge);
    }

    // 📥 [데이터 코어 수집선]
    async function loadSavedThoughts() {
        try {
            const result = typeof TaraeStorage !== 'undefined' ? await TaraeStorage.getThoughts() : { data: [] };
            const data = (result && result.data) ? result.data : [];

            await updateDynamicMetrics(data);

            if (data.length > 0) {
                // 1. 기상도 태그 클라우드 추출 및 재생산
                if (tagCloudContainer) {
                    tagCloudContainer.innerHTML = "";
                    const uniqueTags = new Set();
                    data.forEach(t => {
                        if (t.tags && Array.isArray(t.tags)) {
                            t.tags.forEach(tag => {
                                const clean = tag.replace('#', '').trim();
                                if (clean) uniqueTags.add(clean);
                            });
                        }
                    });
                    Array.from(uniqueTags).slice(0, 15).forEach(tag => renderTagBadge(tag));
                }

                // 2. 오늘의 실마리 텍스트 셔플 분산
                const randomThought = data[Math.floor(Math.random() * data.length)];
                if (placeholderText) {
                    placeholderText.innerText = `💡 과거의 사유 추출: "${randomThought.content.substring(0, 38)}..." 기저에 흐르는 제1원리를 재조합해보세요.`;
                }
                if (sparkBox) {
                    sparkBox.innerText = `"${randomThought.content}" — 과거의 원일 님이 남긴 사유입니다.`;
                }
            }
        } catch (err) {
            console.error("🚨 loadSavedThoughts 기동 정지:", err.message);
        }
    }

    // 🎯 [이어서 생각하기]: 벼락 맞춤형 버튼 색출 및 랙 점프대 결속
    function bindResonanceCircuit() {
        const buttons = Array.from(document.querySelectorAll("button"));
        const resonanceBtn = buttons.find(b => b.textContent.includes("이어서 생각하기") || b.textContent.includes("사유의 지평")) || (sparkBox ? sparkBox.parentElement.querySelector("button") : null);

        if (resonanceBtn) {
            console.log("✓ 메인 배선 [이어서 생각하기] 버튼 검거 완공 및 인터랙션 배선 결속");
            resonanceBtn.onclick = () => {
                resonanceBtn.disabled = true;
                resonanceBtn.innerText = "사유의 공간(베틀)으로 이동 중...";
                window.location.href = "loom.html";
            };
        }
    }

    // 🚀 [낙관적 UI 던지기 시퀀스 복구]
    async function processThought() {
        const thoughtValue = thoughtInput.value.trim();
        if (!thoughtValue) return;

        // 0ms 레이싱 피드백 발화
        showInstantToast("🧵 사유 파편 포획 완료! 백그라운드 실시간 처리 가동");
        
        // 낙관적 태그 즉시 주입
        if (tagCloudContainer) {
            const tempBadge = document.createElement("span");
            tempBadge.style.cssText = "padding: 0.25rem 0.75rem; background: rgba(230,126,34,0.1); border-radius: 20px; font-size: 1rem; color: #e67e22; margin: 2px; display: inline-block; border: 1px dashed #e67e22;";
            tempBadge.innerText = "#실시간추적";
            tagCloudContainer.insertBefore(tempBadge, tagCloudContainer.firstChild);
        }

        thoughtInput.value = ""; // 즉시 입력창 전면 세척

        try {
            if (typeof TaraeStorage !== 'undefined') {
                await TaraeStorage.saveThought(thoughtValue, ["실시간추적", "새로운사유"], "포획된 사유가 클라우드 기지에 기록되었습니다.");
            }

            // 백그라운드 서버 비동기 분류 위임 (실제 메인 루프 속도를 방해하지 않음)
            fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: thoughtValue })
            }).then(async (res) => {
                if (res.ok) console.log("🤖 백그라운드 AI 인과율 분류 완공");
            }).catch(() => {});

            // 카운트 리사이클 동기화
            await loadSavedThoughts();

        } catch (error) {
            console.error("🚨 던지기 인프라 과부하 백업 수납:", error);
        }
    }

    // ⚡ 엔진 초기화 격발
    if (typeof TaraeStorage !== 'undefined') {
        TaraeStorage.init().then(async () => {
            await loadSavedThoughts();
            bindResonanceCircuit(); // 비동기 데이터 셋업 완료 후 버튼 클릭 회로 최종 도킹
        });
    }

    if (submitBtn && thoughtInput) {
        submitBtn.addEventListener("click", processThought);
        thoughtInput.addEventListener("keypress", (e) => { if (e.key === "Enter") processThought(); });
    }
});