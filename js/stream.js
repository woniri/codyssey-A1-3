/* js/stream.js */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 [타래 메인 엔진] 15대 기상도 & 실시간 3대 메트릭 동적 바인딩 가동");

    const submitBtn = document.getElementById("submit-thought-btn");
    const thoughtInput = document.getElementById("thought-input");
    const placeholderText = document.getElementById("dynamic-placeholder");
    const tagCloudContainer = document.getElementById("tag-cloud");

    const insightBox = document.getElementById("insight-box"); 
    const sparkBox = document.getElementById("spark-box");     
    const resonanceBtn = sparkBox ? sparkBox.parentElement.querySelector("button") : null;

    let targetResonanceThought = ""; 

    if (!submitBtn || !thoughtInput) return;

    // 🕒 [하단 메트릭 박스 클릭 연동 및 마우스 포인터 활성화 회로]
    function bindMetricsClickRouting() {
        const paragraphs = Array.from(document.querySelectorAll("p"));
        
        const unraveledBox = paragraphs.find(el => el.textContent.trim() === "풀려 있는 실가닥");
        const wovenBox = paragraphs.find(el => el.textContent.trim() === "단단해진 타래");
        const dustyBox = paragraphs.find(el => el.textContent.trim() === "먼지 쌓이는 실가닥");

        if (unraveledBox && unraveledBox.parentElement) {
            const wrapper = unraveledBox.parentElement;
            wrapper.style.cursor = "pointer";
            wrapper.title = "사유 은하계(타래장)로 진입하여 전체 지식 지도 보기";
            wrapper.addEventListener("click", () => { window.location.href = "vault.html"; });
        }

        if (wovenBox && wovenBox.parentElement) {
            const wrapper = wovenBox.parentElement;
            wrapper.style.cursor = "pointer";
            wrapper.title = "베틀 워크스페이스로 이동하여 아이디어 정밀 직조";
            wrapper.addEventListener("click", () => { window.location.href = "loom.html"; });
        }

        if (dustyBox && dustyBox.parentElement) {
            const wrapper = dustyBox.parentElement;
            wrapper.style.cursor = "pointer";
            wrapper.title = "사유 은하계로 이동하여 잠든 생각 파편 깨우기";
            wrapper.addEventListener("click", () => { window.location.href = "vault.html"; });
        }
    }

    // 🏷️ [기상도 태그 생성 및 타래장 순간이동 점프대]
    function renderTagCloudBadge(tag, isDeep = false) {
        if (!tagCloudContainer) return;
        const tagBadge = document.createElement("span");
        const cleanTag = tag.replace('#', '').trim();
        
        if (isDeep) {
            tagBadge.style.cssText = "padding: 0.25rem 0.75rem; background: linear-gradient(135deg, rgba(74,111,165,0.15), rgba(230,126,34,0.15)); border: 1px dashed var(--accent-color); border-radius: 20px; font-size: 1rem; color: var(--accent-color); font-weight: bold; margin: 2px; display: inline-block; cursor: pointer;";
        } else {
            tagBadge.style.cssText = "padding: 0.25rem 0.75rem; background: rgba(74,111,165,0.1); border-radius: 20px; font-size: 1rem; color: var(--accent-color); font-weight: 500; margin: 2px; display: inline-block; cursor: pointer;";
        }
        
        tagBadge.innerText = `#${cleanTag}`;
        
        tagBadge.addEventListener("click", () => {
            sessionStorage.setItem("vault_filter_tag", cleanTag);
            window.location.href = "vault.html";
        });
        
        tagCloudContainer.appendChild(tagBadge);
    }

    // ⚡ [핵심 수정본]: 하단 3대 메트릭 실시간 백엔드 카운팅 연산기
    async function updateDynamicMetrics(allThoughtsData) {
        try {
            const client = await TaraeStorage.getClient();
            const paragraphs = Array.from(document.querySelectorAll("p"));

            // 1. 풀려 있는 실가닥 = thoughts 테이블의 총 로우 수 (28개)
            const pUnraveled = paragraphs.find(el => el.textContent.trim() === "풀려 있는 실가닥");
            if (pUnraveled && pUnraveled.previousElementSibling) {
                pUnraveled.previousElementSibling.innerText = `${allThoughtsData.length}개`;
            }

            // 2. 단단해진 타래 = projects 테이블에 누적된 총 기획서 수 (1개)
            const pWoven = paragraphs.find(el => el.textContent.trim() === "단단해진 타래");
            if (pWoven && pWoven.previousElementSibling) {
                const { data: projData } = await client.from("projects").select("id");
                const projCount = projData ? projData.length : 0;
                pWoven.previousElementSibling.innerText = `${projCount}개`;
            }

            // 3. 먼지 쌓이는 실가닥 = 생성된 지 7일 이상 지난 생각들의 총합 (25개)
            const pDusty = paragraphs.find(el => el.textContent.trim() === "먼지 쌓이는 실가닥");
            if (pDusty && pDusty.previousElementSibling) {
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                
                // 7일 전보다 이전에 생성된 구버전 파편 필터링
                const dustyCount = allThoughtsData.filter(t => new Date(t.created_at) < sevenDaysAgo).length;
                pDusty.previousElementSibling.innerText = `${dustyCount}개`;
            }

            // 클릭 라우팅 서킷 결속
            bindMetricsClickRouting();

        } catch (metricErr) {
            console.error("메트릭 실시간 집계 붕괴:", metricErr.message);
        }
    }

    async function loadSavedThoughts() {
        try {
            const result = await TaraeStorage.getThoughts();
            if (!result || result.error || !result.data) return; 
            
            const data = result.data;
            
            // 🔥 실시간 삼원 동적 메트릭 가동 격발
            await updateDynamicMetrics(data);

            if (data && data.length > 0) {
                if (data[0].comfort) placeholderText.innerText = data[0].comfort;
                targetResonanceThought = data[0].content;

                if (tagCloudContainer) tagCloudContainer.innerHTML = "";
                
                // 중복 제거 후 딱 15개 상위 기상도 슬라이싱
                const uniqueTags = new Set();
                data.forEach(thought => {
                    if (thought.tags && Array.isArray(thought.tags)) {
                        thought.tags.forEach(t => {
                            const clean = t.replace('#', '').trim();
                            if (clean) uniqueTags.add(clean);
                        });
                    }
                });

                const fifteenTags = Array.from(uniqueTags).slice(0, 15);
                fifteenTags.forEach(tag => renderTagCloudBadge(tag, false));

                if (data.length > 1 && sparkBox) {
                    const pastThoughts = data.slice(1);
                    const randomPast = pastThoughts[Math.floor(Math.random() * pastThoughts.length)];
                    sparkBox.innerText = `"${randomPast.content}" — 과거의 원일 님이 남긴 생각입니다.`;
                    targetResonanceThought = randomPast.content; 
                }
            }
        } catch (err) {
            console.error("초기 적재 오류:", err.message);
        }
    }

    if (resonanceBtn) {
        resonanceBtn.addEventListener("click", async () => {
            if (!targetResonanceThought) return;

            const originalBtnText = resonanceBtn.innerText;
            resonanceBtn.disabled = true;
            resonanceBtn.innerText = "사유의 지평을 넓히는 중...";
            if (insightBox) insightBox.innerText = "🌀 생각의 타래를 이어받아 깊은 사유의 실마리를 잣고 있습니다...";

            let realAiText = "";
            let deepKeywords = ["심층성찰", "아이디어확장"];

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const response = await fetch("/api/expand", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: targetResonanceThought }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const expandData = await response.json();
                    realAiText = expandData.expansion || expandData.text || expandData.content;
                    if (expandData.tags) deepKeywords = expandData.tags;
                }
            } catch (err) { console.warn("Fallback 전향"); }

            if (!realAiText) {
                realAiText = `"${targetResonanceThought}" 파편 기반 확장 실마리입니다.`;
            }

            try {
                await TaraeStorage.saveThought(realAiText, deepKeywords, "이어서 생각하기 문구");
            } catch(dbErr) { console.error(dbErr); }

            window.location.href = "loom.html";
        });
    }

    TaraeStorage.init().then(() => { loadSavedThoughts(); });

    submitBtn.addEventListener("click", processThought);
    thoughtInput.addEventListener("keypress", (e) => { if (e.key === "Enter") processThought(); });

    async function processThought() {
        const thoughtValue = thoughtInput.value.trim();
        if (!thoughtValue) return;

        submitBtn.disabled = true;
        thoughtInput.disabled = true;

        try {
            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: thoughtValue }) 
            });

            if (!response.ok) throw new Error("통신 실패");
            const data = await response.json();

            await TaraeStorage.saveThought(thoughtValue, data.tags, data.comfort);
            loadSavedThoughts(); // 메트릭 및 기상도 전면 동기화 리사이클

            thoughtInput.value = "";
        } catch (error) { console.error(error); }
        finally {
            submitBtn.disabled = false;
            thoughtInput.disabled = false;
        }
    }
});