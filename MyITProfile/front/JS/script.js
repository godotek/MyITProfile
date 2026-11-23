document.addEventListener("DOMContentLoaded", function () {
    const $ = function (selector, root) { return (root || document).querySelector(selector); };
    const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
    const { accounts, semesterDates, subjects, lessons, defaultLesson, menus } = window.itMoscowData;
    const toast = $("[data-toast]");
    let toastTimer;

    function showMessage(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove("visible"); }, 2600);
    }

    document.addEventListener("click", function (event) {
        const link = event.target.closest("[data-message]");
        if (!link) return;
        event.preventDefault();
        showMessage(link.dataset.message || "Раздел пока не подключён");
    });

    const sessionKey = "itmoscow.student";

    const passwordToggle = $("[data-password-toggle]");
    const passwordField = $("#student-password");

    if (passwordToggle && passwordField) {
        passwordToggle.addEventListener("click", function () {
            const visible = passwordField.type === "password";
            passwordField.type = visible ? "text" : "password";
            passwordToggle.setAttribute("aria-label", visible ? "Скрыть пароль" : "Показать пароль");
            passwordToggle.setAttribute("aria-pressed", visible);
        });
    }

    function readSession() {
        try {
            const raw = localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey);
            const data = raw ? JSON.parse(raw) : null;
            const account = data && accounts.find(function (item) { return item.login === data.login; });
            if (!account) return null;
            const profile = Object.assign({}, account);
            delete profile.password;
            return profile;
        } catch (error) {
            return null;
        }
    }

    function saveSession(student, remember) {
        const data = Object.assign({}, student);
        delete data.password;

        try {
            localStorage.removeItem(sessionKey);
            sessionStorage.removeItem(sessionKey);
            (remember ? localStorage : sessionStorage).setItem(sessionKey, JSON.stringify(data));
        } catch (error) {
            showMessage("Браузер запретил сохранение сессии, вход не сохранится после перехода");
        }

    }

    function clearSession() {
        try {
            localStorage.removeItem(sessionKey);
            sessionStorage.removeItem(sessionKey);
        } catch (error) {
            return;
        }
    }

    let sideProfile = null;
    let sideLogout = null;

    function updateStudentUI(session) {
        $$("[data-profile-menu]").forEach(function (menu) {
            menu.classList.toggle("is-guest", !session);
            menu.classList.remove("is-open");

            const button = $(".profile-button", menu);
            if (button) {
                button.textContent = session ? session.firstName : "Войти";
                if (session) button.title = session.fullName + " · группа " + session.group;
                else button.removeAttribute("title");
            }

            if (!session) return;

            const fields = {
                "[data-profile-name]": session.fullName,
                "[data-profile-group]": session.group,
                "[data-profile-specialty]": session.specialty,
                "[data-profile-course]": session.course,
                "[data-profile-login]": session.login
            };

            Object.keys(fields).forEach(function (selector) {
                const node = $(selector, menu);
                if (node) node.textContent = fields[selector];
            });
        });

        if (sideProfile) {
            sideProfile.textContent = session ? session.firstName : "Войти";
            sideProfile.href = session ? "main.html" : "index.html";
            sideProfile.title = session ? session.fullName : "Войти в кабинет";
        }
        if (sideLogout) sideLogout.hidden = !session;
    }

    document.addEventListener("click", function (event) {
        if (event.target.closest("[data-logout]")) {
            clearSession();
            updateStudentUI(null);
            window.location.href = "index.html";
            return;
        }

        const profileButton = event.target.closest(".profile-button");
        const menu = profileButton && profileButton.closest("[data-profile-menu]");

        if (menu && !menu.classList.contains("is-guest")) {
            event.preventDefault();
            menu.classList.toggle("is-open");
            return;
        }

        $$("[data-profile-menu].is-open").forEach(function (openMenu) {
            if (!openMenu.contains(event.target)) openMenu.classList.remove("is-open");
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        $$("[data-profile-menu].is-open").forEach(function (menu) { menu.classList.remove("is-open"); });
    });

    const loginForm = $("[data-login-form]");

    if (loginForm) {
        const loginInput = $("#student-login", loginForm);
        const loginPassword = $("#student-password", loginForm);
        const rememberInput = $('input[name="remember"]', loginForm);
        const loginMessage = $("[data-login-message]");

        function setLoginMessage(text, isError) {
            if (!loginMessage) return;
            loginMessage.textContent = text;
            loginMessage.classList.toggle("is-error", Boolean(isError));
        }

        [loginInput, loginPassword].forEach(function (input) {
            if (!input) return;
            input.addEventListener("input", function () {
                input.removeAttribute("aria-invalid");
                setLoginMessage("", false);
            });
        });

        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const login = loginInput ? loginInput.value.trim().toLowerCase() : "";
            const password = loginPassword ? loginPassword.value : "";
            const student = accounts.find(function (account) {
                return account.login === login && account.password === password;
            });

            if (!student) {
                setLoginMessage("Неверный логин или пароль. Проверьте раскладку клавиатуры и Caps Lock.", true);
                if (loginInput) loginInput.setAttribute("aria-invalid", "true");
                if (loginPassword) {
                    loginPassword.setAttribute("aria-invalid", "true");
                    loginPassword.value = "";
                    loginPassword.focus();
                }
                return;
            }

            saveSession(student, Boolean(rememberInput && rememberInput.checked));
            setLoginMessage("Вход выполнен. Открываем дневник…", false);
            setTimeout(function () { window.location.href = "main.html"; }, 650);
        });
    }

    const slider = $("[data-news-slider]");
    const cards = slider ? $$("[data-news-card]", slider) : [];
    const tabs = $$(".news-tab");
    const prevButton = $("[data-news-prev]");
    const nextButton = $("[data-news-next]");

    if (slider && cards.length >= 3) {
        let activeIndex = cards.findIndex(function (card) { return card.classList.contains("active"); });
        if (activeIndex < 0) activeIndex = 0;

        function renderSlide() {
            const count = cards.length;
            const left = (activeIndex + count - 1) % count;
            const right = (activeIndex + 1) % count;

            cards.forEach(function (card, index) {
                const position = index === activeIndex ? "center" : index === left ? "left" : index === right ? "right" : "hidden";
                card.dataset.position = position;
                card.classList.toggle("active", index === activeIndex);
                card.setAttribute("aria-hidden", String(position === "hidden"));
                const link = card.querySelector("a");
                if (link) link.tabIndex = position === "hidden" ? -1 : 0;
            });

            tabs.forEach(function (tab, index) {
                tab.classList.toggle("active", index === activeIndex);
            });
        }

        function stepSlide(step) {
            activeIndex = (activeIndex + step + cards.length) % cards.length;
            renderSlide();
        }

        if (prevButton) prevButton.addEventListener("click", function () { stepSlide(-1); });
        if (nextButton) nextButton.addEventListener("click", function () { stepSlide(1); });

        let touchStartX = null;

        slider.addEventListener("touchstart", function (event) {
            touchStartX = event.touches[0].clientX;
        }, { passive: true });

        slider.addEventListener("touchend", function (event) {
            if (touchStartX === null) return;
            const deltaX = event.changedTouches[0].clientX - touchStartX;
            touchStartX = null;
            if (Math.abs(deltaX) > 40) stepSlide(deltaX < 0 ? 1 : -1);
        });

        renderSlide();
    }

    const panelHeader = $(".site-header");

    if (panelHeader) {
        const sourceNav = $(".main-nav", panelHeader);
        const balanceNode = $(".balance h2");
        const phoneNode = $(".footer-phone");

        const navToggle = document.createElement("button");
        navToggle.type = "button";
        navToggle.className = "nav-toggle";
        navToggle.setAttribute("aria-label", "Открыть меню");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-controls", "side-panel");
        navToggle.innerHTML = "<span></span><span></span><span></span>";
        panelHeader.appendChild(navToggle);

        const sidePanel = document.createElement("aside");
        sidePanel.className = "side-panel";
        sidePanel.id = "side-panel";
        sidePanel.setAttribute("aria-hidden", "true");
        sidePanel.innerHTML =
            '<a class="side-profile" href="index.html" data-side-profile>Войти</a>' +
            '<p class="side-status"><span class="side-status-dot"></span>В колледже</p>' +
            '<nav class="side-nav" aria-label="Меню страниц"></nav>' +
            '<div class="side-panel-foot">' +
            (balanceNode ? '<p class="side-balance">' + balanceNode.textContent + "</p>" : "") +
            (phoneNode ? '<p class="side-phone">' + phoneNode.textContent + "</p>" : "") +
            '<button class="side-logout" type="button" data-logout hidden>Выход</button>' +
            "</div>";

        const sideOverlay = document.createElement("div");
        sideOverlay.className = "side-overlay";
        sideOverlay.hidden = true;

        document.body.appendChild(sideOverlay);
        document.body.appendChild(sidePanel);

        const sideNav = $(".side-nav", sidePanel);

        if (sourceNav) {
            $$("a", sourceNav).forEach(function (link) {
                const item = document.createElement("a");
                item.className = "side-link" + (link.classList.contains("active") ? " is-active" : "");
                item.href = link.getAttribute("href");
                item.textContent = link.textContent.trim();
                sideNav.appendChild(item);
            });
        }

        sideProfile = $("[data-side-profile]", sidePanel);
        sideLogout = $("[data-logout]", sidePanel);

        function openSidePanel() {
            sidePanel.classList.add("is-open");
            navToggle.classList.add("is-open");
            sideOverlay.hidden = false;
            document.body.classList.add("panel-open");
            navToggle.setAttribute("aria-expanded", "true");
            sidePanel.setAttribute("aria-hidden", "false");

            const firstLink = $(".side-link", sidePanel);
            if (firstLink) firstLink.focus({ preventScroll: true });
        }

        function closeSidePanel(returnFocus) {
            if (!sidePanel.classList.contains("is-open")) return;

            sidePanel.classList.remove("is-open");
            navToggle.classList.remove("is-open");
            sideOverlay.hidden = true;
            document.body.classList.remove("panel-open");
            navToggle.setAttribute("aria-expanded", "false");
            sidePanel.setAttribute("aria-hidden", "true");

            if (returnFocus) navToggle.focus({ preventScroll: true });
        }

        navToggle.addEventListener("click", function () {
            if (sidePanel.classList.contains("is-open")) closeSidePanel(true);
            else openSidePanel();
        });

        sideOverlay.addEventListener("click", function () { closeSidePanel(true); });

        sidePanel.addEventListener("click", function (event) {
            if (event.target.closest(".side-link") || event.target.closest("[data-logout]")) closeSidePanel(false);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeSidePanel(true);
        });

    }

    updateStudentUI(readSession());

    const gradesPage = $(".grades-page");

    if (gradesPage) {
        const gradesTabs = document.createElement("div");
        gradesTabs.className = "grades-tabs";
        gradesTabs.setAttribute("role", "tablist");
        gradesTabs.innerHTML =
            '<button class="grades-tab is-active" type="button" role="tab" aria-selected="true" data-grades-tab="daily">За день</button>' +
            '<button class="grades-tab" type="button" role="tab" aria-selected="false" data-grades-tab="subjects">По предмету</button>';
        const gradesTitle = $(".page-title", gradesPage);
        if (gradesTitle) gradesTitle.insertAdjacentElement("afterend", gradesTabs);
        else gradesPage.insertBefore(gradesTabs, gradesPage.firstChild);

        gradesTabs.addEventListener("click", function (event) {
            const tab = event.target.closest("[data-grades-tab]");
            if (!tab) return;

            gradesPage.classList.toggle("show-subjects", tab.dataset.gradesTab === "subjects");

            $$(".grades-tab", gradesTabs).forEach(function (item) {
                const active = item === tab;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", String(active));
            });
        });
    }

    const weekGrid = $(".week-grid");

    if (weekGrid) {
        const weekCards = $$(".week-card", weekGrid);
        const dateHeading = $(".week-date-heading");
        const weekRange = ($(".week-date-heading span") || {}).textContent || "";
        const weekStart = parseInt((weekRange.match(/\d{1,2}/) || [])[0], 10);
        const shortDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
        const dayPicker = document.createElement("div");
        dayPicker.className = "day-picker";

        function setDay(index) {
            weekCards.forEach(function (card, position) {
                card.classList.toggle("is-active", position === index);
            });

            $$(".day-chip", dayPicker).forEach(function (chip, position) {
                const active = position === index;
                chip.classList.toggle("is-active", active);
                chip.setAttribute("aria-current", active ? "true" : "false");
            });
        }

        weekCards.forEach(function (card, index) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "day-chip";
            if (index === 1) chip.classList.add("is-today");
            chip.innerHTML = "<span>" + (shortDays[index] || "") + "</span>" +
                (weekStart ? "<strong>" + (weekStart + index) + "</strong>" : "");
            chip.addEventListener("click", function () { setDay(index); });
            dayPicker.appendChild(chip);
        });

        if (dateHeading) dateHeading.insertAdjacentElement("afterend", dayPicker);

        const currentIndex = weekCards.findIndex(function (card) { return $(".lesson-now", card); });
        setDay(currentIndex < 0 ? 0 : currentIndex);
    }

    const bellsTableCard = $(".bells-table-card");

    if (bellsTableCard) {
        const rows = $$(".bells-table tbody tr", bellsTableCard);
        const bellsCards = document.createElement("div");
        bellsCards.className = "bells-cards";
        let currentShift = 0;

        rows.forEach(function (row) {
            const cells = $$("td", row);
            const firstShift = cells[0].classList.contains("pink-number");
            const shift = firstShift ? 1 : 2;

            if (shift !== currentShift) {
                currentShift = shift;
                const title = document.createElement("h2");
                title.className = "bells-shift-title " + (firstShift ? "is-first" : "is-second");
                title.textContent = shift + " смена";
                bellsCards.appendChild(title);
            }

            const breakText = cells[4].textContent.trim();
            const card = document.createElement("article");
            card.className = "bells-pair-card";
            card.innerHTML =
                '<div class="bells-pair-head"><span>Пара</span><span>Урок</span><span>Начало</span><span>Конец</span><span>Перемена</span></div>' +
                '<div class="bells-pair-values">' +
                    '<span class="' + (firstShift ? "pink-number" : "blue-number") + '">' + cells[0].textContent.trim() + "</span>" +
                    '<span class="' + (firstShift ? "pink-number" : "blue-number") + '">' + cells[1].innerHTML + "</span>" +
                    "<span>" + cells[2].textContent.trim() + "</span>" +
                    "<span>" + cells[3].textContent.trim() + "</span>" +
                    "<span>" + (breakText === "Домой" ? "Конец" : breakText) + "</span>" +
                "</div>";
            bellsCards.appendChild(card);
        });

        bellsTableCard.insertAdjacentElement("afterend", bellsCards);
    }

    const modalRoot = document.createElement("div");
    modalRoot.className = "modal-overlay";
    modalRoot.hidden = true;
    modalRoot.innerHTML =
        '<div class="modal-shell"><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">' +
        '<div class="modal-main"><header class="modal-head" data-modal-head><h2 id="modal-title" data-modal-title></h2>' +
        '<p class="modal-subtitle" data-modal-subtitle></p></header>' +
        '<div class="modal-body" data-modal-body></div>' +
        '<footer class="modal-footer" data-modal-footer hidden></footer></div>' +
        '<div class="modal-visual" data-modal-visual aria-hidden="true"></div></div>' +
        '<button class="modal-close" type="button" data-modal-close aria-label="Закрыть">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg>' +
        "</button></div>";
    document.body.appendChild(modalRoot);

    const modalHead = $("[data-modal-head]", modalRoot);
    const modalTitle = $("[data-modal-title]", modalRoot);
    const modalSubtitle = $("[data-modal-subtitle]", modalRoot);
    const modalBody = $("[data-modal-body]", modalRoot);
    const modalFooter = $("[data-modal-footer]", modalRoot);
    const modalVisual = $("[data-modal-visual]", modalRoot);
    const modalCard = $(".modal-card", modalRoot);
    let modalReturnFocus = null;
    let modalHideTimer;

    function averageOf(marks) {
        return (marks.reduce(function (sum, mark) { return sum + mark; }, 0) / marks.length).toFixed(2);
    }

    function openModal(options) {
        modalTitle.textContent = options.title;
        modalSubtitle.textContent = options.subtitle || "";
        modalSubtitle.hidden = !options.subtitle;
        modalBody.innerHTML = options.body;
        modalVisual.className = "modal-visual is-" + (options.visual || "code");
        modalFooter.innerHTML = options.footer || "";
        modalFooter.hidden = !options.footer;
        modalHead.classList.toggle("is-pink", options.accent === "pink");
        modalBody.scrollTop = 0;

        if (modalHideTimer) clearTimeout(modalHideTimer);
        if (!modalRoot.hidden && modalRoot.classList.contains("is-open")) return;

        modalRoot.hidden = false;
        document.body.classList.add("modal-open");
        if (!modalReturnFocus) modalReturnFocus = document.activeElement;
        modalCard.focus({ preventScroll: true });

        requestAnimationFrame(function () { modalRoot.classList.add("is-open"); });
    }

    function closeModal() {
        if (modalRoot.hidden) return;

        modalRoot.classList.remove("is-open");
        document.body.classList.remove("modal-open");
        modalHideTimer = setTimeout(function () { modalRoot.hidden = true; }, 180);

        if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus({ preventScroll: true });
        modalReturnFocus = null;
    }

    modalRoot.addEventListener("click", function (event) {
        if (event.target === modalRoot || event.target.closest("[data-modal-close]")) closeModal();
    });

    document.addEventListener("keydown", function (event) {
        if (modalRoot.hidden) return;

        if (event.key === "Escape") {
            closeModal();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", modalRoot).filter(function (node) {
            return node.offsetParent !== null;
        });

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    function semesterCard(marks, index) {
        const tiles = marks.map(function (mark) {
            return '<span class="modal-mark' + (mark <= 2 ? " is-low" : "") + '">' + mark + "</span>";
        }).join("");

        return '<section class="semester-card"><div class="semester-head"><div><strong>Семестр ' + (index + 1) +
            '</strong><small>' + semesterDates[index] + '</small></div><div class="semester-average"><strong>' +
            averageOf(marks) + '</strong><small>средний балл</small></div></div><div class="modal-marks">' + tiles + "</div></section>";
    }

    function modalField(label, value) {
        return '<div class="modal-field"><span class="modal-label">' + label + '</span><div class="modal-box">' + value + "</div></div>";
    }

    function subjectModal(key) {
        const subject = subjects[key];
        if (!subject) return;

        openModal({
            title: subject.name,
            subtitle: "Преподаватель: " + subject.teacher,
            body: subject.marks.map(semesterCard).join(""),
            footer: '<span>Средний балл по предмету</span><strong class="modal-summary-value">' + averageOf(subject.marks.flat()) + '</strong>',
            visual: subject.visual || "study"
        });
    }

    function lessonModal(lesson) {
        const subjectNode = $(".week-subject", lesson);
        if (!subjectNode) return;

        const card = lesson.closest(".week-card");
        const subject = subjectNode.childNodes[0].textContent.trim();
        const details = lessons[subject] || defaultLesson;
        const room = (($("small", subjectNode) || {}).textContent || "").replace("каб.", "").trim();
        const meta = [
            card && card.querySelector("h2").childNodes[0].textContent.trim(),
            ($(".week-time > span", lesson) || {}).textContent,
            room && "кабинет " + room,
            card && card.classList.contains("saturday-card") && "дистанционно"
        ].filter(Boolean).join(" · ");

        openModal({
            title: subject,
            subtitle: meta,
            body: modalField("Преподаватель", details.teacher) +
                modalField("Материалы для изучения", details.materials) +
                modalField("Домашнее задание", details.homework) +
                modalField("Что взять с собой", details.bring),
            visual: subject === "Веб-разработка" ? "code" : "study"
        });
    }

    function menuModal(card, key) {
        const details = menus[key];
        if (!details) return;

        const title = $("h2", card).textContent.trim();
        const price = $(".menu-total", card).textContent.trim();
        const items = $$(".menu-items p", card).map(function (item) {
            return "<p><span>" + $("span", item).textContent + "</span><small>" + $("small", item).textContent + "</small></p>";
        }).join("");
        const facts = [
            ["Калорийность", details.calories],
            ["Белки", details.protein],
            ["Жиры", details.fat],
            ["Углеводы", details.carbs]
        ].map(function (fact) {
            return "<p><span>" + fact[0] + "</span><strong>" + fact[1] + "</strong></p>";
        }).join("");

        openModal({
            title: "Оплата обеда",
            subtitle: "Меню: " + title,
            accent: "pink",
            body: '<p class="modal-label">Состав меню:</p><div class="modal-box modal-menu-list">' + items +
                '</div><div class="modal-menu-facts">' + facts +
                '</div><p class="modal-label modal-label-spaced">Аллергены</p><p class="modal-allergens">' +
                details.allergens + '</p><p class="modal-note">' + details.note + "</p>",
            footer: '<button class="modal-pay-button" type="button" data-modal-pay>Оплатить</button>' +
                '<p class="modal-total">К оплате: <strong>' + price + "</strong></p>",
            visual: "food"
        });

        const payButton = $("[data-modal-pay]", modalFooter);
        if (payButton) {
            payButton.addEventListener("click", function () {
                showMessage("Оплата меню «" + title + "» пока недоступна: платёжная система не подключена");
            });
        }
    }

    document.addEventListener("click", function (event) {
        const trigger = event.target.closest("[data-modal-subject], .week-lesson .detail-button, .menu-card .menu-pay-button");
        if (!trigger) return;

        event.preventDefault();

        if (trigger.dataset.modalSubject) {
            subjectModal(trigger.dataset.modalSubject);
            return;
        }

        const lesson = trigger.closest(".week-lesson");
        if (lesson) {
            lessonModal(lesson);
            return;
        }

        const card = trigger.closest(".menu-card");
        if (card) menuModal(card, card.dataset.menu);
    });
});
