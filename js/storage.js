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

    // 🆕 비밀번호 재설정 메일 발송
    async sendPasswordReset(email) {
        const client = await this.getClient();
        if (!client) return { error: { message: "인프라 연결에 실패했습니다." } };

        const cleanEmail = (email || '').trim();
        if (!cleanEmail) return { error: { message: "이메일을 입력해주세요." } };

        return await client.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
    },

    // 🆕 재설정 링크를 타고 들어온 뒤, 새 비밀번호로 변경
    async updatePassword(newPassword) {
        const client = await this.getClient();
        if (!client) return { error: { message: "인프라 연결에 실패했습니다." } };

        return await client.auth.updateUser({ password: newPassword });
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
            ])
            .select();
        return { data, error };
    },

    // 🆕 AI 분류가 늦게 도착했을 때, 이미 저장된 생각의 태그/공감 문구만 조용히 갱신
    async updateThoughtTags(thoughtId, tags, comfort) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { error: { message: "인증되지 않은 사용자입니다." } };

        return await client
            .from("thoughts")
            .update({ tags, comfort })
            .eq("id", thoughtId)
            .eq("user_id", uid);
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

    // 🆕 [성능] 개수만 필요할 때: 전체를 안 받고 DB에게 세어달라고만 요청 (count-only, head:true → 행 데이터는 안 옴)
    async getThoughtCounts() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { total: 0, unassigned: 0, stale: 0 };

        const staleCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

        const [totalRes, unassignedRes, staleRes] = await Promise.all([
            client.from("thoughts").select("*", { count: "exact", head: true }).eq("user_id", uid),
            client.from("thoughts").select("*", { count: "exact", head: true }).eq("user_id", uid).is("project_id", null),
            client.from("thoughts").select("*", { count: "exact", head: true }).eq("user_id", uid).lt("created_at", staleCutoff)
        ]);

        return {
            total: totalRes.count || 0,
            unassigned: unassignedRes.count || 0,
            stale: staleRes.count || 0
        };
    },

    // 🆕 [성능] 홈 "최근에 남긴 생각": 딱 필요한 개수만 서버에서부터 제한
    async getRecentThoughts(limit = 5) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("thoughts")
            .select("id, content, created_at")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(limit);
    },

    // 🆕 [성능] 태그클라우드·뜻밖의 공명용 표본: 전체 대신 최근 N개만 (기본 300개 상한)
    async getThoughtsSample(limit = 300) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("thoughts")
            .select("id, content, tags, created_at, project_id")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(limit);
    },

    // 🆕 [성능] 타래장/베틀의 "더 보기" 페이지네이션 (최신순)
    async getThoughtsPage({ limit = 40, offset = 0 } = {}) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("thoughts")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
    },

    // 🆕 [성능] "먼지 쌓이는 실가닥"만 페이지네이션으로 (오래 방치된 순 = 오래된 것부터)
    async getStaleThoughtsPage({ limit = 40, offset = 0 } = {}) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        const staleCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

        return await client
            .from("thoughts")
            .select("*")
            .eq("user_id", uid)
            .lt("created_at", staleCutoff)
            .order("created_at", { ascending: true })
            .range(offset, offset + limit - 1);
    },

    // 🆕 [성능] "단단해진 타래(프로젝트 연결된 것)"만 페이지네이션으로
    async getProjectLinkedThoughtsPage({ limit = 40, offset = 0 } = {}) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("thoughts")
            .select("*")
            .eq("user_id", uid)
            .not("project_id", "is", null)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
    },

    // 🆕 [성능] 특정 태그가 붙은 생각만 서버에서 필터링해서 가져오기
    async getThoughtsByTag(tag) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("thoughts")
            .select("*")
            .eq("user_id", uid)
            .contains("tags", [tag])
            .order("created_at", { ascending: false });
    },

    // 🆕 [성능] 특정 기간(N일) 이내 생각만 가져오기 — 설정 페이지 테스트 발송용
    async getThoughtsSince(days) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        return await client
            .from("thoughts")
            .select("id, content, created_at")
            .eq("user_id", uid)
            .gte("created_at", cutoff)
            .order("created_at", { ascending: false });
    },

    // 🆕 [성능] 특정 생각 하나만 정확히 조회 (딥링크로 넘어온 focus 대상이 현재 페이지 창에 없을 때)
    async getThoughtById(id) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: null, error: null };

        return await client
            .from("thoughts")
            .select("*")
            .eq("id", id)
            .eq("user_id", uid)
            .maybeSingle();
    },

    async getDailyInsight() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: null, error: null };

        return await client
            .from("daily_insights")
            .select("*")
            .eq("user_id", uid)
            .order("generated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
    },

    async getSettings() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: null, error: null };

        return await client
            .from("user_settings")
            .select("*")
            .eq("user_id", uid)
            .maybeSingle();
    },

    async saveSettings(settings) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: null, error: { message: "로그인 상태가 아닙니다." } };

        return await client
            .from("user_settings")
            .upsert({
                user_id: uid,
                is_enabled: settings.is_enabled,
                harvest_scope: settings.harvest_scope,
                send_frequency: settings.send_frequency,
                send_time: settings.send_time,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id" });
    },

    // 🆕 채널별로 여러 개를 동시에 등록/조회 (디스코드+슬랙 동시에 등록 가능)
    async getChannels() {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        return await client
            .from("user_notification_channels")
            .select("*")
            .eq("user_id", uid);
    },

    async saveChannel(channel, webhookUrl, isActive) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: null, error: { message: "로그인 상태가 아닙니다." } };

        return await client
            .from("user_notification_channels")
            .upsert({
                user_id: uid,
                channel: channel,
                webhook_url: webhookUrl,
                is_active: isActive,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id,channel" });
    },

    // 🆕 생각 삭제 (본인 것만)
    async deleteThought(thoughtId) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { error: { message: "인증되지 않은 사용자입니다." } };

        return await client
            .from("thoughts")
            .delete()
            .eq("id", thoughtId)
            .eq("user_id", uid);
    },

    // 🆕 생각 내용 수정 (본인 것만)
    async editThought(thoughtId, newContent) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { error: { message: "인증되지 않은 사용자입니다." } };

        return await client
            .from("thoughts")
            .update({ content: newContent })
            .eq("id", thoughtId)
            .eq("user_id", uid);
    },

    // 🆕 커스텀 기간(시작일~종료일)으로 생각 조회 — 리포트 달력 선택용
    async getThoughtsBetween(startDateStr, endDateStr) {
        const client = await this.getClient();
        const uid = await this.getUserId();
        if (!client || !uid) return { data: [], error: null };

        const startISO = new Date(startDateStr + "T00:00:00").toISOString();
        const endISO = new Date(endDateStr + "T23:59:59").toISOString();

        return await client
            .from("thoughts")
            .select("id, content, created_at")
            .eq("user_id", uid)
            .gte("created_at", startISO)
            .lte("created_at", endISO)
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