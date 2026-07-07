/* js/storage.js */

const TaraeStorage = {
    supabaseClient: null,
    initPromise: null,

    // [핵심 방어] 웹앱이 켜지자마자 환경 변수를 가져오는 초기화 프로세스 가동
    init() {
        if (!this.initPromise) {
            this.initPromise = fetch('/api/config')
                .then(res => {
                    if (!res.ok) throw new Error("인프라 설정 키를 불러오지 못했습니다.");
                    return res.json(); // 💡 fetch 응답 메서드는 소문자 json()이 맞습니다.
                })
                .then(config => {
                    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
                        throw new Error("Supabase 환경 변수가 비어있습니다. Vercel 설정을 확인하세요.");
                    }
                    // 글로벌 supabase 객체를 사용해 클라이언트 생성
                    this.supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
                    console.log("▲ Tarae 인프라 엔진: Supabase 연동 완료");
                })
                .catch(err => {
                    console.error("▲ Tarae 인프라 에러:", err.message);
                });
        }
        return this.initPromise;
    },

    // [보안 가드] Supabase 인스턴스가 호출될 때, 초기화가 끝났는지 보장하는 안전장치
    async getClient() {
        await this.init(); // 초기화 완료될 때까지 얌전하게 기다림 (레이스 컨디션 방지)
        if (!this.supabaseClient) {
            alert("서버 연결이 불안정합니다. 잠시 후 새로고침 해주세요.");
            return null;
        }
        return this.supabaseClient;
    },

    // 1. 회원가입 및 데모 로그인 통합 처리
    async signUpOrLogin(email, password, isSignUp = false) {
        const client = await this.getClient();
        if (!client) return { error: "인프라 연결 실패" };

        try {
            if (isSignUp) {
                // 회원가입 프로세스
                const { data, error } = await client.auth.signUp({ email, password });
                if (error) throw error;
                return { data, error: null };
            } else {
                // 로그인 프로세스
                const { data, error } = await client.auth.signInWithPassword({ email, password });
                if (error) throw error;
                return { data, error: null };
            }
        } catch (err) {
            console.error("인증 에러:", err.message);
            return { data: null, error: err.message };
        }
    },

    // 2. 현재 로그인한 유저의 고유 ID 추출
    async getUserId() {
        const client = await this.getClient();
        if (!client) return null;
        const { data : { session } } = await client.auth.getSession();
        return session ? session.user.id : null;
    },

    // 3. 생각 파편 긁어오기
    async getThoughts() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [] };

        return await client.table("thoughts")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .execute();
    },

    // 4. 프로젝트 목록 긁어오기
    async getProjects() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [] };

        return await client.table("projects")
            .select("*")
            .eq("user_id", uid)
            .order("updated_at", { ascending: false })
            .execute();
    }
};

// 스크립트가 로드되자마자 배경에서 백엔드 키 가져오기 선제 시작
TaraeStorage.init();