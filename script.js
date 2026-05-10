'use strict';

(function initAll() {

    // 1. EFEITO NO HEADER (Ajustado o trigger do scroll para a nova "pílula")
    const header = document.getElementById('header');
    function onScroll() {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 2. SCROLL REVEAL E CONTADORES ANIMADOS
    const reveals = document.querySelectorAll('.reveal-up');
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000;
            const increment = target / (duration / 16);

            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
        });
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('stats-grid') && !countersAnimated) {
                    animateCounters();
                    countersAnimated = true;
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(reveal => revealObserver.observe(reveal));

    // 3. CALCULADORA DE ESTIMATIVA DE FRETE
    const rangePeso = document.getElementById('calcPeso');
    const rangeDist = document.getElementById('calcDistancia');
    const txtPeso = document.getElementById('valPeso');
    const txtDist = document.getElementById('valDistancia');
    const txtTotal = document.getElementById('valTotal');

    function calcularFrete() {
        if (!rangePeso || !rangeDist) return;

        const peso = parseInt(rangePeso.value);
        const distancia = parseInt(rangeDist.value);

        txtPeso.innerText = peso + " Ton";
        txtDist.innerText = distancia + " Km";

        // Fórmula base fictícia
        const valorBase = peso * distancia * 0.35;
        const valorMin = valorBase * 0.90;
        const valorMax = valorBase * 1.10;

        const formataBRL = (valor) => {
            return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
        }

        txtTotal.innerText = `${formataBRL(valorMin)} - ${formataBRL(valorMax)}`;
    }

    if (rangePeso && rangeDist) {
        rangePeso.addEventListener('input', calcularFrete);
        rangeDist.addEventListener('input', calcularFrete);
        calcularFrete();
    }

    // 4. ENVIO DO FORMULÁRIO DE COTAÇÃO
    const form = document.getElementById('cotacaoForm');
    const successMsg = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            successMsg.hidden = false;
            form.reset();
            setTimeout(() => {
                successMsg.hidden = true;
            }, 5000);
        });
    }

    // 5. SCROLL SUAVE (Compensando o header flutuante)
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            // Header height + margem superior
            const offset = 90; 
            const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({ top: targetTop, behavior: 'smooth' });
        });
    });

    // 6. MENU MOBILE
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav');
    const navOverlay = document.getElementById('navOverlay');
    const navLinksMobile = navMenu.querySelectorAll('.nav__link');

    function toggleMenu() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('open');
        navOverlay.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
        navOverlay.addEventListener('click', toggleMenu);

        navLinksMobile.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('open')) toggleMenu();
            });
        });
    }

})();