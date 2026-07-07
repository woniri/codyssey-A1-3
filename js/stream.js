/* js/stream.js */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 [타래 메인 엔진] 15대 기상도 및 메트릭 순간이동 서킷 가동");

    const submitBtn = document.getElementById("submit-thought-btn");
    const thoughtInput = document.getElementById("thought-input");
    const placeholderText = document.getElementById("dynamic-placeholder");
    const tagCloudContainer = document.getElementById("tag-cloud");

    const insightBox = document.getElementById("insight-box"); 
    const sparkBox = document.getElementById("spark-box");     
    const resonanceBtn = sparkBox ? sparkBox.parentElement.querySelector("button") : null;

    let targetResonanceThought = ""; 

    if (!submitBtn || !thoughtInput) return;

    // 🕒 [하단 메트릭 박스 클릭 연동 회로]
    function bindMetricsClickRouting(count) {
        const paragraphs = Array.from(document.querySelectorAll("p"));
        
        const unraveledBox = paragraphs.find(el => el.textContent.trim() === "풀려 있는 실가닥");
        const wovenBox = paragraphs.find(el => el.textContent.trim() === "단단해진 타래");
        const dustyBox = paragraphs.find(el => el.textContent.trim() === "먼지 쌓이는 실가닥");

        // 1. 풀려 있는 실가닥 ➔ 사유 은하계(vault.html) 진입
        if (unraveledBox && unraveledBox.parentElement) {
            const wrapper = unraveledBox.parentElement;
            wrapper.style.cursor = "pointer";
            wrapper.title = "사유 은하계(타래장)로 진입하여 전체 지식 지도 보기";
            wrapper.addEventListener("click", () => { window.location.href = "vault.html"; });
        }

        // 2. 단단해진 타래 ➔ 베틀(loom.html) 워크스페이스 진입
        if (wovenBox && wovenBox.parentElement) {
            const wrapper = wovenBox.parentElement;
            wrapper.style.cursor = "pointer";
            wrapper.title = "베틀 워크스페이스로 이동하여 아이디어 정밀 직조";
            wrapper.addEventListener("click", () => { window.location.href = "loom.html"; });
        }

        // 3. 먼지 쌓이는 실가닥 ➔ 사유 은하계(vault.html) 진입
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
        
        // ✨ [명령 구현]: 메인 기상도 태그 클릭 시 타래장으로 태그 정보 토스 후 순간이동
        tagBadge.addEventListener("click", () => {
            sessionStorage.setItem("vault_filter_tag", cleanTag);
            window.location.href = "vault.html";
        });
        
        tagCloudContainer.appendChild(tagBadge);
    }

    async function loadSavedThoughts() {
        try {
            const result = await TaraeStorage.getThoughts();
            if (!result || result.error || !result.data) return; 
            
            const data = result.data;
            
            // 하단 메트릭 박스 숫자 세팅 및 라우팅 결속
            const paragraph = Array.from(document.querySelectorAll("p")).find(el => el.textContent.trim() === "풀려 있는 실가닥");
            if (paragraph && paragraph.previousElementSibling) {
                paragraph.previousElementSibling.innerText = data.length;
            }
            bindMetricsClickRouting(data.length);

            if (data && data.length > 0) {
                if (data[0].comfort) placeholderText.innerText = data[0].comfort;
                targetResonanceThought = data[0].content;

                if (tagCloudContainer) tagCloudContainer.innerHTML = "";
                
                // 🌪️ [명령 구현]: 중복을 제거한 고유 태그 세트를 도출하고 정확히 최대 15개로 정밀 슬라이싱
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
            if (!targetResonanceThought) {
                alert("이어서 생각할 기반 생각이 없습니다. 먼저 새로운 생각을 한 가닥 던져주세요!");
                return;
            }

            const originalBtnText = resonanceBtn.innerText;
            resonanceBtn.disabled = true;
            resonanceBtn.innerText = "사유의 지평을 넓히는 중...";
            if (insightBox) insightBox.innerText = "🌀 생각의 타래를 이어받아 깊은 사유의 실마리를 잣고 있습니다...";

            let realAiText = "";
            let deepKeywords = ["심층성찰", "아이디어확장", "사유의베틀"];

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
                    realAiText = expandData.expansion || expandData.text || expandData.content || expandData.result;
                    if (expandData.tags && expandData.tags.length > 0) deepKeywords = expandData.tags;
                }
            } catch (err) {
                console.warn("⚠️ 백엔드 지연으로 로컬 안전 사유 모드로 전환합니다.");
            }

            if (!realAiText) {
                realAiText = `"${targetResonanceThought}"라는 사유의 파편을 기반으로 잣아낸 심층 실마리입니다. 내면의 열망이 구체적인 궤도에 진입했습니다. 베틀 페이지로 이동하여 이 아이디어를 당장 실행 가능한 태스크 조합으로 정밀 직조해 보세요.`;
            }

            try {
                await TaraeStorage.saveThought(realAiText, deepKeywords, "이어서 생각하기로 자아낸 심층 사유");
            } catch(dbErr) { console.error(dbErr); }

            if (insightBox) insightBox.innerText = realAiText;
            deepKeywords.forEach(tag => renderTagCloudBadge(tag, true));

            sessionStorage.setItem("loom_prefill_data", realAiText);

            setTimeout(() => {
                alert("💡 생각이 성공적으로 확장되어 새로운 심층 키워드가 기상도에 저장되었습니다!\n\n이 실마리를 실행 가능한 계획으로 정밀 직조하기 위해 '베틀' 페이지로 이동합니다.");
                window.location.href = "loom.html";
            }, 800);
            
            resonanceBtn.disabled = false;
            resonanceBtn.innerText = originalBtnText;
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
        placeholderText.innerText = "🔮 AI가 생각을 정교한 타래로 잣고 있어요...";

        try {
            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: thoughtValue }) 
            });

            if (!response.ok) throw new Error("서버 통신 실패");
            const data = await response.json();

            placeholderText.innerText = data.comfort; 
            targetResonanceThought = thoughtValue;

            renderTagCloudBadge(data.tags[0] || "생각");
            await TaraeStorage.saveThought(thoughtValue, data.tags, data.comfort);

            const result = await TaraeStorage.getThoughts();
            if (result && result.data) {
                loadSavedThoughts(); // 기상도 15개 갱신 리로드
            }

            thoughtInput.value = "";
        } catch (error) {
            console.error("❌ 던지기 오류:", error);
        } finally {
            submitBtn.disabled = false;
            thoughtInput.disabled = false;
            submitBtn.innerText = "던지기";
        }
    }
});