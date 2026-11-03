(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const API_BASE = "https://www.googleapis.com/youtube/v3";
  const STORE = {
    key: "meldtube_api_key",
    history: "meldtube_history",
    saved: "meldtube_saved",
    banner: "meldtube_banner_dismissed"
  };

  function safeGet(key, fallback = "") {
    try { return localStorage.getItem(key) ?? fallback; }
    catch { return fallback; }
  }

  const state = {
    key: safeGet(STORE.key),
    query: "",
    nextPage: null,
    videos: [],
    current: null,
    view: "home",
    history: readStore(STORE.history),
    saved: readStore(STORE.saved),
    busy: false,
    dismissedBanner: safeGet(STORE.banner) === "1",
    previousView: "home"
  };

  // Starter content keeps the feed populated before an API key is connected.
  const sampleVideos = [
    { id: "jfKfPfyJRdk", title: "lofi hip hop radio 📚 — beats to relax / study to", channelTitle: "Lofi Girl", description: "Relaxing beats and a cozy study atmosphere.", publishedAt: "2024-01-01T00:00:00Z", views: "Live", tags: ["music", "lofi", "study", "chill"] },
    { id: "aqz-KE-bpKQ", title: "Big Buck Bunny — Blender Open Movie", channelTitle: "Blender Studio", description: "An animated short film created with Blender.", publishedAt: "2023-05-01T00:00:00Z", views: "Open movie", tags: ["animation", "technology", "film"] },
    { id: "ScMzIvxBSi4", title: "Relaxing nature scenery", channelTitle: "Nature Moments", description: "A peaceful scenery video for a quiet break.", publishedAt: "2023-08-12T00:00:00Z", views: "Nature", tags: ["nature", "relaxing", "documentary"] },
    { id: "kJQP7kiw5Fk", title: "Luis Fonsi — Despacito ft. Daddy Yankee", channelTitle: "Luis Fonsi", description: "Official music video.", publishedAt: "2017-01-12T00:00:00Z", views: "Music video", tags: ["music", "latin", "pop"] },
    { id: "ysz5S6PUM-U", title: "Sintel — Third Open Movie by Blender", channelTitle: "Blender", description: "An open movie from the Blender Foundation.", publishedAt: "2010-09-30T00:00:00Z", views: "Animation", tags: ["animation", "film", "technology"] },
    { id: "L_jWHffIx5E", title: "Smash Mouth — All Star", channelTitle: "Smash Mouth", description: "Official music video.", publishedAt: "1999-01-01T00:00:00Z", views: "Music video", tags: ["music", "pop"] },
    { id: "jNQXAC9IVRw", title: "Me at the zoo", channelTitle: "jawed", description: "The first video uploaded to YouTube.", publishedAt: "2005-04-23T00:00:00Z", views: "Classic YouTube", tags: ["history", "technology", "classic"] },
    { id: "eRsGyueVLvQ", title: "The first 20 hours — how to learn anything", channelTitle: "TED", description: "A talk about learning a new skill.", publishedAt: "2013-06-04T00:00:00Z", views: "Talk", tags: ["learning", "education", "science"] }
  ].map(normalizeItem);

  function readStore(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { toast("Browser storage is full or unavailable."); }
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function toast(message) {
    const element = $("#toast");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 2500);
  }

  function relativeDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days < 1) return "today";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  function normalizeItem(item) {
    const id = typeof item.id === "string" ? item.id : item.id?.videoId;
    const snippet = item.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    return {
      id,
      title: snippet.title || item.title || "Untitled video",
      channelTitle: snippet.channelTitle || item.channelTitle || "YouTube creator",
      description: snippet.description || item.description || "",
      publishedAt: snippet.publishedAt || item.publishedAt || "",
      thumbnail: thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || item.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""),
      viewCount: item.statistics?.viewCount || item.viewCount || null,
      views: item.views || "",
      tags: item.tags || []
    };
  }

  function formatViews(count) {
    const value = Number(count);
    if (!Number.isFinite(value)) return "";
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B views`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M views`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K views`;
    return `${value} views`;
  }

  function cardMarkup(video) {
    const saved = state.saved.some(item => item.id === video.id);
    const title = escapeHTML(video.title);
    const channel = escapeHTML(video.channelTitle);
    const meta = video.viewCount ? formatViews(video.viewCount) : (video.views || relativeDate(video.publishedAt));
    const thumb = escapeHTML(video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`);
    const initial = escapeHTML((video.channelTitle || "M").slice(0, 1).toUpperCase());
    return `
      <article class="video-card" tabindex="0" role="button" aria-label="Watch ${title}" data-play="${escapeHTML(video.id)}">
        <div class="thumbnail-wrap">
          <img class="thumbnail" src="${thumb}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg'">
          <div class="thumb-play"><span>▶</span></div>
        </div>
        <div class="card-details">
          <div class="channel-avatar">${initial}</div>
          <div class="card-text">
            <h2 class="video-title">${title}</h2>
            <div class="channel-name">${channel}</div>
            <div class="card-bottom"><span class="video-meta">${escapeHTML(meta)}</span></div>
          </div>
          <button class="save-card ${saved ? "saved" : ""}" data-save="${escapeHTML(video.id)}" title="${saved ? "Remove from Watch later" : "Save to Watch later"}" aria-label="${saved ? "Remove saved video" : "Save video"}">${saved ? "♥" : "♡"}</button>
        </div>
      </article>`;
  }

  function renderVideos(items, append = false) {
    const grid = $("#videoGrid");
    if (!append) grid.innerHTML = "";
    if (!items.length && !append) {
      grid.innerHTML = emptyMarkup("No videos found", "Try another search, choose a category, or connect a YouTube API key to load live results.", true);
      bindEmptyActions();
      return;
    }
    grid.insertAdjacentHTML("beforeend", items.map(cardMarkup).join(""));
    $("#resultCount").textContent = `${state.videos.length} videos`;
  }

  function emptyMarkup(title, message, includeSearch = false) {
    return `<div class="empty-state"><div class="empty-icon">✦</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(message)}</p>${includeSearch ? `<div class="empty-actions"><button class="primary-button" id="emptyConnect">Connect YouTube</button><button class="secondary-button" id="emptyYtSearch">Search on YouTube ↗</button></div>` : ""}</div>`;
  }

  function bindEmptyActions() {
    $("#emptyConnect")?.addEventListener("click", openSettings);
    $("#emptyYtSearch")?.addEventListener("click", () => openYoutubeSearch(state.query));
  }

  function setVideos(items, append = false) {
    const normalized = items.map(normalizeItem).filter(video => video.id);
    state.videos = append ? [...state.videos, ...normalized] : normalized;
    renderVideos(normalized, append);
  }

  function setSkeletons() {
    $("#videoGrid").innerHTML = Array.from({ length: 8 }, () => `<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>`).join("");
  }

  function setCategory(query) {
    $$(".category-chip").forEach(button => button.classList.toggle("selected", button.dataset.query === query));
  }

  function setActiveNav(view) {
    $$(".nav-item[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  }

  function openYoutubeSearch(query) {
    const target = query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : "https://www.youtube.com";
    window.open(target, "_blank", "noopener,noreferrer");
  }

  function filterSamples(query) {
    if (!query) return sampleVideos;
    const term = query.toLowerCase();
    return sampleVideos.filter(video => [video.title, video.channelTitle, video.description, ...(video.tags || [])].join(" ").toLowerCase().includes(term));
  }

  async function youtubeSearch(query = "", append = false) {
    state.query = query;
    $("#sectionTitle").textContent = query ? `Results for “${query}”` : (state.view === "explore" ? "Explore videos" : "Recommended videos");
    $("#feedEyebrow").textContent = query ? "SEARCH RESULTS" : "A LITTLE INSPIRATION";
    $("#connectBanner").hidden = state.dismissedBanner || Boolean(state.key);
    if (!state.key) {
      state.nextPage = null;
      if (query) {
        const matches = filterSamples(query);
        state.videos = matches;
        renderVideos(matches);
        if (!matches.length) {
          $("#videoGrid").innerHTML = emptyMarkup("No sample matches", "Live YouTube results need an API key. You can open this exact search on YouTube in a new tab.", true);
          bindEmptyActions();
        }
      } else {
        state.videos = [...sampleVideos];
        renderVideos(state.videos);
      }
      $("#loadMoreBtn").hidden = true;
      return;
    }
    if (state.busy) return;
    state.busy = true;
    if (!append) setSkeletons();
    try {
      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: "18",
        safeSearch: "moderate",
        q: query || "popular videos",
        key: state.key
      });
      if (append && state.nextPage) params.set("pageToken", state.nextPage);
      const response = await fetch(`${API_BASE}/search?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "YouTube search failed. Check the API key and quota.");
      state.nextPage = data.nextPageToken || null;
      setVideos(data.items || [], append);
      $("#loadMoreBtn").hidden = !state.nextPage;
    } catch (error) {
      if (!append) {
        $("#videoGrid").innerHTML = emptyMarkup("Couldn’t load YouTube results", `${error.message} Check that YouTube Data API v3 is enabled and the key is valid.`, true);
        bindEmptyActions();
      } else {
        toast(error.message || "Couldn’t load more videos.");
      }
      $("#loadMoreBtn").hidden = true;
    } finally {
      state.busy = false;
    }
  }

  function getVideoId(input) {
    const raw = (input || "").trim();
    if (/^[\w-]{11}$/.test(raw)) return raw;
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      if (host === "youtu.be" || host.endsWith(".youtu.be")) return url.pathname.split("/").filter(Boolean)[0] || null;
      if (host.includes("youtube.com")) return url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] || null;
    } catch { /* Invalid URL */ }
    return null;
  }

  function findVideo(id) {
    return state.videos.find(video => video.id === id)
      || state.saved.find(video => video.id === id)
      || state.history.find(video => video.id === id)
      || sampleVideos.find(video => video.id === id)
      || normalizeItem({ id, title: "YouTube video", channelTitle: "YouTube", description: "" });
  }

  function showWatchView(video, fromView = state.view) {
    if (!video?.id) return;
    state.previousView = fromView;
    state.current = video;
    state.view = "watch";
    $("#homeView").hidden = true;
    $("#categoryBar").hidden = true;
    $("#watchView").hidden = false;
    $("#playerTitle").textContent = video.title || "YouTube video";
    $("#playerChannel").textContent = video.channelTitle || "YouTube creator";
    $("#playerChannelMeta").textContent = video.publishedAt ? `Published ${relativeDate(video.publishedAt)}` : "Video on YouTube";
    $("#creatorAvatar").textContent = (video.channelTitle || "Y").slice(0, 1).toUpperCase();
    $("#playerStats").textContent = [video.viewCount ? formatViews(video.viewCount) : video.views, video.publishedAt ? relativeDate(video.publishedAt) : ""].filter(Boolean).join("  •  ") || "Playing through YouTube";
    $("#playerDescription").textContent = video.description || "This video is hosted on YouTube. Open it on YouTube for the full description and creator details.";
    $("#playerFrameWrap").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0" title="${escapeHTML(video.title || "YouTube video")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    $("#openYoutubeLink").href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
    updateSaveCurrentButton();
    renderRelated(video.id);
    state.history = [video, ...state.history.filter(item => item.id !== video.id)].slice(0, 100);
    saveStore(STORE.history, state.history);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.innerWidth <= 680) $("#sidebar").classList.remove("open");
  }

  function renderRelated(currentId) {
    const related = state.videos.filter(video => video.id !== currentId).slice(0, 10);
    const fallback = sampleVideos.filter(video => video.id !== currentId && !related.some(item => item.id === video.id));
    const items = [...related, ...fallback].slice(0, 10);
    $("#relatedGrid").innerHTML = items.map(video => `
      <article class="related-card" tabindex="0" role="button" data-related="${escapeHTML(video.id)}" aria-label="Play ${escapeHTML(video.title)}">
        <div class="related-thumb"><img src="${escapeHTML(video.thumbnail)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg'"></div>
        <div class="related-info"><strong>${escapeHTML(video.title)}</strong><small>${escapeHTML(video.channelTitle)}<br>${escapeHTML(video.viewCount ? formatViews(video.viewCount) : (video.views || relativeDate(video.publishedAt)))}</small></div>
      </article>`).join("");
  }

  function returnToFeed() {
    $("#playerFrameWrap").innerHTML = "";
    $("#watchView").hidden = true;
    $("#homeView").hidden = false;
    $("#categoryBar").hidden = false;
    state.view = state.previousView === "watch" ? "home" : state.previousView;
    if (state.view === "history" || state.view === "saved") showLocalList(state.view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSaveCurrentButton() {
    if (!state.current) return;
    const isSaved = state.saved.some(video => video.id === state.current.id);
    $("#saveCurrentBtn").innerHTML = isSaved ? "<span>♥</span> Saved" : "<span>＋</span> Save";
  }

  function toggleSave(id) {
    const video = findVideo(id);
    const exists = state.saved.some(item => item.id === id);
    state.saved = exists ? state.saved.filter(item => item.id !== id) : [video, ...state.saved];
    saveStore(STORE.saved, state.saved);
    $$(`[data-save="${CSS.escape(id)}"]`).forEach(button => {
      button.classList.toggle("saved", !exists);
      button.textContent = exists ? "♡" : "♥";
      button.title = exists ? "Save to Watch later" : "Remove from Watch later";
    });
    if (state.current?.id === id) updateSaveCurrentButton();
    toast(exists ? "Removed from Watch later" : "Saved to Watch later");
    if (state.view === "saved") showLocalList("saved");
  }

  function showLocalList(type) {
    state.view = type;
    state.previousView = type;
    $("#watchView").hidden = true;
    $("#playerFrameWrap").innerHTML = "";
    $("#homeView").hidden = false;
    $("#categoryBar").hidden = true;
    $("#connectBanner").hidden = true;
    $("#feedEyebrow").textContent = "YOUR SPACE";
    $("#sectionTitle").textContent = type === "history" ? "Watch history" : "Watch later";
    setActiveNav(type);
    state.videos = type === "history" ? state.history : state.saved;
    renderVideos(state.videos);
    if (!state.videos.length) {
      $("#videoGrid").innerHTML = emptyMarkup(type === "history" ? "No watch history yet" : "Nothing saved yet", type === "history" ? "Videos you watch will appear here on this device." : "Save videos and they’ll be collected here for later.");
    }
    $("#resultCount").textContent = `${state.videos.length} videos`;
    $("#loadMoreBtn").hidden = true;
  }

  function goHome() {
    state.view = "home";
    state.previousView = "home";
    $("#watchView").hidden = true;
    $("#playerFrameWrap").innerHTML = "";
    $("#homeView").hidden = false;
    $("#categoryBar").hidden = false;
    $("#searchInput").value = "";
    setActiveNav("home");
    setCategory("");
    youtubeSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSettings() {
    $("#apiKeyInput").value = state.key;
    $("#settingsStatus").textContent = "";
    $("#settingsModal").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(id) {
    const modal = $("#" + id);
    if (!modal) return;
    modal.hidden = true;
    if ($$(".modal-backdrop").every(item => item.hidden)) document.body.style.overflow = "";
  }

  function saveSettings() {
    state.key = $("#apiKeyInput").value.trim();
    if (state.key) localStorage.setItem(STORE.key, state.key);
    else localStorage.removeItem(STORE.key);
    $("#settingsStatus").textContent = state.key ? "API key saved in this browser." : "API key removed.";
    closeModal("settingsModal");
    $("#connectBanner").hidden = state.dismissedBanner || Boolean(state.key);
    toast(state.key ? "YouTube search connected" : "API key cleared");
    if (state.view !== "watch" && state.view !== "history" && state.view !== "saved") youtubeSearch(state.query);
  }

  function clearApiKey() {
    state.key = "";
    $("#apiKeyInput").value = "";
    localStorage.removeItem(STORE.key);
    $("#settingsStatus").textContent = "API key removed from this browser.";
    $("#connectBanner").hidden = state.dismissedBanner;
  }

  function playPastedVideo() {
    const id = getVideoId($("#videoUrlInput").value);
    if (!id) {
      $("#settingsStatus").textContent = "Enter a valid YouTube link or 11-character video ID.";
      return;
    }
    closeModal("settingsModal");
    showWatchView(findVideo(id));
  }

  async function shareCurrent() {
    if (!state.current) return;
    const url = `https://www.youtube.com/watch?v=${state.current.id}`;
    try {
      if (navigator.share) await navigator.share({ title: state.current.title, url });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast("YouTube link copied");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (error?.name !== "AbortError") toast("Could not share this video.");
    }
  }

  // Header and search
  $("#searchForm").addEventListener("submit", event => {
    event.preventDefault();
    const query = $("#searchInput").value.trim();
    if (!query) return;
    state.view = "search";
    state.previousView = "search";
    $("#watchView").hidden = true;
    $("#playerFrameWrap").innerHTML = "";
    $("#homeView").hidden = false;
    $("#categoryBar").hidden = false;
    $("#connectBanner").hidden = true;
    setActiveNav("");
    setCategory("__none__");
    youtubeSearch(query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("#homeLink").addEventListener("click", event => { event.preventDefault(); goHome(); });
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#profileBtn").addEventListener("click", openSettings);
  $("#sidebarSettings").addEventListener("click", openSettings);
  $("#bannerSettings").addEventListener("click", openSettings);
  $("#dismissBanner").addEventListener("click", () => {
    state.dismissedBanner = true;
    localStorage.setItem(STORE.banner, "1");
    $("#connectBanner").hidden = true;
  });

  // Navigation
  $$(".nav-item[data-view]").forEach(button => button.addEventListener("click", () => {
    const view = button.dataset.view;
    if (view === "home") { goHome(); return; }
    state.view = view;
    state.previousView = view;
    $("#watchView").hidden = true;
    $("#playerFrameWrap").innerHTML = "";
    $("#homeView").hidden = false;
    $("#categoryBar").hidden = false;
    $("#searchInput").value = "";
    setActiveNav(view);
    const query = view === "explore" ? "trending" : view;
    setCategory(view === "music" || view === "gaming" ? view : "__none__");
    youtubeSearch(query === "explore" ? "" : query);
    if (view === "explore" && !state.key) {
      $("#sectionTitle").textContent = "Explore videos";
      state.videos = [...sampleVideos];
      renderVideos(state.videos);
    }
  }));
  $("#historyBtn").addEventListener("click", () => showLocalList("history"));
  $("#savedBtn").addEventListener("click", () => showLocalList("saved"));

  // Category chips
  $$(".category-chip").forEach(button => button.addEventListener("click", () => {
    const query = button.dataset.query || "";
    state.view = query ? "search" : "home";
    state.previousView = state.view;
    $("#searchInput").value = query;
    $("#watchView").hidden = true;
    $("#playerFrameWrap").innerHTML = "";
    $("#homeView").hidden = false;
    $("#categoryBar").hidden = false;
    setCategory(query);
    setActiveNav(query ? "" : "home");
    youtubeSearch(query);
  }));

  // Feed cards and related cards use event delegation.
  $("#videoGrid").addEventListener("click", event => {
    const saveButton = event.target.closest("[data-save]");
    if (saveButton) { event.stopPropagation(); toggleSave(saveButton.dataset.save); return; }
    const card = event.target.closest("[data-play]");
    if (card) showWatchView(findVideo(card.dataset.play));
  });
  $("#videoGrid").addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-play]")) {
      event.preventDefault();
      showWatchView(findVideo(event.target.dataset.play));
    }
  });
  $("#relatedGrid").addEventListener("click", event => {
    const card = event.target.closest("[data-related]");
    if (card) showWatchView(findVideo(card.dataset.related), state.previousView);
  });
  $("#relatedGrid").addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-related]")) {
      event.preventDefault();
      showWatchView(findVideo(event.target.dataset.related), "watch");
    }
  });

  // Player actions and history
  $("#backToFeed").addEventListener("click", returnToFeed);
  $("#saveCurrentBtn").addEventListener("click", () => { if (state.current) toggleSave(state.current.id); });
  $("#shareCurrentBtn").addEventListener("click", shareCurrent);
  $("#loadMoreBtn").addEventListener("click", () => youtubeSearch(state.query, true));

  // Settings dialog
  $("#saveSettingsBtn").addEventListener("click", saveSettings);
  $("#clearKeyBtn").addEventListener("click", clearApiKey);
  $("#playUrlBtn").addEventListener("click", playPastedVideo);
  $("#videoUrlInput").addEventListener("keydown", event => { if (event.key === "Enter") playPastedVideo(); });
  $$(".dialog-close").forEach(button => button.addEventListener("click", () => closeModal(button.dataset.close)));
  $("#settingsModal").addEventListener("click", event => { if (event.target.id === "settingsModal") closeModal("settingsModal"); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#settingsModal").hidden) closeModal("settingsModal"); });

  // Responsive navigation and collapsed desktop sidebar
  $("#menuToggle").addEventListener("click", () => {
    if (window.innerWidth <= 680) $("#sidebar").classList.toggle("open");
    else document.body.classList.toggle("sidebar-collapsed");
  });
  document.addEventListener("click", event => {
    if (window.innerWidth <= 680 && !event.target.closest("#sidebar") && !event.target.closest("#menuToggle")) $("#sidebar").classList.remove("open");
  });

  // Initial feed
  $("#connectBanner").hidden = state.dismissedBanner || Boolean(state.key);
  state.videos = [...sampleVideos];
  renderVideos(state.videos);
  if (state.key) youtubeSearch("");
})();
