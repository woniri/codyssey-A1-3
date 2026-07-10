/* js/app.js */

// 📲 PWA: 서비스워커 등록 (홈화면에 추가/설치 가능하게 하는 최소 조건)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.error('서비스워커 등록 실패:', err);
        });
    });
}

// 📲 PWA 설치 유도 배너 (이미 설치됐거나, 사용자가 닫은 적 있으면 다시 안 보여줌)
let deferredInstallPrompt = null;

function isRunningStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function showInstallBanner(mode) {
    if (isRunningStandalone()) return;
    if (localStorage.getItem('tarae-install-banner-dismissed') === 'true') return;
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
        position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%);
        max-width: 90vw; width: 380px; background: var(--card-bg); border: 1px solid var(--border-color);
        border-radius: 12px; padding: 0.9rem 1rem; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        z-index: 500; display: flex; align-items: center; gap: 0.8rem;
    `;

    const message = mode === 'ios'
        ? '🧵 홈 화면에 추가하면 앱처럼 빠르게 쓸 수 있어요. 공유 버튼 → "홈 화면에 추가"를 눌러보세요.'
        : '🧵 타래를 홈 화면에 추가하고 앱처럼 빠르게 열어보세요.';

    banner.innerHTML = `
        <span style="flex:1; font-size:0.85rem; color:var(--text-color);">${message}</span>
        ${mode === 'prompt' ? '<button id="pwa-install-btn" style="padding:0.4rem 0.8rem; background:var(--accent-color); color:white; border:none; border-radius:6px; font-size:0.8rem; cursor:pointer; white-space:nowrap;">설치</button>' : ''}
        <button id="pwa-dismiss-btn" style="background:none; border:none; color:var(--text-muted); font-size:1rem; cursor:pointer; padding:0 0.2rem;">✕</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        localStorage.setItem('tarae-install-banner-dismissed', 'true');
        banner.remove();
    });

    if (mode === 'prompt') {
        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            banner.remove();
        });
    }
}

// Android/데스크톱 Chrome 등: 브라우저가 설치 가능하다고 알려주면 버튼 노출
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner('prompt');
});

// iOS Safari: beforeinstallprompt 미지원이라 수동 안내만 노출
const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
if (isIOS && !isRunningStandalone()) {
    setTimeout(() => showInstallBanner('ios'), 1500);
}

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

            <div id="auth-login-zone">
                <input type="email" id="auth-email" placeholder="이메일 주소" style="width:100%; padding:0.8rem; margin-bottom:0.5rem; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-color); color:var(--text-color);">
                <input type="password" id="auth-password" placeholder="비밀번호" style="width:100%; padding:0.8rem; margin-bottom:0.5rem; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-color); color:var(--text-color);">
                <div style="text-align:right; margin-bottom:1rem;">
                    <a href="#" id="link-forgot-password" style="font-size:0.8rem; color:var(--text-muted);">비밀번호를 잊으셨나요?</a>
                </div>
                <button id="btn-login" style="width:100%; padding:0.8rem; background:var(--accent-color); color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:0.5rem;">로그인</button>
                <button id="btn-signup" style="width:100%; padding:0.8rem; background:none; border:1px solid var(--border-color); color:var(--text-color); border-radius:6px; cursor:pointer; font-size:0.85rem;">데모 계정 가입하기</button>
            </div>

            <div id="auth-reset-zone" style="display:none;">
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">가입하신 이메일로 비밀번호 재설정 링크를 보내드릴게요.</p>
                <input type="email" id="reset-email" placeholder="이메일 주소" style="width:100%; padding:0.8rem; margin-bottom:1rem; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-color); color:var(--text-color);">
                <button id="btn-send-reset" style="width:100%; padding:0.8rem; background:var(--accent-color); color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:0.5rem;">재설정 링크 보내기</button>
                <button id="btn-back-to-login" style="width:100%; padding:0.8rem; background:none; border:1px solid var(--border-color); color:var(--text-color); border-radius:6px; cursor:pointer; font-size:0.85rem;">로그인으로 돌아가기</button>
            </div>

            <p id="auth-error" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem; display:none;"></p>
            <p id="auth-success" style="color:#2ecc71; font-size:0.85rem; margin-top:0.5rem; display:none;"></p>
        </div>
    `;

    document.body.appendChild(overlay);

    const emailInput = document.getElementById('auth-email');
    const cryptoInput = document.getElementById('auth-password');
    const errBox = document.getElementById('auth-error');
    const successBox = document.getElementById('auth-success');

    // 🔑 비밀번호 찾기 화면 전환
    document.getElementById('link-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('auth-login-zone').style.display = 'none';
        document.getElementById('auth-reset-zone').style.display = 'block';
        errBox.style.display = 'none';
        successBox.style.display = 'none';
        document.getElementById('reset-email').value = emailInput.value;
    });

    document.getElementById('btn-back-to-login').addEventListener('click', () => {
        document.getElementById('auth-reset-zone').style.display = 'none';
        document.getElementById('auth-login-zone').style.display = 'block';
        errBox.style.display = 'none';
        successBox.style.display = 'none';
    });

    document.getElementById('btn-send-reset').addEventListener('click', async () => {
        const resetEmail = document.getElementById('reset-email').value;
        const btn = document.getElementById('btn-send-reset');
        btn.disabled = true;
        btn.innerText = "발송 중...";

        const { error } = await TaraeStorage.sendPasswordReset(resetEmail);

        btn.disabled = false;
        btn.innerText = "재설정 링크 보내기";

        if (error) {
            errBox.innerText = "발송 실패: " + error.message;
            errBox.style.display = 'block';
            successBox.style.display = 'none';
        } else {
            successBox.innerText = "📩 재설정 링크를 보냈어요. 메일함을 확인해주세요.";
            successBox.style.display = 'block';
            errBox.style.display = 'none';
        }
    });

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