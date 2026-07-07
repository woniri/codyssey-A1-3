/* js/app.js */

document.addEventListener("DOMContentLoaded", async () => {
    // --- [1. 통합 다크모드 동기화 시스템] ---
    const toggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('tarae-theme');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (toggleBtn) toggleBtn.innerText = '☀️ 라이트 모드';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('tarae-theme', 'light');
                toggleBtn.innerText = '🌙 다크 모드';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('tarae-theme', 'dark');
                toggleBtn.innerText = '☀️ 라이트 모드';
            }
        });
    }

    // --- [2. 전역 Auth 세션 가드 시스템] ---
    const session = await TaraeStorage.getSession();
    
    if (!session) {
        // 세션이 없으면 강제로 인증 모달 오버레이 생성
        injectAuthModal();
    } else {
        // 네비게이션 바에 로그아웃 버튼 동적 추가
        injectLogoutButton();
    }
});

// 화면 전체를 덮는 깔끔한 로그인/회원가입 모달 UI 인젝트
function injectAuthModal() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: var(--bg-color); z-index: 9999; display: flex;
        justify-content: center; align-items: center; padding: 1rem;
    `;

    overlay.innerHTML = `
        <div class="card" style="width: 100%; max-width: 400px; text-align: center; border: 1px solid var(--border-color);">
            <h2 style="color: var(--accent-color); margin-bottom: 0.5rem;">🧵 타래 시작하기</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">흩어진 생각을 엮는 공간</p>
            
            <input type="email" id="auth-email" placeholder="이메일 주소" style="width:100%; padding:0.8rem; margin-bottom:0.5rem; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-color); color:var(--text-color);">
            <input type="password" id="auth-password" placeholder="비밀번호" style="width:100%; padding:0.8rem; margin-bottom:1rem; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-color); color:var(--text-color);">
            
            <button id="btn-login" style="width:100%; padding:0.8rem; background:var(--accent-color); color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:0.5rem;">로그인</button>
            <button id="btn-signup" style="width:100%; padding:0.8rem; background:none; border:1px solid var(--border-color); color:var(--text-color); border-radius:6px; cursor:pointer; font-size:0.85rem;">데모 계정 가입하기</button>
            <p id="auth-error" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem; display:none;"></p>
        </div>
    `;

    document.body.appendChild(overlay);

    const emailInput = document.getElementById('auth-email');
    const cryptoInput = document.getElementById('auth-password');
    const errBox = document.getElementById('auth-error');

    // 로그인 실행
    document.getElementById('btn-login').addEventListener('click', async () => {
        const { data, error } = await TaraeStorage.signIn(emailInput.value, cryptoInput.value);
        if (error) {
            errBox.innerText = "로그인 실패: " + error.message;
            errBox.style.display = 'block';
        } else {
            location.reload();
        }
    });

    // 회원가입 실행
    document.getElementById('btn-signup').addEventListener('click', async () => {
        const { data, error } = await TaraeStorage.signUp(emailInput.value, cryptoInput.value);
        if (error) {
            errBox.innerText = "회원가입 실패: " + error.message;
            errBox.style.display = 'block';
        } else {
            alert("가입 인증 이메일이 발송되었거나 즉시 가입되었습니다. 대시보드 설정을 확인하세요!");
            location.reload();
        }
    });
}

function injectLogoutButton() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item';
        logoutLi.innerHTML = `<a href="#" id="nav-logout" style="color: var(--text-muted);">로그아웃</a>`;
        navMenu.appendChild(logoutLi);

        document.getElementById('nav-logout').addEventListener('click', async (e) => {
            e.preventDefault();
            await TaraeStorage.signOut();
            location.reload();
        });
    }
}