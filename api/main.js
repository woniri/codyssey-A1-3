/* js/main.js */

document.addEventListener("DOMContentLoaded", () => {
    // Auth 세션이 완전히 복구된 후 데이터 로드 프로세스 실행
    setTimeout(loadDashboardMetrics, 600);
});

async function loadDashboardMetrics() {
    const uid = await TaraeStorage.getUserId();
    if (!uid) return;

    // 1. 실제 생각 파편 및 프로젝트 데이터 긁어오기
    const { data: thoughts } = await TaraeStorage.getThoughts();
    const { data: projects } = await TaraeStorage.getProjects();

    const totalThoughts = thoughts ? thoughts.length : 0;
    const totalProjects = projects ? projects.length : 0;

    // 2. 메트릭 카운트 화면 동적 갱신 (더미 데이터 제거)
    const pendingCount = thoughts ? thoughts.filter(t => !t.project_id).length : 0;
    
    // DOM 요소 매핑 및 렌더링
    const metricsContainer = document.querySelectorAll(".main-container section.card:last-of-type span");
    if (metricsContainer.length === 3) {
        metricsContainer[0].innerText = pendingCount; // 풀려 있는 실가닥
        metricsContainer[1].innerText = totalProjects; // 단단해진 타래
        // 업데이트가 2주 이상 멈춘 생각 카운트 (임시 계산 로직)
        metricsContainer[2].innerText = thoughts ? thoughts.filter(t => new Date() - new Date(t.created_at) > 14*24*60*60*1000).length : 0;
    }

    // 3. 실제 내 머릿속 기상도 태그 클라우드 동적 빌드
    const tagCloud = document.getElementById("tag-cloud");
    if (tagCloud && thoughts) {
        tagCloud.innerHTML = "";
        const allTags = [];
        thoughts.forEach(t => { if(t.tags) allTags.push(...t.tags); });
        
        // 중복 제거 후 상위 4개 추출
        const uniqueTags = [...new Set(allTags)].slice(0, 4);
        if (uniqueTags.length === 0) {
            tagCloud.innerHTML = "<span style='color:var(--text-muted); font-size:0.9rem;'>아직 정돈된 태그가 없습니다. 생각을 던져보세요!</span>";
        }
        uniqueTags.forEach(tag => {
            const badge = document.createElement("span");
            badge.style.cssText = "padding: 0.25rem 0.75rem; background: rgba(74,111,165,0.1); border-radius: 20px; font-size: 1rem; color: var(--accent-color); font-weight: 500;";
            badge.innerText = `#${tag}`;
            tagCloud.appendChild(badge);
        });
    }
}