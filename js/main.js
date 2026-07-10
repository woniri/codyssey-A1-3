/* js/main.js */

document.addEventListener("DOMContentLoaded", () => {
    // Auth 세션이 완전히 복구된 후 데이터 로드 프로세스 실행
    setTimeout(loadDashboardMetrics, 600);
});

async function loadDashboardMetrics() {
    const uid = await TaraeStorage.getUserId();
    if (!uid) return;

    // 1. 실제 생각 파편 및 프로젝트 데이터 긁어오기
    const { data: thoughtsRaw } = await TaraeStorage.getThoughts();
    const { data: projectsRaw } = await TaraeStorage.getProjects();
    const thoughts = thoughtsRaw || [];
    const projects = projectsRaw || [];

    const pendingThoughts = thoughts.filter(t => !t.project_id);
    const staleThoughts = thoughts.filter(t => (new Date() - new Date(t.created_at)) > 14 * 24 * 60 * 60 * 1000);

    // 2. 메트릭 카운트 화면 동적 갱신 + 각 메트릭 클릭 시 다른 페이지로 연결
    const metricsContainer = document.querySelectorAll(".main-container section.card:last-of-type span");
    const metricCards = document.querySelectorAll(".main-container section.card:last-of-type > div");

    if (metricsContainer.length === 3) {
        metricsContainer[0].innerText = pendingThoughts.length; // 풀려 있는 실가닥
        metricsContainer[1].innerText = projects.length;         // 단단해진 타래
        metricsContainer[2].innerText = staleThoughts.length;    // 먼지 쌓이는 실가닥
    }

    if (metricCards.length === 3) {
        // 풀려 있는 실가닥 → 베틀로 이동 (묶이지 않은 생각을 직조하러)
        metricCards[0].style.cursor = "pointer";
        metricCards[0].title = "베틀에서 풀려 있는 실가닥을 엮어보세요";
        metricCards[0].addEventListener("click", () => { location.href = "loom.html"; });

        // 단단해진 타래 → 타래장에서 프로젝트로 연결된 것만
        metricCards[1].style.cursor = "pointer";
        metricCards[1].title = "타래장에서 프로젝트로 엮인 생각만 보기";
        metricCards[1].addEventListener("click", () => {
            sessionStorage.setItem("vault_filter_type", "projects");
            location.href = "vault.html";
        });

        // 먼지 쌓이는 실가닥 → 타래장에서 오래된 것만
        metricCards[2].style.cursor = "pointer";
        metricCards[2].title = "타래장에서 오래 방치된 생각만 보기";
        metricCards[2].addEventListener("click", () => {
            sessionStorage.setItem("vault_filter_type", "stale");
            location.href = "vault.html";
        });
    }

    // 3. 내 머릿속 기상도: 태그 클라우드 (최대 15개, 빈도에 따라 크기·색, 클릭 시 타래장 연동)
    buildTagCloud(thoughts);

    // 4. 오늘의 실마리: daily_insights 테이블에서 캐시된 AI 인사이트 로드
    loadDailyInsight();

    // 5. 뜻밖의 공명: 과거 생각 하나를 무작위로 뽑아 보여주고, 클릭 시 타래장에서 바로 확인
    buildResonance(thoughts);

    // 6. 최근에 남긴 생각 5개: 방금 쓴 걸 바로 다시 확인할 수 있게
    buildRecentList(thoughts);
}

function buildRecentList(thoughts) {
    const listEl = document.getElementById("recent-thoughts-list");
    if (!listEl) return;

    if (!thoughts || thoughts.length === 0) {
        listEl.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">아직 기록된 생각이 없어요.</p>`;
        return;
    }

    const recent = [...thoughts]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    listEl.innerHTML = "";
    recent.forEach(t => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:baseline; gap:1rem; padding:0.5rem 0; border-bottom:1px solid var(--border-color); cursor:pointer;";
        const timeAgo = formatRelativeTime(t.created_at);
        row.innerHTML = `
            <span style="font-size:0.9rem; color:var(--text-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.content}</span>
            <span style="font-size:0.75rem; color:var(--text-muted); flex-shrink:0;">${timeAgo}</span>
        `;
        row.addEventListener("click", () => {
            sessionStorage.setItem("vault_focus_thought", String(t.id));
            location.href = "vault.html";
        });
        listEl.appendChild(row);
    });
}

