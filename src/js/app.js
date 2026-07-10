
(() => {
  "use strict";

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };
  // Пересчёт размеров Lenis после изменения высоты контента (аккордеон, табы и т.п.)
  const refreshLenis = () => {
    if (window.lenis && typeof window.lenis.resize === "function") window.lenis.resize();
  };

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
    const inputs = $$('input[type="tel"]:not([data-lead-phone]):not([data-auth-phone])');
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
  // Телефон (intl-tel-input) — общий модуль
  // ======================
  const createPhoneInput = (input) => {
    if (!input) return null;

    const iti = window.intlTelInput
      ? window.intlTelInput(input, {
          initialCountry: "kg",
          countryOrder: ["kg", "kz", "ru", "uz"],
          separateDialCode: true,
          strictMode: true,
          loadUtils: () => import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/intl-tel-input@25/build/js/utils.js"),
        })
      : null;

    const isValid = () => {
      if (iti && typeof iti.isValidNumber === "function") {
        const valid = iti.isValidNumber();
        if (valid !== null && valid !== undefined) return valid;
      }
      return input.value.replace(/\D/g, "").length >= 6;
    };

    const getNumber = () => {
      if (!iti) return input.value;
      const full = typeof iti.getNumber === "function" ? iti.getNumber() : "";
      if (full) return full;
      const cc = iti.getSelectedCountryData?.().dialCode;
      return cc ? `+${cc} ${input.value}`.trim() : input.value;
    };

    return { input, iti, isValid, getNumber };
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

    // ---- Телефон с выпадашкой кодов стран (общий модуль) ----
    const phoneField = createPhoneInput(phone);
    const isPhoneValid = () => phoneField.isValid();
    const getPhoneNumber = () => phoneField.getNumber();

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
  // Авторизация (вход по SMS)
  // ======================
  const initAuthForm = () => {
    const form = $("[data-auth]");
    if (!form) return;

    const RESEND_SECONDS = 30;

    const steps = $$(".auth__step", form);
    const phone = $("[data-auth-phone]", form);
    const phoneLabel = $("[data-auth-phone-label]", form);
    const codeInput = $("[data-auth-code]", form);
    const sendBtn = $('[data-action="send"]', form);
    const verifyBtn = $("[data-auth-verify]", form);
    const backBtn = $('[data-action="back"]', form);
    const resendBtn = $('[data-action="resend"]', form);
    const timerText = $("[data-auth-timer]", form);

    let timerId = null;

    // ---- Телефон с выпадашкой кодов стран (общий модуль) ----
    const phoneField = createPhoneInput(phone);
    const isPhoneValid = () => phoneField.isValid();
    const getPhoneNumber = () => phoneField.getNumber();

    const setStep = (name) => {
      steps.forEach((step) => step.classList.toggle("is-active", step.dataset.step === name));
    };

    const startTimer = () => {
      let left = RESEND_SECONDS;
      clearInterval(timerId);
      resendBtn.hidden = true;
      timerText.hidden = false;
      timerText.textContent = `Отправить код повторно через: ${left}`;
      timerId = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(timerId);
          timerText.hidden = true;
          resendBtn.hidden = false;
          return;
        }
        timerText.textContent = `Отправить код повторно через: ${left}`;
      }, 1000);
    };

    const syncSend = () => { sendBtn.disabled = !isPhoneValid(); };
    const syncVerify = () => { verifyBtn.disabled = codeInput.value.replace(/\D/g, "").length < 4; };

    phone.addEventListener("input", syncSend);
    phone.addEventListener("countrychange", syncSend);

    codeInput.addEventListener("input", () => {
      codeInput.value = codeInput.value.replace(/\D/g, "");
      syncVerify();
    });

    sendBtn.addEventListener("click", () => {
      if (!isPhoneValid()) {
        phone.focus();
        return;
      }
      if (phoneLabel) phoneLabel.textContent = getPhoneNumber();
      console.log("auth: отправка кода на", getPhoneNumber());
      setStep("code");
      startTimer();
      codeInput.focus();
    });

    resendBtn.addEventListener("click", () => {
      console.log("auth: повторная отправка кода на", getPhoneNumber());
      startTimer();
    });

    backBtn?.addEventListener("click", () => {
      clearInterval(timerId);
      setStep("phone");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (verifyBtn.disabled) return;
      const data = { phone: getPhoneNumber(), code: codeInput.value };
      console.log("auth:", data);
      // здесь проверка кода и редирект в личный кабинет
    });

    setStep("phone");
    syncSend();
    syncVerify();
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
  // Активный пункт меню ЛК
  // ======================
  const initLkActive = () => {
    const aside = $("[data-lk-aside]");
    if (!aside) return;

    const links = $$("a.lk-nav__item", aside);
    const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    let active = null;

    links.forEach((link) => {
      const href = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
      const isActive = !!href && href === current;
      link.classList.toggle("is-active", isActive);
      if (isActive) active = link;
    });

    const text = $(".lk__aside-toggle-text", aside);
    if (active && text) text.textContent = active.textContent.trim();
  };

  // ======================
  // Копирование в буфер
  // ======================
  const initCopy = () => {
    const buttons = $$("[data-copy]");
    const allButtons = $$("[data-copy-all]");
    if (!buttons.length && !allButtons.length) return;

    const copyText = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (err) {}
        ta.remove();
      }
    };

    // Копирование одного поля
    buttons.forEach((btn) => {
      let timer = null;
      btn.addEventListener("click", async () => {
        const field = btn.closest(".copy-field");
        const valueEl = field && $("[data-copy-value]", field);
        const text = valueEl ? valueEl.textContent.trim() : "";
        if (!text) return;

        await copyText(text);
        btn.classList.add("is-copied");
        clearTimeout(timer);
        timer = setTimeout(() => btn.classList.remove("is-copied"), 1500);
      });
    });

    // Копировать все поля в области кнопки
    allButtons.forEach((btn) => {
      let timer = null;
      const label = btn.textContent.trim();
      btn.addEventListener("click", async () => {
        const scope = btn.closest("[data-copy-scope]") || document;
        const values = $$("[data-copy-value]", scope)
          .map((el) => el.textContent.trim())
          .filter(Boolean);
        if (!values.length) return;

        await copyText(values.join("\n"));
        btn.textContent = "Скопировано";
        clearTimeout(timer);
        timer = setTimeout(() => { btn.textContent = label; }, 1500);
      });
    });
  };

  // ======================
  // Вкладки (QR / Реквизиты и т.п.)
  // ======================
  const initTabs = () => {
    $$("[data-tabs]").forEach((root) => {
      const btns = $$("[data-tab]", root);
      const panels = $$("[data-tab-panel]", root);
      if (!btns.length) return;

      btns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const name = btn.dataset.tab;
          btns.forEach((b) => b.classList.toggle("is-active", b === btn));
          panels.forEach((p) => p.classList.toggle("is-active", p.dataset.tabPanel === name));
          refreshLenis();
        });
      });
    });
  };

  // ======================
  // Сайдбар личного кабинета (сворачивание на мобилке)
  // ======================
  const initLkAside = () => {
    const aside = $("[data-lk-aside]");
    if (!aside) return;

    const toggle = $("[data-lk-aside-toggle]", aside);
    const body = $(".lk__aside-body", aside);
    if (!toggle || !body) return;

    const MOBILE = 1024;

    const setHeight = (open) => {
      body.style.maxHeight = open ? `${body.scrollHeight}px` : "";
    };

    toggle.addEventListener("click", () => {
      const open = aside.classList.toggle("is-open");
      setHeight(open);
    });

    window.addEventListener("resize", debounce(() => {
      if (window.innerWidth > MOBILE) {
        aside.classList.remove("is-open");
        body.style.maxHeight = "";
      } else if (aside.classList.contains("is-open")) {
        setHeight(true);
      }
    }, 150));
  };

  // ======================
  // Переключатель языка
  // ======================
  const initLkLang = () => {
    const lang = $("[data-lang]");
    if (!lang) return;

    const toggle = $("[data-lang-toggle]", lang);
    const currentFlag = $(".lk-lang__current .lk-lang__flag", lang);
    const currentName = $(".lk-lang__current .lk-lang__name", lang);
    const options = $$("[data-lang-value]", lang);
    if (!toggle) return;

    const close = () => lang.classList.remove("is-open");

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      lang.classList.toggle("is-open");
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const flag = $(".lk-lang__flag", option);
        const name = $(".lk-lang__name", option);
        if (flag && currentFlag) currentFlag.innerHTML = flag.innerHTML;
        if (name && currentName) currentName.textContent = name.textContent;
        options.forEach((o) => o.classList.toggle("is-active", o === option));
        close();
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-lang]")) close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
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

        const body = $(".accordion__body", item);
        body?.addEventListener("transitionend", (e) => {
          if (e.propertyName === "max-height") refreshLenis();
        });

        head.addEventListener("click", () => {
          const isOpen = item.classList.contains("is-open");
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

    window.addEventListener("resize", debounce(() => {
      $$(".accordion__item.is-open").forEach((item) => setHeight(item, true));
    }, 150));
  };

  // ======================
  // Show more
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
  // Обвязка планировки: голый <svg> с <path> → группы .plan__unit
  // ======================
  // Бэк отдаёт простой SVG (только контуры-<path>) + PNG + (опционально)
  // массив данных в <script type="application/json" data-plan-units>.
  // Здесь каждый path оборачивается в <g class="plan__unit" data-plan-unit>,
  // получает класс .plan__unit-shape и data-* поля из массива.
  // Связка path ↔ данные: по id (path.id / data-id) либо по порядку.
  const buildPlanUnits = (planRoot) => {
    const svg = $(".plan__plan svg", planRoot);
    if (!svg) return;
    // приводим вставленный svg к нужному виду оверлея
    svg.classList.add("plan__svg");
    svg.setAttribute("preserveAspectRatio", "none");

    // берём только ещё НЕ обёрнутые пути (прямые дети svg).
    // если разметка уже с готовыми <g data-plan-unit> — список пустой, no-op.
    const paths = $$(":scope > path", svg);
    if (!paths.length) return;

    // необязательные данные с бэка
    let data = [];
    const dataEl = $("[data-plan-units]", planRoot);
    if (dataEl) { try { data = JSON.parse(dataEl.textContent || "[]"); } catch (e) {} }
    const byId = new Map(data.map((u) => [String(u.id), u]));

    // enum статуса → человекочитаемая подпись для карточки
    const STATUS_LABEL = {
      free: "Свободна",
      reserved: "Забронирована",
      sold: "Продана",
    };

    const SVGNS = "http://www.w3.org/2000/svg";
    paths.forEach((path, i) => {
      const key = path.id || path.dataset.id;
      const u = (key && byId.get(String(key))) || data[i] || {};

      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "plan__unit");
      g.setAttribute("data-plan-unit", "");
      path.setAttribute("class", "plan__unit-shape");
      path.removeAttribute("fill"); // цвет заливки — из CSS, не инлайном
      svg.replaceChild(g, path);
      g.appendChild(path);

      // данные из массива → data-* (их читают карточка и бейдж комнат)
      g.dataset.num = u.num != null ? u.num : i + 1;
      if (u.block != null) g.dataset.block = u.block;
      if (u.rooms != null) g.dataset.rooms = u.rooms;
      if (u.area != null) g.dataset.area = u.area;
      if (u.price != null) g.dataset.price = u.price;
      if (u.status != null) g.dataset.status = STATUS_LABEL[u.status] || u.status;

      // продано → серым и без интерактива; иначе делаем фокусируемым
      if (u.status === "sold" || u.sold === true) {
        g.setAttribute("data-sold", "");
      } else {
        if (u.status === "reserved") g.classList.add("is-reserved"); // бронь — оранжевым
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
      }
    });
  };

  // ======================
  // Выбор этажа + планировка
  // ======================
  const initFloorplan = () => {
    const app = $("[data-floorplan]");
    if (!app) return;
    const root = $("[data-floor]", app);     // вид «фасад дома»
    const planRoot = $("[data-plan]", app);  // вид «планировка этажа»
    if (!root) return;

    // Переключение видов в пределах страницы
    const openPlan = (floor) => {
      app.classList.add("is-plan");
      ensurePlanReady(); 
      if (floor != null) planSetFloor(parseInt(floor, 10));
      window.scrollTo({ top: 0 });
    };
    const showBuilding = () => app.classList.remove("is-plan");

    const scene = $(".floor__scene", root);
    const floorsEl = $("[data-floor-floors]", root);
    const tooltip = $("[data-floor-tooltip]", root);
    const tipNum = $("[data-floor-tooltip-num]", root);
    const tipCaption = $("[data-floor-tooltip-caption]", root);
    const tipAvailable = $("[data-floor-tooltip-available]", root);
    const tipSale = $("[data-floor-tooltip-sale]", root);
    const tipDivider = $("[data-floor-tooltip-divider]", root);
    if (!floorsEl || !tooltip) return;

    // Ровные полосы этажей: фасад делится на N частей (N = data-floors).
    // data-free — карта «в продаже» по этажам.
    // data-start — номер самого нижнего жилого этажа (по умолч. 1).
    // Если снизу паркинг/цоколь — ставим 2, чтобы жильё начиналось со 2-го.
    const count = parseInt(floorsEl.dataset.floors, 10) || 0;
    const start = parseInt(floorsEl.dataset.start, 10) || 1;
    const top = start + count - 1; // номер верхнего этажа
    let freeMap = {};
    try { freeMap = JSON.parse(floorsEl.dataset.free || "{}"); } catch (e) {}
    const isFloorEmpty = (f) => freeMap[f] === 0; // 0 в продаже → этаж недоступен
    // data-heights — карта «этаж → % высоты фасада» для этажей, которым
    // нужна своя высота (напр. верхний мансардный этаж выше остальных).
    // Не указанные этажи (flex:1) делят оставшуюся высоту поровну.
    let heightMap = {};
    try { heightMap = JSON.parse(floorsEl.dataset.heights || "{}"); } catch (e) {}
    // Необязательная нижняя полоса «цоколь / паркинг».
    // data-base = { label, caption, height (% высоты фасада), free }.
    // Если атрибута нет — полоса не рисуется.
    let base = null;
    try { base = JSON.parse(floorsEl.dataset.base || "null"); } catch (e) {}
    if (!floorsEl.childElementCount && count > 0) {
      const rows = [];
      for (let f = top; f >= start; f--) { // сверху вниз: верхний этаж первым
        const free = freeMap[f] != null ? freeMap[f] : 0;
        const h = heightMap[f]; // своя высота этажа в %, если задана
        const style = h != null ? ` style="flex:0 0 ${h}%"` : "";
        rows.push(
          `<a class="floor__band${free === 0 ? " is-empty" : ""}"${style} href="#" data-floor="${f}" data-caption="Этаж" data-free="${free}"></a>`
        );
      }
      // Цоколь / паркинг — самой нижней полосой с фикс. высотой в %.
      // Остальные этажи (flex:1) делят оставшуюся высоту.
      // Продаж нет — только пометка типа (data-base-band).
      if (base && base.height) {
        const label = base.label || "Паркинг";
        const caption = base.caption || "Уровень";
        rows.push(
          `<a class="floor__band floor__band--base" href="#" style="flex:0 0 ${base.height}%" data-floor="${label}" data-caption="${caption}" data-base-band></a>`
        );
      }
      floorsEl.innerHTML = rows.join("");
    }

    const zones = $$(".floor__band", floorsEl);
    if (!zones.length) return;

    let active = null;

    const positionTooltip = (zone) => {
      const sceneRect = scene.getBoundingClientRect();
      const zoneRect = zone.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();
      const gap = s(16);

      // Справа от зоны этажа, по центру по вертикали
      let left = zoneRect.right - sceneRect.left + gap;
      let top = zoneRect.top - sceneRect.top + zoneRect.height / 2 - tipRect.height / 2;

      // Если не помещается справа — показываем слева
      if (left + tipRect.width > sceneRect.width) {
        left = zoneRect.left - sceneRect.left - tipRect.width - gap;
      }
      // Держим в пределах сцены по вертикали
      top = Math.max(s(8), Math.min(top, sceneRect.height - tipRect.height - s(8)));

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const setActive = (zone) => {
      if (!zone) return;
      active = zone;
      zones.forEach((z) => z.classList.toggle("is-active", z === zone));
      const isBase = zone.hasAttribute("data-base-band");
      if (tipCaption) tipCaption.textContent = zone.dataset.caption || "Этаж";
      if (tipNum) tipNum.textContent = zone.dataset.floor;
      // Полоса цоколя/паркинга
      if (tipDivider) tipDivider.style.display = isBase ? "none" : "";
      if (tipSale) tipSale.style.display = isBase ? "none" : "";
      if (!isBase && tipAvailable) tipAvailable.textContent = zone.dataset.free;
      tooltip.classList.add("is-visible");
      positionTooltip(zone);
    };

    const clearActive = () => {
      active = null;
      zones.forEach((z) => z.classList.remove("is-active"));
      tooltip.classList.remove("is-visible");
    };

    // Десктоп: выбор этажа по наведению / фокусу, клик — открыть план
    const canOpen = (zone) =>
      zone && !zone.hasAttribute("data-base-band") && !zone.classList.contains("is-empty");
    zones.forEach((zone) => {
      zone.addEventListener("mouseenter", () => setActive(zone));
      zone.addEventListener("mouseleave", clearActive);
      zone.addEventListener("focus", () => setActive(zone));
      zone.addEventListener("blur", clearActive);
      zone.addEventListener("click", (e) => {
        e.preventDefault();
        if (canOpen(zone)) openPlan(zone.dataset.floor);
      });
    });

    // Клик по плавающей карточке — тоже открывает план активного этажа
    tooltip.addEventListener("click", (e) => {
      e.preventDefault();
      if (canOpen(active)) openPlan(active.dataset.floor);
    });

    // Мобилка: верхний таб-бар. Тап по табу ведёт на страницу этажа —
    // ссылка та же, что и у полосы этажа (потом поменять href в одном месте).
    // Табы строятся из тех же зон, снизу вверх = слева направо.
    const tabsListEl = $("[data-floor-tabs-list]", root);
    if (tabsListEl) {
      // Коммерцию/паркинг (data-base-band) в табы не выводим — только жилые этажи
      zones
        .slice()
        .reverse()
        .filter((zone) => !zone.hasAttribute("data-base-band"))
        .forEach((zone) => {
          const empty = zone.classList.contains("is-empty");
          const tab = document.createElement("a");
          tab.className = "floor__tabs-tab" + (empty ? " is-empty" : "");
          tab.href = "#";
          tab.textContent = zone.dataset.floor;
          tab.addEventListener("click", (e) => {
            e.preventDefault();
            if (!empty) openPlan(zone.dataset.floor);
          });
          tabsListEl.appendChild(tab);
        });

      // Стрелки листают список этажей влево/вправо
      const page = () => tabsListEl.clientWidth * 0.7;
      $("[data-floor-tabs-prev]", root)?.addEventListener("click", () =>
        tabsListEl.scrollBy({ left: -page(), behavior: "smooth" })
      );
      $("[data-floor-tabs-next]", root)?.addEventListener("click", () =>
        tabsListEl.scrollBy({ left: page(), behavior: "smooth" })
      );
    }

    // Мобилка: нижняя выдвижная плашка с инфо — грабер + свайп
    const infoEl = $("[data-floor-info]", root);
    const infoHandle = $("[data-floor-info-handle]", root);
    if (infoEl && infoHandle) {
      infoHandle.addEventListener("click", () => infoEl.classList.toggle("is-expanded"));
      let startY = null;
      infoEl.addEventListener("touchstart", (e) => {
        startY = e.touches[0].clientY;
      }, { passive: true });
      infoEl.addEventListener("touchend", (e) => {
        if (startY == null) return;
        const dy = e.changedTouches[0].clientY - startY;
        if (dy < -30) infoEl.classList.add("is-expanded");        // свайп вверх — раскрыть
        else if (dy > 30) infoEl.classList.remove("is-expanded");  // свайп вниз — свернуть
        startY = null;
      }, { passive: true });
    }

    window.addEventListener("resize", debounce(() => {
      if (active) positionTooltip(active);
    }, 150));

    // Тема (день / ночь)
    const themeBtn = $("[data-floor-theme]", root);
    const themeLabel = $("[data-floor-theme-label]", root);
    themeBtn?.addEventListener("click", () => {
      const night = root.classList.toggle("is-night");
      if (themeLabel) themeLabel.textContent = night ? "ночь" : "день";
    });

    // ======================
    // Планировка выбранного этажа
    // ======================
    if (!planRoot) return;

    // Кнопка «Вернуться назад» — возврат к фасаду
    $("[data-floorplan-back]", app)?.addEventListener("click", (e) => {
      e.preventDefault();
      showBuilding();
    });

    // Бэк вставляет голый <svg> с <path> + (опц.) массив данных.
    // Обрамляем каждый path в группу .plan__unit и подмешиваем данные.
    buildPlanUnits(planRoot);

    // ---- Табы этажей (та же модель этажей, что у фасада: start..top) ----
    const tabsList = $("[data-plan-tabs]", planRoot);
    const floorField = $("[data-plan-floor]", planRoot);

    const tabs = [];
    if (tabsList && count > 0) {
      for (let f = start; f <= top; f++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "plan__tabs-tab";
        btn.textContent = f;
        if (isFloorEmpty(f)) {
          // Нет квартир в продаже — тёмно-серый и недоступен
          btn.classList.add("is-empty");
          btn.disabled = true;
          btn.title = "Нет квартир в продаже";
        } else {
          btn.addEventListener("click", () => planSetFloor(f));
        }
        tabsList.appendChild(btn);
        tabs.push(btn);
      }
    }

    let currentFloor = null;
    function planSetFloor(f) {
      if (f < start || f > top || isFloorEmpty(f)) return; // недоступный этаж — игнор
      currentFloor = f;
      tabs.forEach((btn, i) => btn.classList.toggle("is-active", start + i === f));
      if (floorField) floorField.textContent = f;
      const activeTab = tabs[f - start];
      if (activeTab) activeTab.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }

    // Стрелки листают этажи, пропуская недоступные
    const stepFloor = (dir) => {
      let f = (currentFloor != null ? currentFloor : start) + dir;
      while (f >= start && f <= top && isFloorEmpty(f)) f += dir;
      if (f >= start && f <= top) planSetFloor(f);
    };
    $("[data-plan-prev]", planRoot)?.addEventListener("click", () => stepFloor(-1));
    $("[data-plan-next]", planRoot)?.addEventListener("click", () => stepFloor(1));

    // ---- Квартиры: наведение обновляет левую карточку ----
    const nameEl = $("[data-plan-name]", planRoot);
    const fields = {
      block: $("[data-plan-block]", planRoot),
      rooms: $("[data-plan-rooms]", planRoot),
      area: $("[data-plan-area]", planRoot),
      price: $("[data-plan-price]", planRoot),
      status: $("[data-plan-status]", planRoot),
    };
    const units = $$("[data-plan-unit]", planRoot);
    const isSold = (unit) => unit.hasAttribute("data-sold");

    const showUnit = (unit) => {
      if (!unit || isSold(unit)) return; // проданные не показываем в карточке
      units.forEach((u) => u.classList.toggle("is-active", u === unit));
      if (nameEl) nameEl.innerHTML = `Квартира&nbsp;#${unit.dataset.num}`;
      if (fields.block) fields.block.textContent = unit.dataset.block;
      if (fields.rooms) fields.rooms.textContent = unit.dataset.rooms;
      if (fields.area) fields.area.textContent = unit.dataset.area;
      if (fields.price) fields.price.textContent = unit.dataset.price;
      if (fields.status) fields.status.textContent = unit.dataset.status;
    };

    // Наведение/клик по доступной квартире; проданные — серым и без интерактива
    units.forEach((unit) => {
      if (isSold(unit)) {
        unit.classList.add("is-sold");
        unit.removeAttribute("tabindex");
        return;
      }
      unit.addEventListener("mouseenter", () => showUnit(unit));
      unit.addEventListener("focus", () => showUnit(unit));
      unit.addEventListener("click", () => showUnit(unit)); // тач/клик
    });

    // ---- Кружки с количеством комнат внутри группы квартиры ----
    // Рисуем SVG-элементами прямо в <g class="plan__unit">.
    const SVGNS = "http://www.w3.org/2000/svg";

    // Точка для бейджа: центр bbox у Г-образных/вырезанных квартир попадает
    // на стену. Ищем точку ВНУТРИ контура (isPointInFill), максимально
    // удалённую от краёв, — так кружок всегда сидит в теле помещения.
    const labelPoint = (shape) => {
      const box = shape.getBBox();
      const fallback = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const svg = shape.ownerSVGElement;
      if (!svg || typeof shape.isPointInFill !== "function") return fallback;

      const pt = svg.createSVGPoint();
      const N = 16;
      const inside = [], outside = [];
      for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
          pt.x = box.x + (box.width * i) / N;
          pt.y = box.y + (box.height * j) / N;
          (shape.isPointInFill(pt) ? inside : outside).push({ x: pt.x, y: pt.y });
        }
      }
      if (!inside.length) return fallback;

      // берём внутреннюю точку с наибольшим отступом до стен и краёв bbox
      let best = fallback, bestD = -1;
      inside.forEach((p) => {
        let d = Math.min(
          p.x - box.x, box.x + box.width - p.x,
          p.y - box.y, box.y + box.height - p.y
        ) ** 2;
        outside.forEach((o) => {
          const dd = (p.x - o.x) ** 2 + (p.y - o.y) ** 2;
          if (dd < d) d = dd;
        });
        if (d > bestD) { bestD = d; best = p; }
      });
      return best;
    };

    // Бейджи и стартовую квартиру строим ЛЕНИВО — при первом открытии плана:
    // пока вид скрыт (display:none), getBBox() вернул бы нули.
    let planReady = false;
    function ensurePlanReady() {
      if (planReady) return;
      planReady = true;
      planRoot.removeAttribute("hidden");

      units.forEach((unit) => {
        const shape = $(".plan__unit-shape", unit);
        if (!shape || !unit.dataset.rooms) return;
        // ручное переопределение точки из данных (в единицах viewBox), если нужно
        const { x: cx, y: cy } = unit.dataset.badgeX != null && unit.dataset.badgeY != null
          ? { x: +unit.dataset.badgeX, y: +unit.dataset.badgeY }
          : labelPoint(shape);
        const badgeMod = isSold(unit)
          ? " plan__badge--sold"
          : unit.classList.contains("is-reserved") ? " plan__badge--reserved" : "";
        const circle = document.createElementNS(SVGNS, "circle");
        circle.setAttribute("class", "plan__badge" + badgeMod);
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", 11);
        const text = document.createElementNS(SVGNS, "text");
        text.setAttribute("class", "plan__badge-text");
        text.setAttribute("x", cx);
        text.setAttribute("y", cy);
        text.textContent = unit.dataset.rooms;
        unit.append(circle, text);
      });

      const firstAvailable = units.find((u) => !isSold(u));
      if (firstAvailable) showUnit(firstAvailable);
    }
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
    initAuthForm();
    initCalc();
    initLkActive();
    initCopy();
    initTabs();
    initLkAside();
    initLkLang();
    initAccordion();
    initMore();
    initFloorplan();

  });
})();
