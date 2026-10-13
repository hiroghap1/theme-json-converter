// ワイヤー閲覧用ツールバー（表示幅・言語・注釈の切り替え）
(function () {
    var body = document.body;
    var viewButtons = document.querySelectorAll('[data-view]');
    var langLinks = document.querySelectorAll('[data-lang-link]');

    function setView(view) {
        body.classList.toggle('sp', view === 'sp');
        viewButtons.forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view));
        });
        // 言語を切り替えても表示幅を引き継ぐ
        langLinks.forEach(function (a) { a.search = view === 'sp' ? '?view=sp' : ''; });
    }
    viewButtons.forEach(function (btn) {
        btn.addEventListener('click', function () { setView(btn.getAttribute('data-view')); });
    });
    // ?view=sp で SP 表示から開く
    setView(/[?&]view=sp\b/.test(location.search) ? 'sp' : 'pc');

    var notes = document.getElementById('toggle-notes');
    notes.addEventListener('click', function () {
        var show = notes.getAttribute('aria-pressed') !== 'true';
        notes.setAttribute('aria-pressed', String(show));
        notes.textContent = show ? '注釈を表示' : '注釈を非表示';
        body.classList.toggle('no-notes', !show);
    });
})();
