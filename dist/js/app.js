
(() => {
  "use strict";

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

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

    const useGsapTicker = typeof gsap !== "undefined";
    const lenis = new Lenis({ autoRaf: !useGsapTicker });
    window.lenis = lenis;

    if (useGsapTicker) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      if (typeof ScrollTrigger !== "undefined") {
        lenis.on("scroll", ScrollTrigger.update);
      }
    }

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

    if (document.querySelector(".teamsSwiper")) {
      state.swipers.teams = new Swiper('.teamsSwiper', {
        slidesPerView: 1.3,
        spaceBetween: s(8),
        grabCursor: true,
        breakpoints: {
          768: {
            slidesPerView: 2.5,
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
    const inputs = $$('input[type="tel"]:not([data-lead-phone]):not([data-auth-phone]):not([data-modal-phone])');
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

    // Подсветка на 1.5 сек
    const flash = (el, toggle) => {
      clearTimeout(el.copyTimer);
      toggle(true);
      el.copyTimer = setTimeout(() => toggle(false), 1500);
    };

    // Делегирование: поля могут отрисовываться динамически
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (btn) {
        const field = btn.closest(".copy-field");
        const valueEl = field && $("[data-copy-value]", field);
        const text = valueEl ? valueEl.textContent.trim() : "";
        if (!text) return;

        await copyText(text);
        flash(btn, (on) => btn.classList.toggle("is-copied", on));
        return;
      }

      // Копировать все поля в области кнопки
      const allBtn = e.target.closest("[data-copy-all]");
      if (!allBtn) return;

      const scope = allBtn.closest("[data-copy-scope]") || document;
      const values = $$("[data-copy-value]", scope)
        .map((el) => el.textContent.trim())
        .filter(Boolean);
      if (!values.length) return;

      if (!allBtn.dataset.copyLabel) allBtn.dataset.copyLabel = allBtn.textContent.trim();
      const label = allBtn.dataset.copyLabel;

      await copyText(values.join("\n"));
      flash(allBtn, (on) => { allBtn.textContent = on ? "Скопировано" : label; });
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
  // Реквизиты: список объектов -> реквизиты банка (без перезагрузки страницы)
  // ======================
  const initBankRequisites = () => {
    const root = $("[data-requisites]");
    if (!root) return;

    const views = $$("[data-view]", root);
    const bankView = $('[data-view="bank"]', root);
    const triggers = $$("[data-bank]", root);
    if (!bankView || !triggers.length) return;

    const back = $("[data-bank-back]", root);
    const titleEl = $("[data-bank-title]", bankView);
    const qrImg = $("[data-bank-qr]", bankView);
    const qrSave = $(".requisites__save", bankView);
    const subtitleEl = $("[data-bank-subtitle]", bankView);
    const qrTab = $('[data-tab="qr"]', bankView);
    const currencySwitch = $("[data-currency-switch]", bankView);
    const currencyBtns = $$("[data-currency]", bankView);
    const fieldsBox = $("[data-bank-fields]", bankView);
    const template = $("[data-field-template]", bankView);
    const tabBtns = $$("[data-tab]", bankView);
    const panels = $$("[data-tab-panel]", bankView);
    if (!fieldsBox || !template) return;

    // Градиент карточки банка приходит из data-атрибутов
    $$(".bank-card", root).forEach((card) => {
      const { gradientFrom, gradientTo } = card.dataset;
      if (gradientFrom) card.style.setProperty("--bank-from", gradientFrom);
      if (gradientTo) card.style.setProperty("--bank-to", gradientTo);
    });

    // Реквизиты текущего банка: { kgs: { qr, fields: [...] }, usd: {...} }
    let currentData = null;

    const readBankData = (btn) => {
      const source = $("[data-bank-json]", btn.closest(".bank-card") || root);
      if (!source) return null;
      try {
        return JSON.parse(source.textContent);
      } catch (e) {
        return null;
      }
    };

    const createField = ({ label, value, type }) => {
      const node = template.content.firstElementChild.cloneNode(true);
      $(".copy-field__label", node).textContent = label || "";

      const valueEl = $("[data-copy-value]", node);
      if (type === "email" || type === "tel") {
        const link = document.createElement("a");
        link.className = "copy-field__value copy-field__value_link";
        link.href = type === "email" ? `mailto:${value}` : `tel:${value.replace(/\s/g, "")}`;
        link.setAttribute("data-copy-value", "");
        link.textContent = value;
        valueEl.replaceWith(link);
      } else {
        valueEl.textContent = value || "";
      }

      return node;
    };

    const render = (currency) => {
      if (!currentData) return;

      const codes = Object.keys(currentData);
      const code = currentData[currency] ? currency : codes[0];
      const payload = currentData[code];
      if (!payload) return;

      // Показываем только те валюты, что есть у банка
      currencyBtns.forEach((btn) => {
        const available = !!currentData[btn.dataset.currency];
        btn.hidden = !available;
        btn.classList.toggle("is-active", available && btn.dataset.currency === code);
      });
      if (currencySwitch) currencySwitch.hidden = codes.length < 2;

      if (subtitleEl) {
        subtitleEl.textContent = payload.subtitle || "";
        subtitleEl.hidden = !payload.subtitle;
      }

      // Заголовок и набор полей могут отличаться от валюты к валюте — перерисовываем целиком
      fieldsBox.innerHTML = "";
      (payload.fields || []).forEach((field) => fieldsBox.appendChild(createField(field)));

      if (qrTab) qrTab.hidden = !payload.qr;
      if (payload.qr) {
        if (qrImg) qrImg.src = payload.qr;
        if (qrSave) qrSave.href = payload.qr;
      } else {
        activateTab("details");
      }

      refreshLenis();
    };

    const activateTab = (name) => {
      tabBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.tabPanel === name));
    };

    const showView = (name) => {
      views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
      refreshLenis();

      const top = Math.max(0, root.getBoundingClientRect().top + window.scrollY - 100);
      if (window.lenis && typeof window.lenis.scrollTo === "function") {
        window.lenis.scrollTo(top);
      } else {
        window.scrollTo({ top, behavior: "smooth" });
      }
    };

    triggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const data = readBankData(btn);
        if (!data) return;

        currentData = data;
        if (titleEl) titleEl.textContent = `(${btn.dataset.bank})`;
        activateTab("details");
        render(Object.keys(data)[0]);
        showView("bank");
      });
    });

    back?.addEventListener("click", () => showView("list"));

    currencyBtns.forEach((btn) => {
      btn.addEventListener("click", () => render(btn.dataset.currency));
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
    const langs = $$("[data-lang]");
    if (!langs.length) return;

    const closeAll = () => langs.forEach((l) => l.classList.remove("is-open"));

    langs.forEach((lang) => {
      const toggle = $("[data-lang-toggle]", lang);
      const currentFlag = $(".lk-lang__current .lk-lang__flag", lang);
      const currentName = $(".lk-lang__current .lk-lang__name", lang);
      const options = $$("[data-lang-value]", lang);
      if (!toggle) return;

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !lang.classList.contains("is-open");
        closeAll();
        lang.classList.toggle("is-open", willOpen);
      });

      options.forEach((option) => {
        option.addEventListener("click", () => {
          const flag = $(".lk-lang__flag", option);
          const name = $(".lk-lang__name", option);
          if (flag && currentFlag) currentFlag.innerHTML = flag.innerHTML;
          if (name && currentName) currentName.textContent = name.textContent;
          options.forEach((o) => o.classList.toggle("is-active", o === option));
          lang.classList.remove("is-open");
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-lang]")) closeAll();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
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

    $$("[data-modal-phone]", wrapper).forEach((input) => createPhoneInput(input));

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
  // Быстрый просмотр квартиры: переключатель Планировка / Рендер
  // ======================
  const initQuickview = () => {
    const root = $("[data-quickview]");
    if (!root) return;

    const tabs = $$("[data-qv-tab]", root);
    const views = $$("[data-qv-view]", root);
    if (!tabs.length) return;

    const activate = (key) => {
      tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.qvTab === key));
      views.forEach((v) => v.classList.toggle("is-active", v.dataset.qvView === key));
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab.dataset.qvTab));
    });
  };

  // ======================
  // Parallax (лёгкое смещение фоновых картинок при скролле)
  // ======================
  const initParallax = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = [
      ".hero__container > img", ".hero__container > video",
      ".main-about__top .back", ".main-about__box .back",
      ".banner__container .back", ".feedback__container .back",
      ".charity__content > img",
    ].join(",");

    $$(targets).forEach((el) => {
      const box = el.parentElement;
      if (!box) return;
      gsap.set(el, { scale: 1.15, transformOrigin: "center center", willChange: "transform" });
      gsap.fromTo(
        el,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: box,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  };

  // ======================
  // Scroll-анимации появления секций (GSAP + ScrollTrigger)
  // ======================
  const initScrollAnimations = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.lenis) window.lenis.on("scroll", ScrollTrigger.update);

    const st = (trigger) => ({ trigger, start: "top 88%", once: true });

    const animated = new WeakSet();
    const claim = (el) => (animated.has(el) ? false : (animated.add(el), true));

    const REVEAL = { ease: "power2.out", clearProps: "transform" };

    const fadeUp = (selector, vars = {}) => {
      gsap.utils.toArray(selector).forEach((el) => {
        if (!claim(el)) return;
        gsap.from(el, {
          opacity: 0, y: 24, duration: 0.8,
          scrollTrigger: st(el), ...REVEAL, ...vars,
        });
      });
    };

    const stagger = (containerSelector, vars = {}) => {
      gsap.utils.toArray(containerSelector).forEach((box) => {
        if (!claim(box)) return;
        const items = gsap.utils.toArray(box.children).filter(claim);
        if (!items.length) return;
        gsap.from(items, {
          opacity: 0, y: 24, duration: 0.8, stagger: 0.08,
          scrollTrigger: st(box), ...REVEAL, ...vars,
        });
      });
    };

    // ---- Заголовки секций ----
    fadeUp([
      ".overview__title", ".about__title", ".benefits__title", ".how__title",
      ".main-about__title", ".main-news__title", ".news__title", ".news-inner__title",
      ".news-other__title", ".contacts__title", ".charity__title", ".banner__title",
      ".worth__title", ".live__title", ".experience__title", ".projects__title",
      ".calc__title", ".reports__title", ".plan__title", ".quickview__title",
      ".premises__title", ".loyalty-more__title", ".how-levels__title", ".referral__title",
      ".perks__title", ".docs__title", ".history__title", ".bonuses__title",
    ].join(","));

    // ---- Hero: контент ----
    fadeUp(".hero__content", { x: -40, y: 0, duration: 0.8, delay: 0.1 });

    fadeUp(".overview__content", { x: -40, y: 0, duration: 0.8 });
    gsap.utils.toArray(".overview__media").forEach((el) => {
      gsap.from(el, { opacity: 0, x: 40, duration: 0.8, ease: "power2.out", scrollTrigger: st(el) });
    });

    // ---- Секции «текст / картинка» (about) ----
    gsap.utils.toArray(".about__row").forEach((row) => {
      const flipped = row.classList.contains("right");
      const content = row.querySelector(".about__content");
      const img = row.querySelector(".about__img");
      if (content) gsap.from(content, {
        opacity: 0, x: flipped ? 50 : -50, duration: 0.8, ease: "power2.out",
        scrollTrigger: st(row),
      });
      if (img) gsap.from(img, {
        opacity: 0, x: flipped ? -50 : 50, duration: 0.8, ease: "power2.out",
        scrollTrigger: st(row),
      });
    });

    // ---- Калькулятор: колонки въезжают слева/справа ----
    fadeUp(".calc__left", { x: -40, y: 0, duration: 0.8 });
    fadeUp(".calc__right", { x: 40, y: 0, duration: 0.8 });

    // ---- Сетки карточек — каскадом ----
    [
      ".overview__cards", ".overview__grid", ".worth__cards", ".reports__cards",
      ".charity__grid", ".charity__cards", ".contacts__cards", ".contacts__list",
      ".contacts__grid", ".bonuses__grid", ".main-about__cards", ".main-news__cards",
      ".news__cards", ".news-other__cards", ".projects__cards", ".premises__cards",
      ".how-levels__list", ".history__list", ".docs__list", ".perks__list",
      ".lk__grid", ".quickview__grid",
    ].forEach((sel) => stagger(sel));

    // ---- Слайдеры (swiper) — появляются целым блоком ----
    fadeUp([
      ".benefits__slider", ".how__slider", ".experience__slider", ".project-gallery__slider",
      ".teams__slider",
    ].join(","), { y: 24, duration: 0.8 });

    // ---- Одиночные блоки — мягкий fade-up ----
    fadeUp([
      ".main-about__top", ".main-about__box", ".charity__content",
      ".banner__content", ".live__content",
    ].join(","));

    // ---- Нижние CTA секций — короткий fade-up ----
    fadeUp([
      ".projects__bottom", ".main-news__bottom", ".news__bottom",
    ].join(","), { y: 15, duration: 0.5, ease: "power1.out" });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  };

  // ======================
  // Preloader
  // ======================
  const initPreloader = () => {
    const preloader = $(".preloader");
    if (!preloader) return;

    const building = $(".preloader__building", preloader);
    const logo = $(".preloader__logo", preloader);

    // Нет GSAP или разметки — просто убираем прелоудер
    if (typeof gsap === "undefined" || !building || !logo) {
      preloader.remove();
      return;
    }

    // Наполняем дом окнами
    const count = parseInt(building.dataset.windows, 10) || 24;
    const windows = [];
    for (let i = 0; i < count; i++) {
      const win = document.createElement("span");
      win.className = "preloader__window";
      building.appendChild(win);
      windows.push(win);
    }

    // Блокируем скролл, пока идёт анимация
    document.body.classList.add("no-scroll");
    window.lenis?.stop?.();

    const hide = () => {
      preloader.classList.add("is-hidden");
      document.body.classList.remove("no-scroll");
      window.lenis?.start?.();
      preloader.addEventListener("transitionend", () => preloader.remove(), { once: true });
    };

    const tl = gsap.timeline({ onComplete: hide });

    // 1. Дом «вырастает»
    tl.from(building, { y: 24, opacity: 0, duration: 0.4, ease: "power2.out" });

    // 2. Окна зажигаются вразнобой — квартиры раскупают
    tl.to(
      windows,
      {
        backgroundColor: "#FFD10C",
        boxShadow: "0 0 14px rgba(255, 209, 12, 0.55)",
        duration: 0.3,
        ease: "power1.out",
        stagger: { each: 0.05, from: "random" },
      },
      "-=0.1"
    );

    // 3. Появляется логотип ARTWIN
    tl.fromTo(
      logo,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.15"
    );

    // 4. Небольшая пауза перед скрытием
    tl.to({}, { duration: 0.4 });
  };

  // ======================
  // Widjet — плавающие контакты
  // ======================
  const initWidjet = () => {
    const widjet = $("[data-widjet]");
    if (!widjet) return;

    const toggle = $("[data-widjet-toggle]", widjet);
    if (!toggle) return;

    const open = () => {
      widjet.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      widjet.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      widjet.classList.contains("is-open") ? close() : open();
    });

    $$(".widjet__item", widjet).forEach((item) => {
      item.addEventListener("click", close);
    });

    document.addEventListener("click", (e) => {
      if (!widjet.contains(e.target)) close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && widjet.classList.contains("is-open")) close();
    });

    // Кнопка «наверх»: показывается, начиная со второй секции
    const up = $("[data-widjet-up]", widjet);
    if (!up) return;

    const anchor = $$("main > section")[1] || null;

    const updateUp = () => {
      const isScrolled = anchor
        ? anchor.getBoundingClientRect().top <= 0
        : window.scrollY > window.innerHeight * 0.6;
      widjet.classList.toggle("is-scrolled", isScrolled);
    };

    up.addEventListener("click", () => {
      close();
      if (window.lenis && typeof window.lenis.scrollTo === "function") {
        window.lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    window.addEventListener("scroll", updateUp, { passive: true });
    window.addEventListener("resize", debounce(updateUp, 100));
    updateUp();
  };

  // ======================
  // Boot
  // ======================
  document.addEventListener("DOMContentLoaded", () => {
    const lenis = initLenis();
    updateMultiplier();

    initPreloader();

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
    initBankRequisites();
    initLkAside();
    initLkLang();
    initAccordion();
    initMore();
    initQuickview();
    initParallax();
    initScrollAnimations();
    initWidjet();

  });
})();
