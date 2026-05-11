'use strict';

(function initAll() {

    // TODO: substitua pelo numero real de WhatsApp (so digitos, com DDI)
    // Exemplo: '5565999998888' para (65) 99999-8888
    var WPP_NUMBER = '5565999999999';


    /* ============================================================
       1. HEADER - scroll effect
       ============================================================ */
    var header = document.getElementById('header');

    function onScroll() {
        header.classList.toggle('scrolled', window.scrollY > 20);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();


    /* ============================================================
       2. SCROLL REVEAL + ANIMACAO DOS CONTADORES
       ============================================================ */
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveals = document.querySelectorAll('.reveal-up');
    var counters = document.querySelectorAll('.stat-number');
    var countersAnimated = false;

    function animateCounters() {
        if (prefersReducedMotion) {
            counters.forEach(function (c) { c.innerText = c.getAttribute('data-target'); });
            return;
        }
        counters.forEach(function (counter) {
            var target = +counter.getAttribute('data-target');
            var duration = 2000;
            var increment = target / (duration / 16);
            var current = 0;
            function tick() {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(tick);
                } else {
                    counter.innerText = target;
                }
            }
            tick();
        });
    }

    var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            if (entry.target.classList.contains('stats-grid') && !countersAnimated) {
                animateCounters();
                countersAnimated = true;
            }
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    if (prefersReducedMotion) {
        reveals.forEach(function (el) { el.classList.add('active'); });
        animateCounters();
        countersAnimated = true;
    } else {
        reveals.forEach(function (el) { revealObserver.observe(el); });
    }


    /* ============================================================
       3. TRACKING BAR - abre WhatsApp com codigo pre-preenchido
       ============================================================ */
    var trackBtn = document.getElementById('trackBtn');
    var trackInput = document.getElementById('trackInput');

    if (trackBtn && trackInput) {
        trackBtn.addEventListener('click', function () {
            var codigo = trackInput.value.trim();
            var msg = codigo
                ? 'Ola! Gostaria de rastrear minha carga. Codigo/pedido: ' + codigo
                : 'Ola! Gostaria de consultar o status da minha carga.';
            window.open('https://wa.me/' + WPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
        });

        trackInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') trackBtn.click();
        });
    }


    /* ============================================================
       4. CALCULADORA com formula calibrada
         Base: tabela ANTT de frete graneis (MT)
         ~R$0.22/ton-km curtas, ~R$0.13 longas + custo fixo por viagem
       ============================================================ */
    var rangePeso = document.getElementById('calcPeso');
    var rangeDist = document.getElementById('calcDistancia');
    var txtPeso = document.getElementById('valPeso');
    var txtDist = document.getElementById('valDistancia');
    var txtTotal = document.getElementById('valTotal');

    function calcularFrete() {
        if (!rangePeso || !rangeDist) return;

        var peso = parseInt(rangePeso.value, 10);
        var distKm = parseInt(rangeDist.value, 10);

        txtPeso.innerText = peso + ' Ton';
        txtDist.innerText = distKm.toLocaleString('pt-BR') + ' Km';

        var taxa;
        if (distKm <= 300) taxa = 0.24;
        else if (distKm <= 700) taxa = 0.20;
        else if (distKm <= 1200) taxa = 0.17;
        else if (distKm <= 2000) taxa = 0.15;
        else taxa = 0.13;

        var custoFixo = 600 + (distKm * 0.04);
        var base = (peso * distKm * taxa) + custoFixo;
        var valorRef = Math.max(base, 2200);

        var min = valorRef * 0.90;
        var max = valorRef * 1.10;

        function fmt(v) {
            return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
        }

        txtTotal.innerText = fmt(min) + ' - ' + fmt(max);
    }

    if (rangePeso && rangeDist) {
        rangePeso.addEventListener('input', calcularFrete);
        rangeDist.addEventListener('input', calcularFrete);
        calcularFrete();
    }


    /* ============================================================
       5. MASCARA DE TELEFONE
       ============================================================ */
    var telInput = document.getElementById('telefone');

    function applyPhoneMask(e) {
        var v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);

        if (v.length > 10) {
            v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (v.length > 6) {
            v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, function (_, ddd, p1, p2) {
                return p2 ? '(' + ddd + ') ' + p1 + '-' + p2 : '(' + ddd + ') ' + p1;
            });
        } else if (v.length > 2) {
            v = v.replace(/^(\d{2})(\d+)/, '($1) $2');
        } else if (v.length > 0) {
            v = '(' + v;
        }

        e.target.value = v;
    }

    if (telInput) {
        telInput.addEventListener('input', applyPhoneMask);
        telInput.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && telInput.value.slice(-1).match(/[\s\-()]/)) {
                e.preventDefault();
                telInput.value = telInput.value.slice(0, -1);
            }
        });
    }


    /* ============================================================
       6. VALIDACAO DO FORMULARIO
       ============================================================ */
    var requiredFields = [
        { id: 'nome', label: 'Nome Completo e obrigatorio.' },
        { id: 'telefone', label: 'Telefone e obrigatorio.' },
        { id: 'origem', label: 'Local de coleta e obrigatorio.' },
        { id: 'destino', label: 'Local de entrega e obrigatorio.' },
        { id: 'tipoCarga', label: 'Selecione o tipo de produto.' },
    ];

    function validateField(fieldId) {
        var el = document.getElementById(fieldId);
        var err = document.getElementById('erro-' + fieldId);
        var rule = requiredFields.find(function (f) { return f.id === fieldId; });
        if (!el || !rule) return true;

        var isEmpty = !el.value.trim();
        el.classList.toggle('is-invalid', isEmpty);
        if (err) err.textContent = isEmpty ? rule.label : '';
        return !isEmpty;
    }

    function validateForm() {
        var allValid = true;
        requiredFields.forEach(function (f) {
            if (!validateField(f.id)) allValid = false;
        });

        var emailEl = document.getElementById('email');
        if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
            emailEl.classList.add('is-invalid');
            allValid = false;
        } else if (emailEl) {
            emailEl.classList.remove('is-invalid');
        }

        return allValid;
    }

    requiredFields.forEach(function (rf) {
        var el = document.getElementById(rf.id);
        if (el) {
            el.addEventListener('input', function () { validateField(rf.id); });
            el.addEventListener('change', function () { validateField(rf.id); });
        }
    });


    /* ============================================================
       7. ENVIO DO FORMULARIO via WhatsApp (sem backend)
          Ao submeter, abre o WhatsApp com todos os dados formatados.
       ============================================================ */
    var form = document.getElementById('cotacaoForm');
    var successMsg = document.getElementById('formSuccess');
    var errorMsg = document.getElementById('formErrorGlobal');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            successMsg.hidden = true;
            errorMsg.hidden = true;

            if (!validateForm()) {
                var firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            var nome = document.getElementById('nome').value.trim();
            var empresa = document.getElementById('empresa').value.trim();
            var telefone = document.getElementById('telefone').value.trim();
            var email = document.getElementById('email').value.trim();
            var origem = document.getElementById('origem').value.trim();
            var destino = document.getElementById('destino').value.trim();
            var tipoCarga = document.getElementById('tipoCarga').value.trim();
            var peso = document.getElementById('pesoVolume').value.trim();
            var dataRaw = document.getElementById('dataColeta').value;
            var obs = document.getElementById('observacoes').value.trim();

            var dataFmt = '';
            if (dataRaw) {
                dataFmt = new Date(dataRaw + 'T12:00:00').toLocaleDateString('pt-BR');
            }

            var linhas = [
                'Solicitacao de Cotacao - Matos Transportes',
                '',
                'Nome: ' + nome,
                empresa ? 'Empresa: ' + empresa : '',
                'Telefone: ' + telefone,
                email ? 'E-mail: ' + email : '',
                '',
                'Origem: ' + origem,
                'Destino: ' + destino,
                'Produto: ' + tipoCarga,
                peso ? 'Volume: ' + peso : '',
                dataFmt ? 'Data desejada: ' + dataFmt : '',
                obs ? 'Observacoes: ' + obs : '',
            ];

            var mensagem = linhas.filter(function (l) { return l !== ''; }).join('\n');
            var url = 'https://wa.me/' + WPP_NUMBER + '?text=' + encodeURIComponent(mensagem);

            window.open(url, '_blank', 'noopener,noreferrer');

            successMsg.hidden = false;
            form.reset();
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }


    /* ============================================================
       8. SCROLL SUAVE com compensacao do header flutuante
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;

            var target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            var offset = 90;
            var targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });

            if (navMenu.classList.contains('open')) toggleMenu();
        });
    });


    /* ============================================================
       9. MENU MOBILE
       ============================================================ */
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.getElementById('nav');
    var navOverlay = document.getElementById('navOverlay');

    function toggleMenu() {
        var isOpen = navMenu.classList.toggle('open');
        hamburger.classList.toggle('active', isOpen);
        navOverlay.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
        navOverlay.addEventListener('click', toggleMenu);
    }


    /* ============================================================
       10. PAUSA DE VIDEO quando prefers-reduced-motion
       ============================================================ */
    if (prefersReducedMotion) {
        var video = document.querySelector('.hero__video');
        if (video) {
            video.pause();
            video.removeAttribute('autoplay');
        }
    }

})();