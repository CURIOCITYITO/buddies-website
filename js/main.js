// Buddies — 最小限のスクリプト

// スマホ：ハンバーガーでナビ開閉
const navToggle = document.getElementById('navToggle');
const globalNav = document.getElementById('globalNav');

function closeMenu() {
  globalNav.classList.remove('is-open');
  navToggle.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'メニューを開く');
  document.body.classList.remove('menu-open');
}
if (navToggle && globalNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = globalNav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });

  // メニュー内のリンクを押したら閉じる
  globalNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
  // Escで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// カテゴリーフィルターの見た目切り替え（表示はこれから中身を実装）
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});

// フッターの年号
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Page Top：なめらかに最上部へ
const pageTop = document.getElementById('pageTop');
if (pageTop) {
  pageTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ヒーローの自動スライド（クロスフェード）
const heroSlider = document.getElementById('heroSlider');
if (heroSlider) {
  const slides = heroSlider.querySelectorAll('.hero-img');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (slides.length > 1 && !reduce) {
    let idx = 0;
    setInterval(function () {
      slides[idx].classList.remove('is-active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('is-active');
    }, 5000); // 5秒ごとに切り替え
  }
}

// ページ読み込み後、ヒーローのアニメを発火
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});
// load前でも一瞬で発火（キャッシュ時など）
requestAnimationFrame(() => document.body.classList.add('loaded'));

// スクロールで要素をふわっと出現（IntersectionObserver）
let revealObserver = null;
if ('IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // 一度出たら監視解除
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
}
// 要素を出現アニメの監視に登録（あとから追加した要素にも使える）
function registerReveal(el) {
  if (revealObserver) revealObserver.observe(el);
  else el.classList.add('is-visible'); // 非対応環境では即表示
}
document.querySelectorAll('.reveal, .feature').forEach(registerReveal);

// 投稿データ（data/posts.json）を読み込み、各カテゴリーのカードを自動生成
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// 完パケ画像は名前・犬種が焼き込み済みなので、カードは画像のみ（タップでInstagramへ）
function gridCardMarkup(post) {
  const link = (post.link && post.link.trim()) ? post.link.trim() : '';
  const alt = escapeHtml(post.name && post.name.trim() ? post.name : 'Buddies');
  const img = '<img loading="lazy" alt="' + alt + '" src="' + escapeHtml(post.image) + '" />';
  if (link) {
    return '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" class="grid-card reveal">' + img + '</a>';
  }
  return '<div class="grid-card reveal">' + img + '</div>';
}
const gridContainers = document.querySelectorAll('.cat-grid[data-cat]');
if (gridContainers.length) {
  fetch('data/posts.json', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then((posts) => {
      gridContainers.forEach((container) => {
        const cat = container.dataset.cat;
        const items = posts.filter((p) => p.category === cat);
        if (items.length === 0) {
          // 投稿がまだ無いカテゴリーは Coming soon 表示
          container.innerHTML = '<div class="cat-coming reveal"><span>Coming soon</span></div>';
          registerReveal(container.querySelector('.cat-coming'));
        } else {
          container.innerHTML = items.map(gridCardMarkup).join('');
          container.querySelectorAll('.grid-card').forEach(registerReveal);
        }
      });
    })
    .catch((err) => {
      console.error('posts.json の読み込みに失敗しました（ローカルサーバーで開いていますか？）', err);
    });
}

// スクロール追従の縦組みラベル：各コンテンツに来たらタイトルを切り替え
const stickyMark = document.getElementById('stickyMark');
const markSpan = stickyMark ? stickyMark.querySelector('span') : null;
const spies = Array.from(document.querySelectorAll('[data-mark]'));
if (stickyMark && markSpan && spies.length) {
  let current = markSpan.textContent.trim(); // 初期は「Buddies」
  let raf = null;
  const updateMark = () => {
    raf = null;

    // スクロール量に合わせてグラデーションを流す
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    markSpan.style.backgroundPositionY = (p * 100).toFixed(1) + '%';

    const midY = window.innerHeight / 2;
    let active = null;
    for (const el of spies) {
      const r = el.getBoundingClientRect();
      if (r.top <= midY && r.bottom >= midY) { active = el; break; }
    }
    if (active) {
      stickyMark.classList.add('show');
      const label = active.dataset.mark;
      if (label !== current) {
        current = label;
        stickyMark.classList.add('swapping');   // いったんフェードアウト
        setTimeout(() => {
          markSpan.textContent = label;         // 文字を差し替え
          stickyMark.classList.remove('swapping'); // フェードイン
        }, 220);
      }
    } else {
      stickyMark.classList.remove('show');       // コンテンツ外では隠す
    }
  };
  const onScrollMark = () => { if (!raf) raf = requestAnimationFrame(updateMark); };
  updateMark();
  window.addEventListener('scroll', onScrollMark, { passive: true });
  window.addEventListener('resize', onScrollMark);
}

// ヘッダー：明るい(クリーム)セクションの上では要素を黒に切り替え
const header = document.getElementById('siteHeader');
if (header) {
  const lightSections = Array.from(document.querySelectorAll('[data-nav="light"]'));
  const updateHeaderTheme = () => {
    const y = header.offsetHeight * 0.55;   // ヘッダー帯の中あたりを判定
    let onLight = false;
    for (const el of lightSections) {
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) { onLight = true; break; }
    }
    header.classList.toggle('on-light', onLight);
  };
  updateHeaderTheme();
  window.addEventListener('scroll', updateHeaderTheme, { passive: true });
  window.addEventListener('resize', updateHeaderTheme);
}
