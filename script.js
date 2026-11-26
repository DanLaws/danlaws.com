/* Motion house layer (v60 pilot). Paste at the top of a template's script.js, unchanged, inside its own scope.
   Needs a script tag for assets/motion.js BEFORE the one for script.js on every page (both deferred, or neither).
   Reads the template's own tokens, so there is one motion vocabulary: --dur (s or ms), --ease (cubic-bezier) and --travel (px, 12 to 16).
   Reveals: give any element data-reveal; data-reveal="stagger" staggers its direct children. Hidden state lives in CSS under
   html.js and prefers-reduced-motion: no-preference only, so with script off, Motion missing or reduced motion everything is visible.
   Observes with amount 0: never gate a reveal on a visible-area threshold (a clip-path or opacity 0 element reports 0%, lesson L-084). */
(function () {
  var root = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function off() { root.classList.add('motion-off'); }
  if (!M || !M.inView || !M.animate || reduce) { off(); window.House = { motion: false }; return; }
  var cs = getComputedStyle(root);
  var d = cs.getPropertyValue('--dur').trim();
  var dur = /ms$/.test(d) ? parseFloat(d) / 1000 : parseFloat(d) || 0.6;
  var em = (cs.getPropertyValue('--ease').match(/-?\d*\.?\d+/g) || []).map(Number);
  var ease = em.length === 4 ? em : [0.2, 0.7, 0.2, 1];
  var travel = parseFloat(cs.getPropertyValue('--travel')) || 14;
  var opts = { duration: dur, ease: ease };
  function reveal(el) {
    var kids = el.getAttribute('data-reveal') === 'stagger' ? Array.prototype.slice.call(el.children) : null; // an array: Motion does not animate an HTMLCollection
    var targets = kids && kids.length ? kids : [el];
    var gap = dur / 8, total = (dur + (kids ? gap * targets.length : 0)) * 1000 + 400;
    // Hold every target hidden inline, then release the CSS hidden state at once: each child stays hidden until its own turn starts.
    targets.forEach(function (t) { t.style.opacity = '0'; });
    el.classList.add('is-in');
    var settled = false;
    function settle() {
      if (settled) return; settled = true;
      targets.forEach(function (t) { t.style.opacity = ''; t.style.transform = ''; });
    }
    M.animate(targets, { opacity: [0, 1], transform: ['translateY(' + travel + 'px)', 'translateY(0px)'] },
      { duration: dur, ease: ease, delay: kids && M.stagger ? M.stagger(gap) : 0 }).finished.then(settle, settle);
    setTimeout(settle, total); // never leave anything hidden, whatever the animation does
  }
  M.inView('[data-reveal]', function (el) { reveal(el); }, { margin: '0px 0px -8% 0px', amount: 0 });
  // Anything the observer never reached (printed, jumped to by anchor, or above the fold in a short window) is shown after load.
  window.addEventListener('beforeprint', function () { off(); });
  window.House = { motion: true, dur: dur, ease: ease, travel: travel, M: M };
})();

