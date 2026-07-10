// sw.js — 최소한의 서비스워커
// 목적: PWA 설치 요건(서비스워커 등록) 충족 + 정적 자산(CSS/아이콘)만 가볍게 캐싱
// 주의: API 응답이나 페이지 자체는 캐싱하지 않음 — 생각 데이터는 항상 최신 상태로 보여야 하기 때문

const CACHE_NAME = "tarae-static-v1";
const STATIC_ASSETS = [
    "/css/style.css",
    "/css/dark-mode.css",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // API 요청이나 HTML 페이지는 절대 캐싱하지 않고 항상 네트워크에서 최신으로 받아옴
    if (url.pathname.startsWith("/api/") || event.request.mode === "navigate") {
        return; // 기본 브라우저 동작(네트워크 요청) 그대로 사용
    }

    // 정적 자산(css, 아이콘 등)만 캐시 우선으로 응답, 없으면 네트워크에서 받아와 캐시에 채워둠
    if (STATIC_ASSETS.some((asset) => url.pathname === asset)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
    }
});
