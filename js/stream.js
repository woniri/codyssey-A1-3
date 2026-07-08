/* js/stream.js 내부의 processThought 함수 레이어 보완 */
async function processThought() {
    const thoughtValue = thoughtInput.value.trim();
    if (!thoughtValue) return;

    submitBtn.disabled = true;
    thoughtInput.disabled = true;

    // 🕒 [체감 지연 해소 서킷]: 멍하니 기다리게 하지 않고 인지적 흐름을 실시간 배달
    let progressStep = 0;
    const progressInterval = setInterval(() => {
        const steps = [
            "🔮 사유 파편의 제1원리를 해체하는 중...",
            "📐 4대 전문가 패널(창의적 파괴자 등) 소환 중...",
            "⛓️ 과거 지식 은하계와의 인과율 플롯 연결 고리 탐색 중...",
            "🧵 생각의 실가닥을 잣아내어 베틀 세포에 안착시키는 중..."
        ];
        placeholderText.innerText = steps[progressStep % steps.length];
        progressStep++;
    }, 800); // 0.8초마다 단계별로 문구를 동적으로 전환하여 뇌의 지루함 차단

    try {
        const response = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: thoughtValue }) 
        });

        clearInterval(progressInterval); // 응답 오면 타이머 즉시 폭파

        if (!response.ok) throw new Error("통신 실패");
        const data = await response.json();

        placeholderText.innerText = data.comfort; 
        targetResonanceThought = thoughtValue;

        renderTagCloudBadge(data.tags[0] || "생각");
        await TaraeStorage.saveThought(thoughtValue, data.tags, data.comfort);

        const result = await TaraeStorage.getThoughts();
        if (result && result.data) await loadSavedThoughts();

        thoughtInput.value = "";
    } catch (error) {
        clearInterval(progressInterval);
        placeholderText.innerText = "⚠️ 인프라 가부하로 안전 사유 모드로 수납되었습니다.";
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        thoughtInput.disabled = false;
    }
}