function formatRelativeTime(dateStr) {
    const diffMs = new Date() - new Date(dateStr);
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}일 전`;
}

function buildTagCloud(thoughts) {
    const tagCloud = document.getElementById("tag-cloud");
    if (!tagCloud) return;
    tagCloud.innerHTML = "";

    const freq = {};
    thoughts.forEach(t => {
        if (!t.tags) return;
        t.tags.forEach(tag => {
            const clean = tag.replace('#', '').trim();
            if (!clean) return;
            freq[clean] = (freq[clean] || 0) + 1;
        });
    });

    const tagNames = Object.keys(freq);
    if (tagNames.length === 0) {
        tagCloud.innerHTML = "<span style='color:var(--text-muted); font-size:0.9rem;'>아직 정돈된 태그가 없습니다. 생각을 던져보세요!</span>";
        return;
    }

    const shuffled = [...tagNames];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, 15);
    const maxFreq = Math.max(...selected.map(tag => freq[tag]));

    selected.forEach(tag => {
        const ratio = freq[tag] / maxFreq; // 0~1, 중요도(빈도) 비율
        // 크기 차이는 아주 미세하게만 (0.85rem ~ 1.05rem) — 갑자기 확 커지는 느낌을 줄임
        const fontSize = (0.85 + ratio * 0.2).toFixed(2);
        // 중요도는 크기보다 배경 진하기와 글자 색으로 주로 표현
        const bgAlpha = (0.06 + ratio * 0.16).toFixed(2);
        const color = ratio > 0.66 ? 'var(--accent-color)' : (ratio > 0.33 ? '#6c8fc7' : 'var(--text-muted)');
        const fontWeight = ratio > 0.66 ? 600 : 500;

        const badge = document.createElement("span");
        badge.style.cssText = `padding: 0.3rem 0.8rem; background: rgba(74,111,165,${bgAlpha}); border-radius: 20px; font-size: ${fontSize}rem; color: ${color}; font-weight: ${fontWeight}; cursor: pointer;`;
        badge.innerText = `#${tag}`;
        badge.title = `${freq[tag]}개의 생각에 등장 · 클릭하면 타래장에서 모아보기`;
        badge.addEventListener("click", () => {
            sessionStorage.setItem("vault_filter_tag", tag);
            location.href = "vault.html";
        });
        tagCloud.appendChild(badge);
    });
}

async function loadDailyInsight() {
    const insightBox = document.getElementById("insight-box");
    if (!insightBox) return;

    const fallback = "🌙 아직 오늘의 실마리가 준비되지 않았어요. 생각을 몇 개 더 던져보면, 내일은 새로운 통찰을 만날 수 있을 거예요.";

    try {
        const { data, error } = await TaraeStorage.getDailyInsight();
        if (error || !data || !data.insight_text) {
            insightBox.innerText = fallback;
            return;
        }
        insightBox.innerText = data.insight_text;
    } catch (e) {
        insightBox.innerText = fallback;
    }
}

function buildResonance(thoughts) {
    const sparkBox = document.getElementById("spark-box");
    const sparkBtn = document.getElementById("spark-continue-btn");
    if (!sparkBox) return;

    if (!thoughts || thoughts.length === 0) {
        sparkBox.innerText = "🧵 아직 공명할 만한 지난 생각이 없어요. 첫 실마리를 던져보세요!";
        if (sparkBtn) sparkBtn.style.display = "none";
        return;
    }

    const picked = thoughts[Math.floor(Math.random() * thoughts.length)];
    const daysAgo = Math.max(1, Math.floor((new Date() - new Date(picked.created_at)) / (1000 * 60 * 60 * 24)));

    sparkBox.innerText = `"${picked.content}" — ${daysAgo}일 전의 생각입니다.`;

    if (sparkBtn) {
        sparkBtn.style.display = "inline-block";
        sparkBtn.onclick = () => {
            sessionStorage.setItem("vault_focus_thought", String(picked.id));
            location.href = "vault.html";
        };
    }
}
