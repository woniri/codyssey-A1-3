/* js/storage.js */

let _supabase = null;

const TaraeStorage = {
    // 앱 시작 시 백엔드로부터 안전하게 환경 변수를 받아와서 초기화
    async init() {
        if (_supabase) return; // 이미 초기화됐다면 패스
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
                throw new Error("Vercel 환경 변수(SUPABASE_URL, SUPABASE_ANON_KEY)가 설정되지 않았습니다.");
            }
            
            _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        } catch (error) {
            console.error("💡 타래 보안 가드: 데이터베이스 초기화 실패 ->", error);
        }
    },

    async signUp(email, password) {
        await this.init();
        return await _supabase.auth.signUp({ email, password });
    },

    async signIn(email, password) {
        await this.init();
        return await _supabase.auth.signInWithPassword({ email, password });
    },

    async signOut() {
        await this.init();
        return await _supabase.auth.signOut();
    },

    async getSession() {
        await this.init();
        const { data: { session } } = await _supabase.auth.getSession();
        return session;
    },

    async getUserId() {
        await this.init();
        const session = await this.getSession();
        return session ? session.user.id : null;
    }
};