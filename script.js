'use strict';

(function initAll() {

    /* ============================================================
       1. HEADER — scroll effect
       ============================================================ */
    const header = document.getElementById('header');

    function onScroll() {
        header.classList.toggle('scrolled', window.scrollY > 20);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();


    /* ============================================================
       2. SCROLL REVEAL + ANIMAÇÃO DOS CONTADORES
       ============================================================ */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = document.querySelectorAll('.reveal-up');
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;

    // ✅ MELHORIA 13: respeita prefers-reduced-motion nos contadores
    function animateCounters() {
        if (prefersReducedMotion) {
            counters.forEach(c => { c.innerText = c.getAttribute('data-target'); });
            return;
        }

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const tick = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(tick);
                } else {
                    counter.innerText = target;
                }
            };
            tick();
        });
    }

    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');

            if (entry.target.classList.contains('stats-grid') && !countersAnimated) {
                animateCounters();
                countersAnimated = true;
            }
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    // Se reduced-motion, revela tudo imediatamente
    if (prefersReducedMotion) {
        reveals.forEach(el => el.classList.add('active'));
        animateCounters();
        countersAnimated = true;
    } else {
        reveals.forEach(el => revealObserver.observe(el));
    }


    /* ============================================================
       3. ✅ MELHORIA 3: TRACKING BAR → WhatsApp com texto pré-preenchido
       ============================================================ */
    const trackBtn = document.getElementById('trackBtn');
    const trackInput = document.getElementById('trackInput');

    // TODO: Substitua 5565999999999 pelo número real de WhatsApp
    const WPP_NUMBER = '5565999999999';

    if (trackBtn && trackInput) {
        trackBtn.addEventListener('click', () => {
            const codigo = trackInput.value.trim();
            const msg = codigo
                ? `Olá! Gostaria de rastrear minha carga. Código/pedido: ${codigo}`
                : 'Olá! Gostaria de consultar o status da minha carga.';
            const url = `https://wa.me/${WPP_NUMBER}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        });

        trackInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') trackBtn.click();
        });
    }


    /* ============================================================
       4. ✅ MELHORIA 7: CALCULADORA com fórmula calibrada
          Referência: tabela ANTT de frete de grãos a granel (MT)
          Base: ~R$0,22/ton-km para distâncias curtas,
                ~R$0,16/ton-km para distâncias longas + custo fixo por viagem
       ============================================================ */
    const rangePeso = document.getElementById('calcPeso');
    const rangeDist = document.getElementById('calcDistancia');
    const txtPeso = document.getElementById('valPeso');
    const txtDist = document.getElementById('valDistancia');
    const txtTotal = document.getElementById('valTotal');

    function calcularFrete() {
        if (!rangePeso || !rangeDist) return;

        const peso = parseInt(rangePeso.value, 10);
        const distKm = parseInt(rangeDist.value, 10);

        txtPeso.innerText = peso + ' Ton';
        txtDist.innerText = distKm.toLocaleString('pt-BR') + ' Km';

        // Taxa por ton-km decresce com a distância (economia de escala)
        let taxaPorTonKm;
        if (distKm <= 300) taxaPorTonKm = 0.24;
        else if (distKm <= 700) taxaPorTonKm = 0.20;
        else if (distKm <= 1200) taxaPorTonKm = 0.17;
        else if (distKm <= 2000) taxaPorTonKm = 0.15;
        else taxaPorTonKm = 0.13;

        // Custo fixo por viagem (pedágio estimado, diárias, seguros)
        const custoFixo = 600 + (distKm * 0.04);

        const baseTotal = (peso * distKm * taxaPorTonKm) + custoFixo;

        // Mínimo de carga por viagem (custo fixo de mobilizar o caminhão)
        const minViagem = 2200;
        const valorRef = Math.max(baseTotal, minViagem);

        // Faixa ± 10%
        const valorMin = valorRef * 0.90;
        const valorMax = valorRef * 1.10;

        const formatBRL = v =>
            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

        txtTotal.innerText = `${formatBRL(valorMin)} – ${formatBRL(valorMax)}`;
    }

    if (rangePeso && rangeDist) {
        rangePeso.addEventListener('input', calcularFrete);
        rangeDist.addEventListener('input', calcularFrete);
        calcularFrete(); // valor inicial
    }


    /* ============================================================
       5. ✅ MELHORIA 6: MÁSCARA DE TELEFONE
       ============================================================ */
    const telInput = document.getElementById('telefone');

    function applyPhoneMask(e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);

        if (v.length > 10) {
            // Celular: (00) 00000-0000
            v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (v.length > 6) {
            // Fixo: (00) 0000-0000 em digitação
            v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, (_, ddd, p1, p2) =>
                p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`
            );
        } else if (v.length > 2) {
            v = v.replace(/^(\d{2})(\d+)/, '($1) $2');
        } else if (v.length > 0) {
            v = v.replace(/^(\d+)/, '($1');
        }

        e.target.value = v;
    }

    if (telInput) {
        telInput.addEventListener('input', applyPhoneMask);
        telInput.addEventListener('keydown', e => {
            // Permite Backspace apagar o hífen/parêntese corretamente
            if (e.key === 'Backspace' && telInput.value.slice(-1).match(/[\s\-()]/)) {
                e.preventDefault();
                telInput.value = telInput.value.slice(0, -1);
            }
        });
    }


    /* ============================================================
       6. ✅ MELHORIA 5: VALIDAÇÃO DO FORMULÁRIO
       ============================================================ */
    const requiredFields = [
        { id: 'nome', label: 'Nome Completo é obrigatório.' },
        { id: 'telefone', label: 'Telefone é obrigatório.' },
        { id: 'origem', label: 'Local de coleta é obrigatório.' },
        { id: 'destino', label: 'Local de entrega é obrigatório.' },
        { id: 'tipoCarga', label: 'Selecione o tipo de produto.' },
    ];

    function validateField(fieldId) {
        const el = document.getElementById(fieldId);
        const err = document.getElementById(`erro-${fieldId}`);
        const rule = requiredFields.find(f => f.id === fieldId);
        if (!el || !rule) return true;

        const isEmpty = !el.value.trim();
        el.classList.toggle('is-invalid', isEmpty);
        if (err) err.textContent = isEmpty ? rule.label : '';
        return !isEmpty;
    }

    function validateForm() {
        let allValid = true;
        requiredFields.forEach(f => {
            if (!validateField(f.id)) allValid = false;
        });

        // Validação extra: email formato
        const emailEl = document.getElementById('email');
        if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
            emailEl.classList.add('is-invalid');
            allValid = false;
        } else if (emailEl) {
            emailEl.classList.remove('is-invalid');
        }

        return allValid;
    }

    // Limpa erro ao digitar no campo
    requiredFields.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => validateField(id));
            el.addEventListener('change', () => validateField(id));
        }
    });


    /* ============================================================
       7. ✅ MELHORIA 1: ENVIO DO FORMULÁRIO via Formspree
       ============================================================ */
    const form = document.getElementById('cotacaoForm');
    const successMsg = document.getElementById('formSuccess');
    const errorGlobal = document.getElementById('formErrorGlobal');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');

    function setSubmitting(loading) {
        if (!submitBtn) return;
        submitBtn.disabled = loading;
        if (btnText) btnText.hidden = loading;
        if (btnLoading) btnLoading.hidden = !loading;
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Esconde mensagens anteriores
            successMsg.hidden = true;
            errorGlobal.hidden = true;

            // Valida antes de enviar
            if (!validateForm()) {
                // Foca no primeiro campo inválido
                const firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            setSubmitting(true);

            try {
                const data = new FormData(form);

                /*
                 * INSTRUÇÕES FORMSPREE:
                 * 1. Acesse https://formspree.io e crie uma conta gratuita
                 * 2. Crie um novo formulário → copie o ID (ex: xpzgkwqr)
                 * 3. O action do <form> já está com o endpoint correto.
                 *    Basta substituir "SEU_FORM_ID_AQUI" no HTML pelo ID real.
                 * 4. Formspree envia os dados por e-mail automaticamente.
                 */
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    successMsg.hidden = false;
                    form.reset();
                    // Scroll suave até a mensagem de sucesso
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    // Formspree retorna erros estruturados
                    const json = await response.json().catch(() => ({}));
                    console.error('Formspree error:', json);
                    errorGlobal.hidden = false;
                }

            } catch (err) {
                console.error('Fetch error:', err);
                errorGlobal.hidden = false;
            } finally {
                setSubmitting(false);
            }
        });
    }


    /* ============================================================
       8. SCROLL SUAVE (com compensação do header flutuante)
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const offset = 90;
            const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });

            // Fecha menu mobile se estiver aberto
            if (navMenu.classList.contains('open')) toggleMenu();
        });
    });


    /* ============================================================
       9. MENU MOBILE
       ============================================================ */
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav');
    const navOverlay = document.getElementById('navOverlay');

    function toggleMenu() {
        const isOpen = navMenu.classList.toggle('open');
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
       10. PAUSA DE VÍDEO quando prefers-reduced-motion
       ============================================================ */
    if (prefersReducedMotion) {
        const video = document.querySelector('.hero__video');
        if (video) {
            video.pause();
            video.removeAttribute('autoplay');
        }
    }

})();