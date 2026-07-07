/* js/storage.js */

// Supabase 클라이언트 인스턴스를 담을 전역 변수
let _supabase = null;

const TaraeStorage = {
    /**
     * [보안 가드] 앱 시작 시 백엔드 브릿지(/api/config)로부터 
     * 안전하게 환경 변수를 받아와서 Supabase SDK를 동적 초기화합니다.
     */
    async init() {
        if (_supabase) return; // 이미 초기화가 완료되었다면 중복 실행 방지
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
                throw new Error("Vercel 환경 변수(SUPABASE_URL, SUPABASE_ANON_KEY)가 세팅되지 않았습니다.");
            }
            
            // 안전하게 받아온 환경 변수로 Supabase 클라이언트 빌드
            _supabase = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        } catch (error) {
            console.error("💡 타래 인프라 가드: 데이터베이스 초기화 실패 ->", error);
        }
    },

    // ==========================================
    // 🔐 1. 사용자 인증 (Supabase Auth) 패키지
    // ==========================================

    // 회원가입
    async signUp(email, password) {
        await this.init();
        return await _supabase.auth.signUp({ email, password });
    },

    // 로그인
    async signIn(email, password) {
        await this.init();
        return await _supabase.auth.signInWithPassword({ email, password });
    },

    // 로그아웃
    async signOut() {
        await this.init();
        return await _supabase.auth.signOut();
    },

    // 현재 활성화된 세션 정보 조회
    async getSession() {
        await this.init();
        if (!_supabase) return null;
        const { data: { session } } = await _supabase.auth.getSession();
        return session;
    },

    // 로그인된 유저의 고유 UUID 추출 (RLS 데이터 격리용)
    async getUserId() {
        await this.init();
        const session = await this.getSession();
        return session ? session.user.id : null;
    },

    // ==========================================
    // 🧵 2. 베틀 작업장 (Projects) 비즈니스 로직
    // ==========================================

    // 제미나이가 구조화한 새 프로젝트와 할 일(Tasks)을 Supabase에 저장
    async insertProject(title, tasks, roadmap) {
        await this.init();
        const user_id = await this.getUserId();
        if (!user_id) return { data: null, error: new Error("인증 세션이 만료되었습니다. 로그인이 필요합니다.") };
        
        const { data, error } = await _supabase
            .from('projects')
            .insert([{ user_id, title, tasks, roadmap, status: 'weaving' }])
            .select();
        return { data, error };
    },

    // 현재 로그인한 사용자의 프로젝트 목록 최신순 정렬 조회
    async getProjects() {
        await this.init();
        const user_id = await this.getUserId();
        if (!user_id) return { data: null, error: new Error("인증 세션이 만료되었습니다. 로그인이 필요합니다.") };

        const { data, error } = await _supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    // 칸반보드에서 카드를 이동(상태 전이)시켰을 때 JSON 데이터 실시간 업데이트
    async updateProjectTasks(projectId, updatedTasks) {
        await this.init();
        const { data, error } = await _supabase
            .from('projects')
            .update({ tasks: updatedTasks })
            .eq('id', projectId)
            .select();
        return { data, error };
    }
};
    /* js/storage.js TaraeStorage 객체 내부에 추가 */

    // 9. 타래장 은하수 렌더링을 위한 생각 파편 전체 조회
    async getThoughts() {
        await this.init();
        const user_id = await this.getUserId();
        if (!user_id) return { data: null, error: new Error("인증 세션이 만료되었습니다.") };

        const { data, error } = await _supabase
            .from('thoughts')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
}