(() => {
  const $ = (id) => document.getElementById(id);
  const state = { channels: [], favorites: new Set(), view: 'home', hls: null };
  const demoChannels = [
    {name:'NASA TV', group:'Ciência e espaço', url:'https://ntv1.akamaized.net/hls/live/2017057/NASA-NTV1-Public/master.m3u8', logo:''},
    {name:'NASA TV Media', group:'Ciência e espaço', url:'https://ntv1.akamaized.net/hls/live/2017057/NASA-NTV1-Public/master.m3u8', logo:''}
  ];
  // Demo uses a publicly published NASA stream. Availability can change and is not guaranteed.
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  function showModal(id) { $(id).hidden = false; }
  function closeModal(id) { $(id).hidden = true; }
  function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function parseM3U(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
    const channels = []; let meta = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('#EXTINF:')) {
        const comma = line.lastIndexOf(',');
        const info = comma >= 0 ? line.slice(comma + 1).trim() : 'Canal sem nome';
        const attr = (name) => {
          const m = line.match(new RegExp('(?:^|\\\\s)' + name + '="([^"]*)"'));
          return m ? m[1] : '';
        };
        meta = { name: info || attr('tvg-name') || 'Canal sem nome', logo: attr('tvg-logo'), group: attr('group-title') || 'Sem categoria' };
        const tvgName = attr('tvg-name'); if (tvgName && (!info || info === '-1')) meta.name = tvgName;
      } else if (!line.startsWith('#') && meta) {
        if (/^(https?|rtmp|rtsp):\/\//i.test(line)) channels.push({...meta, url: line});
        meta = null;
      }
    }
    return channels;
  }
  function categories() {
    const select = $('categoryFilter'), current = select.value;
    const groups = [...new Set(state.channels.map(c => c.group || 'Sem categoria'))].sort((a,b) => a.localeCompare(b,'pt-BR'));
    select.innerHTML = '<option value="all">Todas as categorias</option>' + groups.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    if (groups.includes(current)) select.value = current;
  }
  function visibleChannels() {
    const query = $('searchInput').value.trim().toLocaleLowerCase('pt-BR');
    const group = $('categoryFilter').value;
    return state.channels.filter(c => {
      if (state.view === 'favorites' && !state.favorites.has(c.url)) return false;
      if (group !== 'all' && (c.group || 'Sem categoria') !== group) return false;
      return !query || (c.name + ' ' + c.group).toLocaleLowerCase('pt-BR').includes(query);
    });
  }
  function render() {
    $('channelCount').textContent = state.channels.length;
    $('favoriteCount').textContent = state.favorites.size;
    const items = visibleChannels();
    $('emptyState').hidden = items.length > 0;
    $('channelGrid').innerHTML = items.map((c) => {
      const key = encodeURIComponent(c.url);
      const logo = c.logo ? `<img src="${esc(c.logo)}" alt="" loading="lazy" onerror="this.remove()">` : esc((c.name || 'TV').slice(0,2).toUpperCase());
      return `<article class="channel-card"><div class="channel-top"><div class="channel-logo">${logo}</div><div><div class="channel-name">${esc(c.name)}</div><div class="channel-group">${esc(c.group || 'Sem categoria')}</div></div></div><div class="channel-bottom"><button class="play-channel" data-play="${key}">▶ Assistir</button><button class="favorite ${state.favorites.has(c.url)?'is-fav':''}" data-fav="${key}" title="Favoritar" aria-label="Favoritar ${esc(c.name)}">${state.favorites.has(c.url)?'♥':'♡'}</button></div></article>`;
    }).join('');
    $('listHeading').textContent = state.view === 'favorites' ? 'Seus favoritos' : state.view === 'live' ? 'TV ao vivo' : 'Canais disponíveis';
    $('pageTitle').textContent = state.view === 'favorites' ? 'Favoritos' : state.view === 'live' ? 'TV ao vivo' : 'Início';
    document.querySelectorAll('.nav[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  }
  function loadChannels(channels, message) {
    state.channels = channels; state.view = 'home'; categories(); render();
    closeModal('playlistModal'); toast(message);
  }
  async function loadPlaylist() {
    $('playlistError').textContent = '';
    const file = $('m3uFile').files[0], url = $('m3uUrl').value.trim();
    try {
      let text;
      if (file) text = await file.text();
      else if (url) {
        const parsed = new URL(url);
        if (!['http:','https:'].includes(parsed.protocol)) throw new Error('Use uma URL HTTP ou HTTPS.');
        const response = await fetch(parsed.href);
        if (!response.ok) throw new Error(`Não foi possível baixar a lista (HTTP ${response.status}).`);
        text = await response.text();
      } else throw new Error('Escolha um arquivo M3U ou informe a URL.');
      const channels = parseM3U(text);
      if (!channels.length) throw new Error('Nenhum canal encontrado. Verifique se a lista está no formato M3U e contém URLs de transmissão.');
      loadChannels(channels, `${channels.length} canais carregados.`);
    } catch (e) {
      $('playlistError').textContent = e.message.includes('fetch') || e instanceof TypeError
        ? 'Falha ao buscar a URL. O servidor da lista pode bloquear CORS; tente baixar o arquivo M3U e carregá-lo localmente.'
        : e.message;
    }
  }
  function play(url) {
    const channel = state.channels.find(c => c.url === url);
    if (!channel) return;
    $('playingTitle').textContent = channel.name; $('playerMessage').textContent = 'Carregando transmissão…';
    showModal('playerModal');
    const video = $('videoPlayer');
    if (state.hls) { state.hls.destroy(); state.hls = null; }
    video.pause(); video.removeAttribute('src'); video.load();
    if (window.Hls && Hls.isSupported() && /\.m3u8($|\?)/i.test(url)) {
      state.hls = new Hls({enableWorker:true});
      state.hls.loadSource(url); state.hls.attachMedia(video);
      state.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      state.hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) $('playerMessage').textContent = 'Não foi possível reproduzir esta fonte. Pode estar indisponível ou bloquear o acesso pelo navegador.';
      });
    } else {
      video.src = url;
      video.play().catch(() => { $('playerMessage').textContent = 'Clique em reproduzir. Se falhar, o formato ou a fonte pode não ser compatível com seu navegador.'; });
    }
    $('playerMessage').textContent = 'Se não iniciar, a transmissão pode estar indisponível, exigir autorização ou bloquear reprodução em navegador.';
  }
  function stopPlayer() {
    const video = $('videoPlayer'); video.pause(); video.removeAttribute('src'); video.load();
    if (state.hls) { state.hls.destroy(); state.hls = null; }
  }
  $('openPlaylist').addEventListener('click', () => showModal('playlistModal'));
  ['heroAdd','emptyAdd'].forEach(id => $(id).addEventListener('click', () => showModal('playlistModal')));
  $('loadM3u').addEventListener('click', loadPlaylist);
  $('demoBtn').addEventListener('click', () => loadChannels(demoChannels, 'Demonstração carregada. A disponibilidade da fonte pública pode mudar.'));
  $('browseChannels').addEventListener('click', () => { state.view = 'live'; render(); document.querySelector('.content-section').scrollIntoView({behavior:'smooth'}); });
  $('settingsBtn').addEventListener('click', () => showModal('playlistModal'));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.close === 'playerModal') stopPlayer();
    closeModal(b.dataset.close);
  }));
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', e => {
    if (e.target === backdrop) { if (backdrop.id === 'playerModal') stopPlayer(); closeModal(backdrop.id); }
  }));
  document.querySelectorAll('.nav[data-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; render(); }));
  $('searchInput').addEventListener('input', render);
  $('categoryFilter').addEventListener('change', render);
  $('channelGrid').addEventListener('click', e => {
    const playButton = e.target.closest('[data-play]');
    const favButton = e.target.closest('[data-fav]');
    if (playButton) play(decodeURIComponent(playButton.dataset.play));
    if (favButton) {
      const url = decodeURIComponent(favButton.dataset.fav);
      if (state.favorites.has(url)) state.favorites.delete(url); else state.favorites.add(url);
      render();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('playerModal').hidden) stopPlayer();
      document.querySelectorAll('.modal-backdrop').forEach(m => m.hidden = true);
    }
  });
  render();
})();
