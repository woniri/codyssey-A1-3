/* js/stream.js */

document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submit-thought-btn");
    const thoughtInput = document.getElementById("thought-input");
    const placeholderText = document.getElementById("dynamic-placeholder");
    const tagCloudContainer = document.getElementById("tag-cloud");

    if (!submitBtn || !thoughtInput) return;

    // 핵심 이벤트 바인딩
    submitBtn.addEventListener("click", processThought);
    thoughtInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") processThought();
    });

    async function processThought() {
        const thoughtValue = thoughtInput.value.trim();

        // [실패 처리 ①]: 빈 입력값 필터링 및 UX 가이드
        if (!thoughtValue) {
            alert("어떤 생각이라도 좋아요. 한 가닥의 단어나 문장을 적어주세요.");
            thoughtInput.focus();
            return;
        }

        // [UX 고도화 ③]: API 지연 상황 대응을 위한 로딩 UI 상태 전환
        submitBtn.disabled = true;
        thoughtInput.disabled = true;
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "엮는 중...";
        placeholderText.innerText = "🔮 AI가 생각을 정교한 타래로 잣고 있어요...";

        try {
            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: json.stringify({ thought: thoughtValue })
            });

            // [실패 처리 ④]: API 오류 (4xx, 5xx) 가동 대응
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "서버 통신에 실패했습니다.");
            }

            const data = await response.json();

            // 1. 플레이스홀더 영역에 AI의 감성 화두/공감 문구 렌더링
            placeholderText.innerText = data.prompt;

            // 2. 머릿속 기상도(태그 클라우드)에 동적 배지 추가
            // 실무 팁: 과제 요건(Supabase 반영)을 위해 데이터베이스 연동 전 프론트 우선 시각화
            data.tags.forEach(tag => {
                const tagBadge = document.createElement("span");
                tagBadge.style.cssText = `
                    padding: 0.25rem 0.75rem; 
                    background: rgba(74,111,165,0.1); 
                    border-radius: 20px; 
                    font-size: 0.95rem; 
                    color: var(--accent-color);
                    font-weight: 500;
                    animation: fadeIn 0.5s ease-in-out;
                `;
                tagBadge.innerText = tag.startsWith("#") ? tag : `#${tag}`;
                tagCloudContainer.prepend(tagBadge); // 최신 태그가 앞으로 오도록
            });

            // 입력창 초기화
            thoughtInput.value = "";

        } catch (error) {
            console.error("타래 스트리밍 에러:", error);
            alert(error.message || "잠시 후 다시 시도해 주세요.");
            placeholderText.innerText = "소중한 생각을 다시 적어 한 가닥 던져주세요.";
        } finally {
            // UI 복구
            submitBtn.disabled = false;
            thoughtInput.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    }
});