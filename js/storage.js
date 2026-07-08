/* js/storage.js */

const TaraeStorage = {
    supabaseClient: null,
    initPromise: null,

    init() {
        if (!this.initPromise) {
            this.initPromise = fetch('/api/config')
                .then(res => {
                    if (!res.ok) throw new Error("인프라 설정 키를 불러오지 못했습니다.");
                    return res.json();
                })
                .then(config => {
                    // 🛡️ 유령 문자 및 %20 공백 폭탄을 원천 박멸하는 초강력 세척기
                    const strictClean = (str) => {
                        if (!str) return '';
                        return str.replace(/\s+/g, '').replace(/[^\x21-\x7E]/g, '');
                    };

                    const cleanUrl = strictClean(config.SUPABASE_URL);
                    const cleanKey = strictClean(config.SUPABASE_ANON_KEY);

                    if (!cleanUrl || !cleanKey) {
                        throw new Error("Supabase 환경 변수가 비어있습니다.");
                    }

                    this.supabaseClient = supabase.createClient(cleanUrl, cleanKey);
                    console.log("▲ Tarae 인프라 엔진: Supabase 연동 완료");
                })
                .catch(err => {
                    console.error("▲ Tarae 인프라 에러:", err.message);
                });
        }
        return this.initPromise;
    },

    async getClient() {
        await this.init();
        return this.supabaseClient;
    },

    async getSession() {
        const client = await this.getClient();
        if (!client) return null;
        const { data: { session }, error } = await client.auth.getSession();
        if (error) return null;
        return session;
    },

    async getUserId() {
        const session = await this.getSession();
        return session ? session.user.id : null;
    },

    /* === [1] 생각 타래 (Thoughts) 제어 모듈 === */
    async saveThought(content, tags, comfort) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { error: { message: "인증되지 않은 사용자입니다." } };

        const { data, error } = await client
            .from("thoughts")
            .insert([
                {
                    user_id: uid,
                    content: content,
                    tags: tags,
                    comfort: comfort,
                    created_at: new Date().toISOString()
                }
            ]);
        return { data, error };
    },

    async getThoughts() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null }; // 로그인 전 에러 팝업 차단

        return await client
            .from("thoughts")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false });
    },

    /* === [2] 베틀 프로젝트 (Projects) 제어 모듈 === */
    async getProjects() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("projects")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false });
    },

    async insertProject(title, tasks, roadmap) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { error: { message: "인증되지 않은 사용자입니다." } };

        return await client
            .from("projects")
            .insert([
                {
                    user_id: uid,
                    title: title,
                    tasks: tasks,
                    roadmap: roadmap,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
    },

    async updateProjectTasks(projectId, updatedTasks) {
        const client = await this.getClient();
        if (!client) return { error: { message: "서버 연결 실패" } };

        return await client
            .from("projects")
            .update({ tasks: updatedTasks })
            .eq("id", projectId)
            .select();
    },

    /* === [3] 사용자 인증 (Auth) 및 상용 규격 메시지 모듈 === */
    async signUpOrLogin(email, password, isSignUp = false) {
        const client = await this.getClient();
        if (!client) return { error: { message: "서버 연결에 실패했습니다." } };

        const cleanEmail = email ? String(email).trim() : "";
        const cleanPassword = password ? String(password).trim() : "";

        if (isSignUp) {
            if (!cleanEmail || !cleanPassword) {
                alert("이메일 주소와 비밀번호를 입력한 후 가입하기 버튼을 누르세요.");
                return { data: null, error: { message: "입력값 누락" } };
            }
            if (cleanPassword.length < 6) {
                alert("비밀번호는 최소 6자리 이상이어야 합니다.");
                return { data: null, error: { message: "비밀번호 제약 요건 미달" } };
            }
        } else {
            if (!cleanEmail) { alert("이메일 주소를 입력하세요."); return { data: null, error: { message: "이메일 누락" } }; }
            if (!cleanPassword) { alert("비밀번호를 입력하세요."); return { data: null, error: { message: "비밀번호 누락" } }; }
        }

        try {
            if (isSignUp) {
                const { data, error } = await client.auth.signUp({ email: cleanEmail, password: cleanPassword });
                if (error) throw error;
                alert("회원가입 요청이 완료되었습니다!\n입력하신 이메일 함으로 발송된 인증 링크를 확인해 주세요.");
                return { data, error: null };
            } else {
                const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
                if (error) throw error;
                return { data, error: null };
            }
        } catch (err) {
            let friendlyMessage = "인증에 실패했습니다. 다시 시도해 주세요.";
            const errMsg = err.message || "";
            if (errMsg.includes("Invalid login credentials")) friendlyMessage = "이메일 또는 비밀번호가 잘못되었습니다.";
            else if (errMsg.includes("User already registered")) friendlyMessage = "이미 가입된 이메일 주소입니다.";
            else if (errMsg.includes("Email not confirmed")) friendlyMessage = "이메일 인증이 완료되지 않았습니다.";
            
            alert(friendlyMessage);
            return { data: null, error: { message: friendlyMessage } };
        }
    },

    async signIn(email, password) { return await this.signUpOrLogin(email, password, false); },
    async signUp(email, password) { return await this.signUpOrLogin(email, password, true); },
    async signOut() {
        const client = await this.getClient();
        if (client) await client.auth.signOut();
        // 발견한 localStorage.clear(); 를 지우고 이걸로 대체
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("sb-") || key.includes("supabase")) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.clear();
        location.reload();
    }
};

TaraeStorage.init();