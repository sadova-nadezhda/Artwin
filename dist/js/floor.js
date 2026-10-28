// ======================
// Страница «Выбор этажа + планировка» (floor.html)
// Отдельный скрипт только для этой страницы. Без зависимостей.
// ======================
(() => {
  "use strict";

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

  // Тот же множитель, что в app.js (макет 1440 / 768 / 375)
  const getWidthMultiplier = () => {
    const w = window.innerWidth;
    const minSide = Math.min(window.innerWidth, window.innerHeight);

    if (w <= 767) return minSide / 375;
    if (w <= 1024) return minSide / 768;
    return window.innerWidth / 1440;
  };
  const s = (value) => value * getWidthMultiplier();

  // ======================
  // Обвязка планировки: голый <svg> с <path> → группы .plan__unit
  // ======================

  const PLAN_STATUS_LABEL = {
    free: "Свободна",
    reserved: "Забронирована",
    sold: "Продана",
  };

  const buildPlanUnits = (planRoot) => {
    $$(".plan__plan", planRoot).forEach((canvas) => {
      const svg = $("svg", canvas);
      if (!svg) return;

      svg.classList.add("plan__svg");
      svg.setAttribute("preserveAspectRatio", "none");

      const paths = $$(":scope > path", svg);
      if (!paths.length) return;

      let data = [];
      const dataEl = $("[data-plan-units]", canvas);
      if (dataEl) { try { data = JSON.parse(dataEl.textContent || "[]"); } catch (e) {} }

      const SVGNS = "http://www.w3.org/2000/svg";
      paths.forEach((path, i) => {
        const u = data[i] || {};

        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("class", "plan__unit");
        g.setAttribute("data-plan-unit", "");
        path.setAttribute("class", "plan__unit-shape");
        path.removeAttribute("fill");
        svg.replaceChild(g, path);
        g.appendChild(path);

        g.dataset.num = u.num != null ? u.num : i + 1;
        if (u.block != null) g.dataset.block = u.block;
        if (u.rooms != null) g.dataset.rooms = u.rooms;
        if (u.area != null) g.dataset.area = u.area;
        if (u.price != null) g.dataset.price = u.price;
        if (u.status != null) g.dataset.status = PLAN_STATUS_LABEL[u.status] || u.status;

        if (u.status === "sold" || u.sold === true) {
          g.setAttribute("data-sold", "");
        } else {
          if (u.status === "reserved") g.classList.add("is-reserved"); // бронь — оранжевым
          g.setAttribute("tabindex", "0");
          g.setAttribute("role", "button");
        }
      });
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

    const setPlanHash = (f) => {
      try {
        history.replaceState(null, "",
          f != null ? `#plan-${f}` : location.pathname + location.search);
      } catch (e) {}
    };

    // Переключение видов в пределах страницы
    const openPlan = (floor) => {
      app.classList.add("is-plan");
      planRoot.removeAttribute("hidden");
      if (floor != null) planSetFloor(parseInt(floor, 10));
      window.scrollTo({ top: 0 });
    };
    const showBuilding = () => {
      app.classList.remove("is-plan");
      setPlanHash(null);
    };

    const scene = $(".floor__scene", root);
    const floorSvgs = $$("[data-floor-svg]", root); // десктопный и мобильный SVG
    const tooltip = $("[data-floor-tooltip]", root);
    const tipNum = $("[data-floor-tooltip-num]", root);
    const tipCaption = $("[data-floor-tooltip-caption]", root);
    const tipAvailable = $("[data-floor-tooltip-available]", root);
    const tipSale = $("[data-floor-tooltip-sale]", root);
    const tipDivider = $("[data-floor-tooltip-divider]", root);
    if (!floorSvgs.length || !tooltip) return;

    // Этажи — это <path> внутри [data-floor-svg], отрисованные по контуру фасада.
    //   жилой этаж:  data-floor="5" data-free="3"   (data-free="0" → этаж недоступен)
    //   цоколь и пр.: data-base data-label="Коммерция" data-caption="Уровень"
    // Пути без data-floor / data-base не интерактивны (просто игнорируются).
    // SVG может быть несколько (десктоп / мобилка) — один и тот же этаж в каждом из них.
    const zones = floorSvgs.flatMap((svg) => $$("path[data-floor], path[data-base]", svg));
    if (!zones.length) return;

    // Модель этажей для фасада и для планировки берётся из тех же path.
    // data-free достаточно указать в одном из SVG — остальные берут его по номеру этажа.
    const freeMap = {};
    zones.forEach((zone) => {
      const f = parseInt(zone.dataset.floor, 10);
      if (!isNaN(f) && zone.dataset.free != null && !zone.hasAttribute("data-base")) {
        freeMap[f] = parseInt(zone.dataset.free, 10) || 0;
      }
    });
    zones.forEach((zone) => {
      const isBase = zone.hasAttribute("data-base");
      zone.classList.add("floor__band");
      if (isBase) {
        zone.classList.add("floor__band--base");
        zone.dataset.floor = zone.dataset.label || "Паркинг";
        zone.dataset.caption = zone.dataset.caption || "Уровень";
        return;
      }
      const f = parseInt(zone.dataset.floor, 10);
      if (!isNaN(f) && freeMap[f] == null) freeMap[f] = 0;
      const free = freeMap[f] || 0;
      zone.dataset.free = free;
      zone.dataset.caption = zone.dataset.caption || "Этаж";
      if (free === 0) {
        zone.classList.add("is-empty");
      } else {
        zone.setAttribute("tabindex", "0");
        zone.setAttribute("role", "button");
      }
    });

    const floorNums = Object.keys(freeMap).map(Number).sort((a, b) => a - b);
    const start = floorNums.length ? floorNums[0] : 1;          // нижний жилой этаж
    const top = floorNums.length ? floorNums[floorNums.length - 1] : 0; // верхний
    const count = floorNums.length ? top - start + 1 : 0;
    // 0 в продаже или этажа нет на фасаде → недоступен
    const isFloorEmpty = (f) => !freeMap[f];

    let active = null;

    // point — координаты курсора: карточка едет за мышкой вдоль этажа.
    // Без point (фокус с клавиатуры) — справа от контура этажа.
    let lastPoint = null;
    const positionTooltip = (zone, point = null) => {
      const sceneRect = scene.getBoundingClientRect();
      const zoneRect = zone.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();
      const gap = s(16);

      const anchorX = point ? point.x : zoneRect.right;
      let left = anchorX - sceneRect.left + gap;
      let top = point
        ? point.y - sceneRect.top - tipRect.height / 2
        : zoneRect.top - sceneRect.top + zoneRect.height / 2 - tipRect.height / 2;

      if (left + tipRect.width > sceneRect.width) {
        left = (point ? point.x : zoneRect.left) - sceneRect.left - tipRect.width - gap;
      }
      // фасад шире экрана — прижимаем карточку к краю, чтобы не уехала
      left = Math.max(s(8), Math.min(left, sceneRect.width - tipRect.width - s(8)));
      top = Math.max(s(8), Math.min(top, sceneRect.height - tipRect.height - s(8)));

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const setActive = (zone, point = null) => {
      if (!zone) return;
      active = zone;
      lastPoint = point;
      zones.forEach((z) => z.classList.toggle("is-active", z === zone));
      const isBase = zone.hasAttribute("data-base");
      if (tipCaption) tipCaption.textContent = zone.dataset.caption;
      if (tipNum) tipNum.textContent = zone.dataset.floor;
      // Полоса цоколя/коммерции — без «В продаже»
      if (tipDivider) tipDivider.style.display = isBase ? "none" : "";
      if (tipSale) tipSale.style.display = isBase ? "none" : "";
      if (!isBase && tipAvailable) tipAvailable.textContent = zone.dataset.free;
      tooltip.classList.add("is-visible");
      positionTooltip(zone, point);
    };

    const clearActive = () => {
      active = null;
      zones.forEach((z) => z.classList.remove("is-active"));
      tooltip.classList.remove("is-visible");
    };

    // Десктоп: выбор этажа по наведению / фокусу, клик — открыть план
    const canOpen = (zone) =>
      zone && !zone.hasAttribute("data-base") && !zone.classList.contains("is-empty");
    zones.forEach((zone) => {
      zone.addEventListener("mouseenter", (e) => setActive(zone, { x: e.clientX, y: e.clientY }));
      zone.addEventListener("mousemove", (e) => {
        lastPoint = { x: e.clientX, y: e.clientY };
        positionTooltip(zone, lastPoint);
      });
      zone.addEventListener("mouseleave", (e) => {
        // ушли на саму карточку — не прячем, чтобы по ней можно было кликнуть
        if (e.relatedTarget && tooltip.contains(e.relatedTarget)) return;
        clearActive();
      });
      zone.addEventListener("focus", () => setActive(zone));
      zone.addEventListener("blur", clearActive);
      zone.addEventListener("click", () => {
        if (canOpen(zone)) openPlan(zone.dataset.floor);
      });
      zone.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && canOpen(zone)) {
          e.preventDefault();
          openPlan(zone.dataset.floor);
        }
      });
    });

    // Клик по плавающей карточке — тоже открывает план активного этажа
    tooltip.addEventListener("mouseleave", (e) => {
      if (active && e.relatedTarget === active) return;
      clearActive();
    });
    tooltip.addEventListener("click", (e) => {
      e.preventDefault();
      if (canOpen(active)) openPlan(active.dataset.floor);
    });

    // Мобилка: верхний таб-бар этажей + активный этаж и подсветка контура.
    // Стрелки меняют активный этаж (и листают ленту); тап по табу или по этажу
    // на фасаде открывает план этого этажа.
    const tabsListEl = $("[data-floor-tabs-list]", root);
    const floorTabs = new Map(); // этаж → элемент таба
    // Ключ этажа: номер для жилого, подпись («Коммерция») для data-base
    const zoneKey = (z) => z.hasAttribute("data-base") ? z.dataset.floor : parseInt(z.dataset.floor, 10);
    // этаж → контуры на фасаде (по одному в каждом SVG)
    const floorZones = new Map();
    zones.forEach((z) => {
      const f = zoneKey(z);
      if (typeof f === "string" || !isNaN(f)) floorZones.set(f, [...(floorZones.get(f) || []), z]);
    });
    const availableFloors = floorNums.filter((f) => !isFloorEmpty(f));

    // Активный этаж на мобилке — одно состояние для табов, стрелок и жестов по фото.
    // Недоступные этажи и коммерция тоже подсвечиваются (как наведение на десктопе).
    let facadeFloor = null;
    const setFacadeFloor = (f) => {
      if (!floorZones.has(f)) return;
      facadeFloor = f;
      // подсветка контура на фасаде (только выбранный этаж)
      floorZones.forEach((list, fl) => list.forEach((z) => z.classList.toggle("is-current", fl === f)));
      // подсветка активного таба + подскролл ленты к нему
      floorTabs.forEach((tab, fl) => tab.classList.toggle("is-active", fl === f));
      const activeTab = floorTabs.get(f);
      if (activeTab && tabsListEl) {
        const left = activeTab.offsetLeft - (tabsListEl.clientWidth - activeTab.clientWidth) / 2;
        tabsListEl.scrollTo({ left, behavior: "smooth" });
      }
    };
    const clearFacadeFloor = () => {
      facadeFloor = null;
      zones.forEach((z) => z.classList.remove("is-current"));
      floorTabs.forEach((tab) => tab.classList.remove("is-active"));
    };
    // Стрелки: шаг к соседнему доступному этажу (не открывает план).
    // С недоступного этажа / коммерции (её считаем ниже жилых) — к ближайшему доступному.
    const stepFacade = (dir) => {
      if (!availableFloors.length) return;
      if (facadeFloor == null) { setFacadeFloor(availableFloors[0]); return; }
      const cur = typeof facadeFloor === "number" ? facadeFloor : -Infinity;
      const next = dir > 0
        ? availableFloors.find((f) => f > cur)
        : [...availableFloors].reverse().find((f) => f < cur);
      if (next != null) setFacadeFloor(next);
    };

    if (tabsListEl) {
      // Коммерцию/паркинг (data-base) в табы не выводим — только жилые этажи
      floorNums.forEach((floor) => {
        const empty = isFloorEmpty(floor);
        const tab = document.createElement("a");
        tab.className = "floor__tabs-tab" + (empty ? " is-empty" : "");
        tab.href = "#";
        tab.textContent = floor;
        tab.addEventListener("click", (e) => {
          e.preventDefault();
          if (!empty) { setFacadeFloor(floor); openPlan(floor); } // тап по табу → открыть план
        });
        tabsListEl.appendChild(tab);
        if (!empty) floorTabs.set(floor, tab);
      });

      // Стрелки меняют активный этаж и подскроливают ленту
      $("[data-floor-tabs-prev]", root)?.addEventListener("click", () => stepFacade(-1));
      $("[data-floor-tabs-next]", root)?.addEventListener("click", () => stepFacade(1));

      // Стартовый активный этаж — самый нижний доступный (напр. 2)
      setFacadeFloor(availableFloors[0]);
    }

    // Мобилка: жесты по фото. Мобильная сцена на десктопе скрыта — там всё как было.
    //   тап по этажу — подсветить (общее состояние с табами и стрелками);
    //   повторный тап по подсвеченному — открыть план (если открывается и на десктопе);
    //   ведение пальцем вверх/вниз — подсветка едет за пальцем, без перехода;
    //   тап мимо этажей — снять подсветку.
    // Направление решаем по первому заметному сдвигу: вертикально и начато на этаже —
    // свайп по этажам (скролл блокируем), иначе — обычный скролл сцены / страницы.
    const gestureArea = $("[data-floor-scroll]", root);
    if (gestureArea) {
      const zoneAt = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const zone = el && el.closest && el.closest(".floor__band");
        return zone && gestureArea.contains(zone) ? zone : null;
      };
      let gesture = null; // { x, y, zone, mode: "tap" | "swipe" | "scroll" }

      gestureArea.addEventListener("touchstart", (e) => {
        if (e.touches.length > 1) { gesture = null; return; } // щипок — не наш жест
        const t = e.touches[0];
        gesture = { x: t.clientX, y: t.clientY, zone: zoneAt(t.clientX, t.clientY), mode: "tap" };
      }, { passive: true });

      gestureArea.addEventListener("touchmove", (e) => {
        if (!gesture || gesture.mode === "scroll") return;
        const t = e.touches[0];
        if (gesture.mode === "tap") {
          const dx = Math.abs(t.clientX - gesture.x);
          const dy = Math.abs(t.clientY - gesture.y);
          if (dx < 6 && dy < 6) return; // дрожание пальца — ещё тап
          gesture.mode = gesture.zone && dy > dx && e.cancelable ? "swipe" : "scroll";
          if (gesture.mode === "scroll") return;
        }
        e.preventDefault();
        const zone = zoneAt(t.clientX, t.clientY);
        if (zone) setFacadeFloor(zoneKey(zone));
      }, { passive: false });

      gestureArea.addEventListener("touchend", (e) => {
        if (!gesture || e.touches.length) return;
        const { mode, zone } = gesture;
        gesture = null;
        if (mode === "scroll") return;
        // без синтетических mouse/click — иначе клик по этажу сразу откроет план
        if (e.cancelable) e.preventDefault();
        if (mode === "swipe") return;
        if (!zone) { clearFacadeFloor(); return; }
        const key = zoneKey(zone);
        if (key !== facadeFloor) setFacadeFloor(key);
        else if (canOpen(zone)) openPlan(zone.dataset.floor);
      }, { passive: false });

      gestureArea.addEventListener("touchcancel", () => { gesture = null; });
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
      if (active) positionTooltip(active, lastPoint);
    }, 150));

    // Тема (день / ночь) — переключает класс, подпись и меняет картинки
    const themeBtn = $("[data-floor-theme]", root);
    const themeLabel = $("[data-floor-theme-label]", root);
    // Картинки с ночным вариантом: запоминаем дневной src, чтобы вернуть обратно
    const themeImgs = $$("[data-night]", root);
    themeImgs.forEach((img) => { img.dataset.day = img.getAttribute("src"); });
    const applyThemeImages = (night) => {
      themeImgs.forEach((img) => {
        const next = night ? img.dataset.night : img.dataset.day;
        if (next) img.setAttribute("src", next);
      });
    };
    // Подгружаем ночное фото заранее, чтобы переключение было без мигания
    // (только видимые — мобильное фото на десктопе и наоборот не грузим)
    themeImgs.forEach((img) => {
      if (img.dataset.night && img.offsetParent !== null) new Image().src = img.dataset.night;
    });

    // Мобилка: горизонтальный скролл сцены.
    // Размер сцены считаем здесь, а не в CSS: Safari на iOS не выводит ширину
    // flex-элемента из aspect-ratio при высоте в %, и скролл пропадает.
    // Ширина = высота экрана × пропорции фото (--floor-ratio), но не уже экрана.
    // data-floor-scroll="0.5" — стартовая позиция: по центру (0 — левый край, 1 — правый).
    const sceneScroll = $("[data-floor-scroll]", root);
    const sceneStage = sceneScroll && $(".floor__stage--mobile", sceneScroll);
    if (sceneScroll && sceneStage) {
      const scrollPhoto = $(".floor__photo", sceneStage);

      // Пропорции: по самому фото, как только оно загрузилось (это всегда верно,
      // даже если в разметке --floor-ratio от другого ЖК). До загрузки — из --floor-ratio.
      const stageRatio = () => {
        if (scrollPhoto && scrollPhoto.naturalHeight) {
          return scrollPhoto.naturalWidth / scrollPhoto.naturalHeight;
        }
        const [w, h] = getComputedStyle(sceneStage)
          .getPropertyValue("--floor-ratio")
          .split("/")
          .map((v) => parseFloat(v));
        return w > 0 && h > 0 ? w / h : 0;
      };

      const sizeStage = () => {
        const h = sceneScroll.clientHeight;
        const ratio = stageRatio();
        if (!h || !ratio) return; // на десктопе сцена скрыта
        sceneStage.style.height = `${h}px`;
        sceneStage.style.width = `${Math.max(sceneScroll.clientWidth, Math.round(h * ratio))}px`;
      };

      const maxScroll = () => sceneScroll.scrollWidth - sceneScroll.clientWidth;
      const scrollToStart = () => {
        const pos = parseFloat(sceneScroll.dataset.floorScroll);
        const max = maxScroll();
        if (max > 0) sceneScroll.scrollLeft = max * (isNaN(pos) ? 0.5 : pos);
      };
      const setup = () => { sizeStage(); scrollToStart(); };

      setup();
      requestAnimationFrame(setup);
      if (scrollPhoto && !scrollPhoto.complete) {
        scrollPhoto.addEventListener("load", setup, { once: true });
      }
      // При ресайзе (в т.ч. когда в iOS прячется адресная строка) — пересчёт
      // размера с сохранением текущей позиции, без прыжка в центр.
      window.addEventListener("resize", debounce(() => {
        const max = maxScroll();
        const pos = max > 0 ? sceneScroll.scrollLeft / max : null;
        sizeStage();
        if (pos != null) sceneScroll.scrollLeft = maxScroll() * pos;
      }, 150));
      // при повороте экрана — заново по центру
      window.addEventListener("orientationchange", () => setTimeout(setup, 300));
    }
    themeBtn?.addEventListener("click", () => {
      const night = root.classList.toggle("is-night");
      if (themeLabel) themeLabel.textContent = night ? "ночь" : "день";
      applyThemeImages(night);
    });

    // ======================
    // Планировка выбранного этажа
    // ======================
    if (!planRoot) return;

    // Кнопки «Вернуться назад» (в карточке и верхняя для мобилки) — возврат к фасаду
    $$("[data-floorplan-back]", app).forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showBuilding();
      })
    );

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

    // Прокрутка ленты этажей к активному табу (только сама лента, не страница)
    const scrollTabIntoView = (tab) => {
      if (!tab || !tabsList) return;
      const left = tab.offsetLeft - (tabsList.clientWidth - tab.clientWidth) / 2;
      tabsList.scrollTo({ left, behavior: "smooth" });
    };

    let currentFloor = null;
    function planSetFloor(f) {
      if (f < start || f > top || isFloorEmpty(f)) return; // недоступный этаж — игнор
      currentFloor = f;
      tabs.forEach((btn, i) => btn.classList.toggle("is-active", start + i === f));
      if (floorField) floorField.textContent = f;
      scrollTabIntoView(tabs[f - start]); // лента следует за выбранным этажом
      showCanvas(f); // показать канвас (план) выбранного этажа
      setPlanHash(f); // запомнить этаж в URL
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

    // ---- Переход на быстрый просмотр ----
    const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
    const goToQuickview = (unit) => {
      if (!unit) return;
      const params = new URLSearchParams();
      if (unit.dataset.num) params.set("unit", unit.dataset.num);
      if (currentFloor != null) params.set("floor", currentFloor);
      location.href = `quickview.html?${params.toString()}`;
    };

    // Мобилка: всплывающая кнопка «Посмотреть» над выбранной квартирой.
    // Одна кнопка на канвас, позиционируется в центре контура (в % от viewBox).
    const showViewButton = (unit) => {
      const canvas = unit.closest(".plan__plan");
      const svg = canvas && $("svg", canvas);
      const shape = $(".plan__unit-shape", unit);
      const vb = svg && svg.viewBox && svg.viewBox.baseVal;
      if (!canvas || !shape || !vb || !vb.width) return;
      const box = shape.getBBox();
      let btn = $(".plan__view-btn", canvas);
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "plan__view-btn";
        btn.textContent = "Посмотреть";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          goToQuickview(btn._unit);
        });
        canvas.appendChild(btn);
      }
      btn._unit = unit;
      btn.style.left = `${((box.x + box.width / 2) / vb.width) * 100}%`;
      btn.style.top = `${((box.y + box.height / 2) / vb.height) * 100}%`;
      btn.classList.add("is-visible");
    };

    // Клик по квартире: десктоп — сразу на quickview; мобилка — инфа + кнопка
    const onUnitClick = (unit) => {
      if (isMobile()) {
        showUnit(unit);
        showViewButton(unit);
      } else {
        goToQuickview(unit);
      }
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
      unit.addEventListener("click", () => onUnitClick(unit)); // тач/клик
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

    // ---- Несколько канвасов: показываем план выбранного этажа ----
    // Привязка канвас → этаж(и): data-plan-floor="3" или "2,3,4".
    // Если не задано — канвас служит запасным для всех этажей.
    const canvases = $$(".plan__plan", planRoot);
    const canvasFloors = (c) =>
      (c.dataset.planFloor || "").split(",").map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
    const canvasForFloor = (f) =>
      canvases.find((c) => canvasFloors(c).includes(f)) || canvases[0];

    // до выбора этажа прячем все канвасы, кроме первого, чтобы не наслаивались
    canvases.forEach((c, i) => c.classList.toggle("is-hidden", i !== 0));

    // Бейджи строим ЛЕНИВО и по-канвасно: getBBox корректен только у видимого.
    const builtCanvases = new WeakSet();
    const buildBadgesFor = (canvas) => {
      if (builtCanvases.has(canvas)) return;
      builtCanvases.add(canvas);
      $$("[data-plan-unit]", canvas).forEach((unit) => {
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
    };

    function showCanvas(f) {
      const target = canvasForFloor(f);
      if (!target) return;
      canvases.forEach((c) => c.classList.toggle("is-hidden", c !== target));
      $$(".plan__view-btn", planRoot).forEach((b) => b.classList.remove("is-visible")); // прячем кнопку при смене этажа
      buildBadgesFor(target); // канвас теперь виден → геометрия корректна
      const first = $$("[data-plan-unit]", target).find((u) => !isSold(u));
      if (first) showUnit(first);
    }

    // Восстановление вида после перезагрузки: #plan-5 → сразу открыть план этажа 5
    const hashMatch = location.hash.match(/^#plan-(\d+)/);
    if (hashMatch) {
      const f = parseInt(hashMatch[1], 10);
      if (f >= start && f <= top && !isFloorEmpty(f)) openPlan(f);
    }
  };

  document.addEventListener("DOMContentLoaded", initFloorplan);
})();