/* danlaws.com (Stipple): menu, the hero film, the copy-a-contact line, the timeline feed, the client list. Plain JS, no dependencies besides the Motion house layer above. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var mo = !!(window.House && window.House.motion);

  /* ---- menu: opens and closes, Escape closes and returns focus, a wider window closes it ---- */
  var tog = $('.links-toggle'), menu = doc.getElementById('menu');
  if (tog && menu) {
    var setOpen = function (open) {
      menu.classList.toggle('open', open);
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      tog.firstElementChild.textContent = open ? 'Close' : 'Menu';
    };
    tog.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); tog.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100) setOpen(false); });
  }

  /* ---- hero film ----
     The poster sits behind the video. The video stays at opacity 0 until it is actually playing, so a refused play() (iOS Low Power Mode, data saver)
     leaves the still and never shows the browser's play glyph. The file is fetched only after load, pauses off-screen and in a hidden tab, and does
     not start for reduced motion or Save-Data. The pause button is keyboard-only (it is clipped until it has focus). */
  var film = $('.reel');
  if (film) {
    var hero = film.closest('.hero');
    var btn = hero && $('.film-toggle', hero);
    var loaded = false, manual = false;
    var label = function () {
      if (!btn) return;
      btn.textContent = film.paused ? 'Play film' : 'Pause film';
      btn.setAttribute('aria-pressed', film.paused ? 'true' : 'false');
    };
    var play = function () {
      if (!loaded) { loaded = true; film.src = (window.matchMedia && window.matchMedia('(max-width: 640px)').matches && film.getAttribute('data-src-m')) || film.getAttribute('data-src'); film.load(); }
      var p = film.play();
      if (p && p.catch) p.catch(function () { film.classList.remove('is-playing'); label(); });
    };
    film.addEventListener('playing', function () { film.classList.add('is-playing'); label(); });
    film.addEventListener('pause', function () { if (!film.ended) film.classList.remove('is-playing'); label(); });
    if (btn) btn.addEventListener('click', function () { if (film.paused) { manual = false; play(); } else { manual = true; film.pause(); } });
    if (!reduce && !saveData) {
      var start = function () { setTimeout(play, 250); };
      if (doc.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!loaded) return;
            if (en.isIntersecting) { if (!manual) play(); } else if (!film.paused) film.pause();
          });
        }).observe(hero);
      }
      doc.addEventListener('visibilitychange', function () {
        if (doc.hidden && !film.paused) film.pause();
        else if (!doc.hidden && loaded && !manual) play();
      });
    } else if (btn) { btn.hidden = true; }
  }

  /* ---- hero line: the four words come in one after another (the finished line is the markup) ---- */
  var words = $$('.hero-title .w');
  if (words.length && mo) {
    House.M.animate(words, { opacity: [0, 1], transform: ['translateY(' + House.travel + 'px)', 'translateY(0px)'] },
      { duration: House.dur, ease: House.ease, delay: House.M.stagger(0.09) }).finished.then(function () {
      words.forEach(function (w) { w.style.opacity = ''; w.style.transform = ''; });
    }, function () {});
  }

  /* ---- the install line ----
     No script: four commands in a list. With script: a tab per tool, one command in a preformatted block, a copy button. Copying writes the command
     to the clipboard, then the words underline one after another and three next steps light up in turn. */
  var inst = $('[data-installer]');
  if (inst) {
    var live = $('.cmd-live', inst), codeEl = $('[data-cmd]', inst), cmds = $$('.cmd-static pre code', inst).map(function (c) { return c.textContent; });
    var tabs = $$('.tab', inst), copyBtn = $('[data-copy]', inst), copyLabel = $('[data-copy-label]', inst), status = $('[data-copy-status]', inst);
    var cur = 0, timer = 0;
    var paint = function () {
      codeEl.innerHTML = '';
      cmds[cur].split(' ').forEach(function (t, i) {
        if (i) codeEl.appendChild(doc.createTextNode(' '));
        var s = doc.createElement('span'); s.className = 'tk'; s.appendChild(doc.createTextNode(t)); var u = doc.createElement('span'); u.className = 'ul'; s.appendChild(u); codeEl.appendChild(s);
      });
    };
    var reset = function () { inst.classList.remove('is-copied'); copyLabel.textContent = 'Copy'; };
    if (live && codeEl && cmds.length && copyBtn) {
      live.hidden = false; inst.classList.add('is-live');
      tabs.forEach(function (b) {
        b.addEventListener('click', function () {
          cur = +b.getAttribute('data-tab');
          tabs.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
          clearTimeout(timer); reset(); status.textContent = ''; paint();
        });
      });
      var done = function () {
        inst.classList.add('is-copied'); copyLabel.textContent = 'Copied'; status.textContent = 'Copied: ' + cmds[cur];
        if (mo) {
          var tk = $$('.tk .ul', codeEl), sq = $$('.sq .fill', inst);
          var clear = function (list) { return function () { list.forEach(function (n) { n.style.transform = ''; }); }; };
          House.M.animate(tk, { transform: ['scaleX(0)', 'scaleX(1)'] }, { duration: House.dur * 0.8, ease: House.ease, delay: House.M.stagger(0.12) }).finished.then(clear(tk), function () {});
          House.M.animate(sq, { transform: ['scale(0)', 'scale(1)'] }, { duration: House.dur * 0.6, ease: House.ease, delay: House.M.stagger(0.2, { startDelay: 0.35 }) }).finished.then(clear(sq), function () {});
        }
        clearTimeout(timer); timer = setTimeout(reset, 5200);
      };
      var fallback = function () {
        var ta = doc.createElement('textarea'); ta.value = cmds[cur]; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
        doc.body.appendChild(ta); ta.select();
        var ok = false; try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
        doc.body.removeChild(ta);
        if (ok) done(); else status.textContent = 'Select the command and copy it with your keyboard.';
      };
      copyBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cmds[cur]).then(done, fallback); else fallback();
      });
    }
  }

  /* ---- the timeline feed: real dates are in the markup. Each row's rule draws across as the row comes up the screen (decoration only) ---- */
  var rows = $$('[data-feed] .entry');
  if (rows.length && mo && House.M.scroll) {
    rows.forEach(function (r) {
      var rule = $('.rule', r);
      if (rule) House.M.scroll(House.M.animate(rule, { transform: ['scaleX(0)', 'scaleX(1)'] }, { ease: 'linear' }), { target: r, offset: ['start 96%', 'start 62%'] });
    });
  }

  /* ---- sponsors settle: each name starts a little above or below its line and comes to rest as the list reaches the middle of the screen ---- */
  var tiers = $('[data-sponsors]');
  if (tiers && mo && House.M.scroll) {
    var names = $$('.sp', tiers);
    var amp = window.innerWidth < 641 ? 6 : 10;
    var offs = names.map(function (_, i) { return ((i * 5) % 3 - 1) * amp; });
    House.M.scroll(function (p) {
      var k = 1 - Math.min(1, Math.max(0, p));
      names.forEach(function (el, i) {
        el.style.transform = k > 0.001 ? 'translateY(' + (offs[i] * k).toFixed(1) + 'px)' : '';
        el.style.opacity = k > 0.001 ? (1 - 0.7 * k).toFixed(2) : '';
      });
    }, { target: tiers, offset: ['start 96%', 'start 40%'] });
  }

  /* ---- inner page heroes: the plate wipes in from its own edge and the photograph settles; the words are in the markup ---- */
  var plate = $('.ph .ph-plate');
  if (plate && mo) {
    var ph = plate.closest('.ph'), pic = $('.ph-img img', ph), t = $('.ph-title', ph);
    var from = /plate-r|column-r/.test(ph.className) ? 'inset(0 0 0 100%)' : /hung-tl/.test(ph.className) ? 'inset(0 0 100% 0)' : /foot-c|plate-bl/.test(ph.className) ? 'inset(100% 0 0 0)' : 'inset(0 100% 0 0)';
    var clean = function (el, props) { return function () { props.forEach(function (k) { el.style[k] = ''; }); }; };
    House.M.animate(plate, { clipPath: [from, 'inset(0 0 0 0)'] }, { duration: House.dur, ease: House.ease }).finished.then(clean(plate, ['clipPath']), function () {});
    if (pic) House.M.animate(pic, { transform: ['scale(1.04)', 'scale(1)'] }, { duration: House.dur * 2, ease: House.ease }).finished.then(clean(pic, ['transform']), function () {});
    if (t) House.M.animate(t, { opacity: [0, 1], transform: ['translateY(' + House.travel + 'px)', 'translateY(0px)'] }, { duration: House.dur, ease: House.ease, delay: House.dur * 0.35 }).finished.then(clean(t, ['opacity', 'transform']), function () {});
  }

  /* ---- documentation: the section being read is marked in the section list ---- */
  var dsecs = $$('.docmain .dsec');
  if (dsecs.length && 'IntersectionObserver' in window) {
    var links = $$('.docside a');
    var mark = function (id) { links.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
    var seen = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      for (var i = 0; i < dsecs.length; i++) { if (seen[dsecs[i].id]) { mark(dsecs[i].id); break; } }
    }, { rootMargin: '-20% 0px -60% 0px' });
    dsecs.forEach(function (s) { spy.observe(s); });
  }

  /* ---- releases: show only one kind of change. No script: every change shows ---- */
  var filt = $('[data-filters]');
  if (filt) {
    filt.hidden = false;
    var chips = $$('.fk', filt), statusEl = $('[data-filter-status]'), entries = $$('[data-feed] .entry');
    var kindWords = { all: 'everything', Built: 'things built', Shipped: 'launches', Led: 'leadership' };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var kind = c.getAttribute('data-kind'), shown = 0;
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        entries.forEach(function (en) {
          var any = false;
          $$('.chg li', en).forEach(function (li) { var on = kind === 'all' || li.getAttribute('data-kind') === kind; li.hidden = !on; if (on) any = true; });
          en.hidden = !any; if (any) shown++;
        });
        statusEl.textContent = 'Showing ' + shown + ' entries with ' + kindWords[kind] + '.';
      });
    });
  }

  /* ---- contact form: labelled errors in text; a valid note is posted to Dan's dashboard, then a confirmation or a reason it failed.
     The hidden "website" field and the time the page was open let the dashboard ignore bots. On a local preview it posts to the local dashboard. ---- */
  $$('form[data-contact-form]').forEach(function (f) {
    var done = $('.c-done', f), failNote = $('.c-fail', f), btn = $('button[type="submit"]', f);
    var fields = $$('input[required], select[required], textarea[required]', f);
    var opened = Date.now();
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var endpoint = local ? 'http://localhost:3000/api/contact' : f.getAttribute('data-endpoint');
    var value = function (n) { var el = f.elements.namedItem(n); return el && el.value ? el.value.trim() : ''; };
    var show = function (el) { el.hidden = false; el.setAttribute('tabindex', '-1'); el.focus(); };
    var failed = function (status) {
      failNote.textContent = status === 429
        ? 'A lot of notes have arrived just now. Try again in an hour.'
        : 'Sorry, that didn’t send. Try again in a few minutes, or find me on GitHub.';
      show(failNote);
    };
    var fail = function (el, msg) {
      var er = doc.getElementById(el.id + '-e');
      el.setAttribute('aria-invalid', 'true');
      if (er) { el.setAttribute('aria-describedby', er.id); er.textContent = msg; er.hidden = false; }
      return el;
    };
    var clearOne = function (el) {
      var er = doc.getElementById(el.id + '-e');
      el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby');
      if (er) { er.hidden = true; er.textContent = ''; }
    };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.classList.contains('is-sending')) return;
      var bad = [];
      fields.forEach(function (el) {
        clearOne(el);
        var v = (el.value || '').trim();
        if (el.type === 'checkbox') { if (!el.checked) bad.push(fail(el, 'Tick the box so I can reply.')); return; }
        if (!v) { bad.push(fail(el, el.tagName === 'SELECT' ? 'Choose one.' : 'This one is needed.')); return; }
        if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) bad.push(fail(el, 'That does not look like an email address.'));
      });
      done.hidden = true; failNote.hidden = true;
      if (bad.length) { bad[0].focus(); return; }

      var label = btn.textContent;
      f.classList.add('is-sending'); btn.disabled = true; btn.textContent = 'Sending…';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: value('name'), email: value('email'), topic: value('topic'), message: value('message'),
          ok: f.elements.namedItem('ok').checked, website: value('website'), elapsed: Date.now() - opened
        })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok && j.ok) { f.reset(); show(done); } else failed(r.status);
        });
      }, function () { failed(0); }).then(function () {
        f.classList.remove('is-sending'); btn.disabled = false; btn.textContent = label;
      });
    });
    var again = function (e) { if (e.target.id && e.target.getAttribute('aria-invalid')) clearOne(e.target); };
    f.addEventListener('input', again); f.addEventListener('change', again);
  });

  /* ---- the Booked inline panel (contact page): mark the frame when keyboard focus moves into it ---- */
  window.addEventListener('blur', function () {
    var el = doc.activeElement;
    if (el && el.tagName === 'IFRAME') el.classList.add('is-focused');
  });
  window.addEventListener('focus', function () {
    $$('iframe.is-focused').forEach(function (fr) { fr.classList.remove('is-focused'); });
  });
})();
