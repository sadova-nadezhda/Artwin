
(() => {
  "use strict";

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

  const createScrollLock = (lenis) => {
    const locks = new Set();

    const apply = () => {
      if (locks.size) {
        document.body.classList.add("no-scroll");
        lenis?.stop?.();
      } else {
        document.body.classList.remove("no-scroll");
        lenis?.start?.();
      }
    };

    return {
      lock: (key) => {
        if (!key) return;
        locks.add(key);
        apply();
      },
      unlock: (key) => {
        if (!key) return;
        locks.delete(key);
        apply();
      },
      reset: () => {
        locks.clear();
        apply();
      },
      has: (key) => locks.has(key),
    };
  };

  const state = {
    multiplier: 1,
    swipers: {},
  };

  // ======================
  // Lenis
  // ======================
  const initLenis = () => {
    if (typeof Lenis === "undefined") return null;
    const lenis = new Lenis({ autoRaf: true });
    window.lenis = lenis;
    return lenis;
  };

  // ======================
  // Multiplier / s()
  // ======================
  const getWidthMultiplier = () => {
    const w = window.innerWidth;
    const minSide = Math.min(window.innerWidth, window.innerHeight);

    if (w <= 767) return minSide / 375;
    if (w <= 1024) return minSide / 768;
    return window.innerWidth / 1440;
  };

  const updateMultiplier = () => {
    state.multiplier = getWidthMultiplier();
  };

  const s = (value) => value * state.multiplier;

  // ======================
  // Header
  // ======================
  const initBurger = ({ scrollLock }) => {
    const burger = $(".header__burger");
    const mobile = $(".header__mobile");
    const closeBtn = $(".header__mobile-close");
    if (!burger || !mobile) return;

    const open = () => {
      mobile.classList.add("is-open");
      burger.classList.add("header__burger--open");
      scrollLock?.lock?.("mobile-menu");
    };

    const close = () => {
      mobile.classList.remove("is-open");
      burger.classList.remove("header__burger--open");
      scrollLock?.unlock?.("mobile-menu");
    };

    burger.addEventListener("click", () => {
      mobile.classList.contains("is-open") ? close() : open();
    });

    closeBtn?.addEventListener("click", close);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobile.classList.contains("is-open")) close();
    });

    $$(".header__mobile-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const item = trigger.closest(".header__mobile-item--has-drop");
        if (!item) return;
        item.classList.toggle("header__mobile-item--open");
      });
    });
  };

  const initHeaderDropdown = () => {
    const items = $$(".header__menu-item--has-drop");
    if (!items.length) return;

    items.forEach((item) => {
      const trigger = $(".header__menu-trigger", item);
      if (!trigger) return;

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = item.classList.contains("header__menu-item--open");
        items.forEach((i) => i.classList.remove("header__menu-item--open"));
        if (!isOpen) item.classList.add("header__menu-item--open");
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header__menu-item--has-drop")) {
        items.forEach((i) => i.classList.remove("header__menu-item--open"));
      }
    });
  };

  // ======================
  // Swipers
  // ======================

  const initSwipers = () => {
    if (typeof Swiper === "undefined") return;

    if (document.querySelector(".header__drop-swiper")) {
      state.swipers.headerDrop = new Swiper(".header__drop-swiper", {
        slidesPerView: 5.5,
        grabCursor: true,
        pagination: {
          el: ".swiper-pagination",
          type: "progressbar",
        },
      });
    }

    if (document.querySelector(".benefitsSwiper")) {
      state.swipers.benefits = new Swiper('.benefitsSwiper', {
        slidesPerView: 1.08,
        spaceBetween: s(8),
        grabCursor: true,
        breakpoints: {
          768: {
            slidesPerView: 2.03,
          },
          1025: {
            slidesPerView: 3,
          },
        }
      });
    }

    if (document.querySelector(".howSwiper")) {
      state.swipers.how = new Swiper('.howSwiper', {
        slidesPerView: 1.08,
        spaceBetween: s(8),
        grabCursor: true,
        breakpoints: {
          768: {
            slidesPerView: 2.03,
          },
          1025: {
            slidesPerView: 3,
          },
        }
      });
    }

    if (document.querySelector(".expSwiper")) {
      state.swipers.how = new Swiper('.expSwiper', {
        slidesPerView: 1.08,
        spaceBetween: s(8),
        grabCursor: true,
        breakpoints: {
          768: {
            slidesPerView: 2.03,
          },
          1025: {
            slidesPerView: 4,
          },
        }
      });
    }

    if (document.querySelector(".gallerySwiper")) {
      state.swipers.gallery = new Swiper('.gallerySwiper', {
        slidesPerView: 1.2,
        spaceBetween: s(8),
        grabCursor: true,
        loop: true,
        breakpoints: {
          768: {
            centeredSlides: true,
          },
        }
      });
    }
  };

  // ======================
  // Phone mask
  // ======================
  const initPhoneMask = () => {
    // Лид-форма использует intl-tel-input со своей маской — исключаем её
    const inputs = $$('input[type="tel"]:not([data-lead-phone])');
    if (!inputs.length) return;

    const format = (value, matrix) => {
      const max = (matrix.match(/_/g) || []).length;
      const digits = value.replace(/\D/g, "").slice(0, max);
      if (!digits) return "";

      let res = "";
      let i = 0;
      for (const ch of matrix) {
        if (ch === "_") {
          if (i >= digits.length) break;
          res += digits[i++];
        } else {
          res += ch;
        }
      }
      return res.replace(/[^\d]+$/, "");
    };

    inputs.forEach((input) => {
      const matrix = input.dataset.mask || "+7 (___) ___ ____";
      input.addEventListener("input", () => {
        input.value = format(input.value, matrix);
      });
    });
  };

  // ======================
  // Lead form (заявка)
  // ======================
  const initLeadForm = () => {
    const form = $("[data-lead]");
    if (!form) return;

    const PROGRESS = {
      1: ["55%", "0%"],
      2: ["100%", "70%"],
    };

    const steps = $$(".lead__step", form);
    const segs = $$(".lead__seg", form);
    const progress = $("[data-lead-progress]", form);
    const phone = $("[data-lead-phone]", form);
    const nextBtn = $('[data-action="next"]', form);
    const backBtn = $('[data-action="back"]', form);

    // ---- intl-tel-input (выпадашка с кодами стран) ----
    let iti = null;
    if (window.intlTelInput) {
      iti = window.intlTelInput(phone, {
        initialCountry: "kg",
        countryOrder: ["kg", "kz", "ru", "uz"],
        separateDialCode: true,
        strictMode: true,
        loadUtils: () => import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/intl-tel-input@25/build/js/utils.js"),
      });
    }

    const isPhoneValid = () => {
      if (iti && typeof iti.isValidNumber === "function") {
        const valid = iti.isValidNumber();
        if (valid !== null && valid !== undefined) return valid;
      }
      return phone.value.replace(/\D/g, "").length >= 6;
    };

    const getPhoneNumber = () => {
      if (!iti) return phone.value;
      const full = typeof iti.getNumber === "function" ? iti.getNumber() : "";
      if (full) return full;
      const cc = iti.getSelectedCountryData?.().dialCode;
      return cc ? `+${cc} ${phone.value}`.trim() : phone.value;
    };

    const setStep = (name) => {
      steps.forEach((step) => step.classList.toggle("is-active", step.dataset.step === String(name)));
      const fills = PROGRESS[name];
      if (fills) {
        progress.style.display = "";
        segs.forEach((seg, i) => seg.style.setProperty("--fill", fills[i] || "0%"));
      } else {
        progress.style.display = "none";
      }
    };

    const typeRadios = $$('input[name="type"]', form);
    const getType = () => (typeRadios.find((r) => r.checked) || typeRadios[0])?.value || "residential";

    const setVariant = (variant) => {
      $$("[data-variant]", form).forEach((el) => {
        const active = el.dataset.variant === variant;
        el.classList.toggle("is-active", active);
        if (el.matches("input, select, textarea, button")) el.disabled = !active;
        $$("input, select, textarea, button", el).forEach((ctrl) => (ctrl.disabled = !active));
      });
    };

    const syncNext = () => {
      nextBtn.disabled = !isPhoneValid();
    };

    typeRadios.forEach((radio) => {
      radio.addEventListener("change", () => setVariant(radio.value));
    });

    phone.addEventListener("input", syncNext);
    phone.addEventListener("countrychange", syncNext);
    phone.addEventListener("input", () => Promise.resolve().then(syncNext), { once: true });

    nextBtn.addEventListener("click", () => {
      if (!isPhoneValid()) {
        phone.focus();
        return;
      }
      setStep(2);
    });

    backBtn?.addEventListener("click", () => setStep(1));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const step2 = steps.find((s) => s.dataset.step === "2");
      if (!step2 || !step2.classList.contains("is-active")) return;

      const data = Object.fromEntries(new FormData(form).entries());
      data.phone = getPhoneNumber();
      console.log("lead:", data);
      setStep("success");
    });

    setStep(1);
    setVariant(getType());
    syncNext();
  };

  // ======================
  // Калькулятор рассрочки
  // ======================
  const initCalc = () => {
    const root = $("[data-calc]");
    if (!root) return;

    const priceSlider = $("[data-calc-price]", root);
    const priceInput = $("[data-calc-price-input]", root);
    const pctSlider = $("[data-calc-percent]", root);
    const pctInput = $("[data-calc-percent-input]", root);

    // Диапазоны берём из атрибутов слайдеров — не дублируем значения в JS
    const MIN_PRICE = Number(priceSlider.min);
    const MAX_PRICE = Number(priceSlider.max);
    const MIN_PCT = Number(pctSlider.min);
    const MAX_PCT = Number(pctSlider.max);
    const initialInput = $("[data-calc-initial-input]", root);
    const presets = $$("[data-calc-preset]", root);
    const terms = $$("[data-calc-term]", root);

    const out = {
      monthly: $("[data-calc-monthly]", root),
      termText: $("[data-calc-term-text]", root),
      price: $("[data-calc-sum-price]", root),
      initial: $("[data-calc-sum-initial]", root),
      remainder: $("[data-calc-sum-remainder]", root),
      term: $("[data-calc-sum-term]", root),
      overpay: $("[data-calc-sum-overpay]", root),
    };

    const activeTerm = terms.find((b) => b.classList.contains("is-active")) || terms[0];
    const state = {
      price: Number(priceSlider.value),
      pct: Number(pctSlider.value),
      term: Number(activeTerm?.dataset.calcTerm) || 0,
    };

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const parse = (str) => Number(String(str).replace(/\D/g, "")) || 0;

    const plural = (n, [one, few, many]) => {
      const m10 = n % 10;
      const m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
      return many;
    };
    const termWord = (n) => `${n} ${plural(n, ["месяц", "месяца", "месяцев"])}`;

    const setFill = (slider, min, max) => {
      const pct = ((Number(slider.value) - min) / (max - min)) * 100;
      slider.style.setProperty("--fill", `${pct}%`);
    };

    const render = () => {
      const initial = (state.price * state.pct) / 100;
      const remainder = state.price - initial;
      const monthly = state.term ? remainder / state.term : 0;

      priceSlider.value = state.price;
      pctSlider.value = state.pct;
      setFill(priceSlider, MIN_PRICE, MAX_PRICE);
      setFill(pctSlider, MIN_PCT, MAX_PCT);

      if (document.activeElement !== priceInput) priceInput.value = `${fmt(state.price)} KGS`;
      if (document.activeElement !== pctInput) pctInput.value = `${state.pct} %`;
      if (document.activeElement !== initialInput) initialInput.value = `${fmt(initial)} KGS`;

      presets.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.calcPreset) === state.pct));
      terms.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.calcTerm) === state.term));

      out.monthly.textContent = fmt(monthly);
      out.termText.textContent = termWord(state.term);
      out.price.textContent = `${fmt(state.price)} KGS`;
      out.initial.textContent = `${fmt(initial)} KGS`;
      out.remainder.textContent = `${fmt(remainder)} KGS`;
      out.term.textContent = `${state.term} мес.`;
      out.overpay.textContent = "0 KGS";
    };

    priceSlider.addEventListener("input", () => {
      state.price = Number(priceSlider.value);
      render();
    });

    pctSlider.addEventListener("input", () => {
      state.pct = Number(pctSlider.value);
      render();
    });

    // Текстовые поля считаем «вживую», но переформатируем только по завершении ввода
    priceInput.addEventListener("input", () => {
      state.price = clamp(parse(priceInput.value), MIN_PRICE, MAX_PRICE);
      render();
    });
    priceInput.addEventListener("change", render);

    pctInput.addEventListener("input", () => {
      state.pct = clamp(parse(pctInput.value), MIN_PCT, MAX_PCT);
      render();
    });
    pctInput.addEventListener("change", render);

    initialInput.addEventListener("input", () => {
      const initial = clamp(parse(initialInput.value), 0, state.price);
      state.pct = clamp(Math.round((initial / state.price) * 100), MIN_PCT, MAX_PCT);
      render();
    });
    initialInput.addEventListener("change", render);

    presets.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.pct = clamp(Number(btn.dataset.calcPreset), MIN_PCT, MAX_PCT);
        render();
      });
    });

    terms.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.term = Number(btn.dataset.calcTerm);
        render();
      });
    });

    $("[data-calc-submit]", root)?.addEventListener("click", render);

    render();
  };

  // ======================
  // Accordion
  // ======================
  const initAccordion = () => {
    const setHeight = (item, open) => {
      const body = $(".accordion__body", item);
      if (!body) return;
      body.style.maxHeight = open ? `${body.scrollHeight}px` : "";
    };

    $$("[data-accordion]").forEach((acc) => {
      const items = $$(".accordion__item", acc);

      items.forEach((item) => {
        const head = $(".accordion__head", item);
        if (!head) return;

        if (item.classList.contains("is-open")) setHeight(item, true);

        head.addEventListener("click", () => {
          const isOpen = item.classList.contains("is-open");
          // Аккордеон: открытым остаётся только один пункт
          items.forEach((i) => {
            i.classList.remove("is-open");
            setHeight(i, false);
          });
          if (!isOpen) {
            item.classList.add("is-open");
            setHeight(item, true);
          }
        });
      });
    });

    // Пересчёт высоты открытых пунктов при ресайзе
    window.addEventListener("resize", debounce(() => {
      $$(".accordion__item.is-open").forEach((item) => setHeight(item, true));
    }, 150));
  };

  // ======================
  // Show more (раскрытие скрытых элементов)
  // ======================
  const initMore = () => {
    $$("[data-more]").forEach((root) => {
      const toggle = $("[data-more-toggle]", root);
      if (!toggle) return;

      const moreText = toggle.dataset.moreText || toggle.textContent;
      const lessText = toggle.dataset.moreLess || "Скрыть";

      toggle.addEventListener("click", () => {
        const open = root.classList.toggle("is-open");
        toggle.textContent = open ? lessText : moreText;
      });
    });
  };

  // ======================
  // Modals
  // ======================
  const initModals = ({ scrollLock }) => {
    const wrapper = $(".modals");
    if (!wrapper) return;

    const modals = $$(".modal", wrapper);
    const getModalByType = (type) => wrapper.querySelector(`.modal[data-type="${type}"]`);

    const showWrapper = () => {
      wrapper.style.opacity = 1;
      wrapper.style.pointerEvents = "auto";
      scrollLock?.lock?.("modal");
    };

    const hideWrapper = () => {
      wrapper.style.opacity = 0;
      wrapper.style.pointerEvents = "none";
      scrollLock?.unlock?.("modal");
    };

    const openModal = (type) => {
      modals.forEach((m) => {
        m.style.display = "none";
        m.style.removeProperty("transform");
      });

      const modal = getModalByType(type);
      if (!modal) return;

      modal.style.display = "block";
      showWrapper();

      if (window.gsap) {
        window.gsap.fromTo(modal, { y: -100 }, { y: 0, duration: 0.5, ease: "power3.out" });
      }
    };

    const closeCurrentModal = () => {
      const current = modals.find((m) => getComputedStyle(m).display !== "none");

      const finish = () => {
        if (current) current.style.display = "none";
        hideWrapper();
      };

      if (current && window.gsap) {
        window.gsap.to(current, {
          y: -100,
          duration: 0.4,
          ease: "power3.in",
          onComplete: () => {
            current.style.removeProperty("transform");
            finish();
          },
        });
      } else {
        finish();
      }
    };

    $$(".modal-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const type = btn.dataset.type;
        if (!type) return;
        openModal(type);
      });
    });

    wrapper.addEventListener("click", (e) => {
      if (e.target === wrapper || e.target.closest(".modal__close")) closeCurrentModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wrapper.style.pointerEvents === "auto") closeCurrentModal();
    });
  };


  // ======================
  // Boot
  // ======================
  document.addEventListener("DOMContentLoaded", () => {
    const lenis = initLenis();
    updateMultiplier();

    const scrollLock = createScrollLock(lenis);

    initBurger({ scrollLock });
    initHeaderDropdown();
    initSwipers();
    initPhoneMask();
    initModals({ scrollLock });
    initLeadForm();
    initCalc();
    initAccordion();
    initMore();

  });
})();