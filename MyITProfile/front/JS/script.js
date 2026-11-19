document.addEventListener("DOMContentLoaded", function () {
    const toast = document.querySelector("[data-toast]");
    let toastTimer;

    function showMessage(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("visible");
        }, 2600);
    }

    document.querySelectorAll("[data-message]").forEach(function (element) {
        element.addEventListener("click", function (event) {
            event.preventDefault();
            showMessage(element.dataset.message || "Раздел пока не подключён");
        });
    });

    const passwordToggle = document.querySelector("[data-password-toggle]");
    const passwordInput = document.querySelector("#student-password");

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", function () {
            const isVisible = passwordInput.type === "password";
            passwordInput.type = isVisible ? "text" : "password";
            passwordToggle.setAttribute("aria-label", isVisible ? "Скрыть пароль" : "Показать пароль");
            passwordToggle.setAttribute("aria-pressed", String(isVisible));
        });
    }

    const STUDENT_ACCOUNTS = [
        {
            login: "demekhin",
            password: "Artem2026!",
            firstName: "Артем",
            fullName: "Демехин Артем",
            group: "2ВР-1-25",
            specialty: "Веб-разработка",
            course: "2 курс"
        },
        {
            login: "balashov",
            password: "Evgeniy2026!",
            firstName: "Евгений",
            fullName: "Балашов Евгений",
            group: "2ВР-1-25",
            specialty: "Веб-разработка",
            course: "2 курс"
        },
        {
            login: "skovorodov",
            password: "Stepan2026!",
            firstName: "Степан",
            fullName: "Сковородов Степан",
            group: "2ВР-1-25",
            specialty: "Веб-разработка",
            course: "2 курс"
        }
    ];

    const SESSION_KEY = "itmoscow.student";

    function readSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
            const data = raw ? JSON.parse(raw) : null;
            if (!data || !data.login) return null;

            const account = STUDENT_ACCOUNTS.find(function (item) {
                return item.login === data.login;
            });

            if (!account) return null;

            return {
                login: account.login,
                firstName: account.firstName,
                fullName: account.fullName,
                group: account.group,
                specialty: account.specialty,
                course: account.course
            };
        } catch (error) {
            return null;
        }
    }

    function saveSession(student, remember) {
        const data = {
            login: student.login,
            firstName: student.firstName,
            fullName: student.fullName,
            group: student.group,
            specialty: student.specialty,
            course: student.course
        };

        try {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
            (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(data));
        } catch (error) {
            showMessage("Браузер запретил сохранение сессии, вход не сохранится после перехода");
        }

        return data;
    }

    function clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
        } catch (error) {
            return;
        }
    }

    function updateProfileMenu(session) {
        document.querySelectorAll("[data-profile-menu]").forEach(function (menu) {
            menu.classList.toggle("is-guest", !session);
            menu.classList.remove("is-open");

            const button = menu.querySelector(".profile-button");
            if (button) {
                button.textContent = session ? session.firstName : "Войти";
                if (session) {
                    button.title = session.fullName + " · группа " + session.group;
                } else {
                    button.removeAttribute("title");
                }
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
                const node = menu.querySelector(selector);
                if (node) node.textContent = fields[selector];
            });
        });
    }

    updateProfileMenu(readSession());

    document.addEventListener("click", function (event) {
        if (event.target.closest("[data-logout]")) {
            clearSession();
            updateProfileMenu(null);
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

        document.querySelectorAll("[data-profile-menu].is-open").forEach(function (openMenu) {
            if (!openMenu.contains(event.target)) openMenu.classList.remove("is-open");
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        document.querySelectorAll("[data-profile-menu].is-open").forEach(function (menu) {
            menu.classList.remove("is-open");
        });
    });

    const loginForm = document.querySelector("[data-login-form]");
    const loginMessage = document.querySelector("[data-login-message]");

    if (loginForm) {
        const loginInput = loginForm.querySelector("#student-login");
        const passwordInput = loginForm.querySelector("#student-password");
        const rememberInput = loginForm.querySelector('input[name="remember"]');

        function setLoginMessage(text, isError) {
            if (!loginMessage) return;
            loginMessage.textContent = text;
            loginMessage.classList.toggle("is-error", Boolean(isError));
        }

        [loginInput, passwordInput].forEach(function (input) {
            if (!input) return;
            input.addEventListener("input", function () {
                input.removeAttribute("aria-invalid");
                setLoginMessage("", false);
            });
        });

        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const login = loginInput ? loginInput.value.trim().toLowerCase() : "";
            const password = passwordInput ? passwordInput.value : "";
            const student = STUDENT_ACCOUNTS.find(function (account) {
                return account.login === login && account.password === password;
            });

            if (!student) {
                setLoginMessage("Неверный логин или пароль. Проверьте раскладку клавиатуры и Caps Lock.", true);
                if (loginInput) loginInput.setAttribute("aria-invalid", "true");
                if (passwordInput) {
                    passwordInput.setAttribute("aria-invalid", "true");
                    passwordInput.value = "";
                    passwordInput.focus();
                }
                return;
            }

            const session = saveSession(student, Boolean(rememberInput && rememberInput.checked));
            updateProfileMenu(session);
            setLoginMessage("Вход выполнен. Открываем дневник…", false);

            setTimeout(function () {
                window.location.href = "main.html";
            }, 650);
        });
    }

    const slider = document.querySelector("[data-news-slider]");
    const track = slider && slider.querySelector(".news-track");
    const tabs = Array.from(document.querySelectorAll("[data-slide]"));
    const cards = track ? Array.from(track.querySelectorAll("[data-news-card]")) : [];
    const previousButton = document.querySelector("[data-news-prev]");
    const nextButton = document.querySelector("[data-news-next]");

    if (slider && cards.length >= 3 && tabs.length === cards.length) {
        let activeIndex = 2;

        function showSlide(index) {
            activeIndex = (index + cards.length) % cards.length;

            const positions = {
                left: (activeIndex + cards.length - 1) % cards.length,
                center: activeIndex,
                right: (activeIndex + 1) % cards.length
            };

            cards.forEach(function (card, cardIndex) {
                card.classList.toggle("active", cardIndex === activeIndex);

                let position = "hidden";
                if (cardIndex === positions.left) position = "left";
                else if (cardIndex === positions.right) position = "right";
                else if (cardIndex === positions.center) position = "center";

                card.dataset.position = position;

                const isHidden = position === "hidden";
                card.setAttribute("aria-hidden", String(isHidden));
                const link = card.querySelector("a");
                if (link) link.tabIndex = isHidden ? -1 : 0;
            });

            tabs.forEach(function (tab, tabIndex) {
                const isActive = tabIndex === activeIndex;
                tab.classList.toggle("active", isActive);
                tab.setAttribute("aria-pressed", String(isActive));
            });
        }

        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                showSlide(Number(tab.dataset.slide));
            });
        });

        if (previousButton) {
            previousButton.addEventListener("click", function () {
                showSlide(activeIndex - 1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener("click", function () {
                showSlide(activeIndex + 1);
            });
        }

        showSlide(activeIndex);

        let touchStartX = null;

        slider.addEventListener("touchstart", function (event) {
            touchStartX = event.touches[0].clientX;
        }, { passive: true });

        slider.addEventListener("touchend", function (event) {
            if (touchStartX === null) return;

            const deltaX = event.changedTouches[0].clientX - touchStartX;
            touchStartX = null;

            if (Math.abs(deltaX) > 40) {
                showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
            }
        });
    }

    // ----------------- Модальные окна -----------------

    const SEMESTER_DATES = ["1 сентября — 28 декабря", "1 января — 28 марта", "7 апреля — 31 мая"];

    const SUBJECT_DETAILS = {
        history: {
            name: "История",
            teacher: "Дмитрий Петрович",
            marks: [[5, 4, 5, 5, 4, 5, 4], [5, 5, 4, 4, 5, 5, 4], [5, 4, 5, 5, 5, 4, 5]]
        },
        math: {
            name: "Математика",
            teacher: "Ирина Сергеевна",
            marks: [[4, 5, 4, 4, 5, 4, 5], [5, 4, 5, 4, 4, 5, 5], [4, 4, 5, 4, 5, 4, 5]]
        },
        russian: {
            name: "Русский язык",
            teacher: "Олег Витальевич",
            marks: [[5, 4, 4, 5, 5, 4, 5], [4, 5, 5, 4, 4, 5, 5], [5, 5, 4, 4, 5, 5, 4]]
        },
        web: {
            name: "Веб-разработка",
            teacher: "Магомед Омарович",
            marks: [[5, 5, 4, 5, 4, 5, 4], [5, 5, 3, 4, 5, 4, 4], [5, 5, 5, 3, 5, 4, 5]]
        },
        english: {
            name: "Английский язык",
            teacher: "Алина Евгеньевна",
            marks: [[5, 5, 4, 5, 5, 4, 5], [4, 5, 5, 5, 4, 5, 5], [5, 5, 4, 5, 5, 5, 4]]
        },
        chemistry: {
            name: "Химия",
            teacher: "Наталья Андреевна",
            marks: [[4, 5, 4, 4, 5, 4, 5], [5, 4, 5, 5, 4, 4, 5], [4, 4, 5, 5, 4, 5, 4]]
        },
        dup: {
            name: "ДУП. 04",
            teacher: "Ольга Николаевна",
            marks: [[5, 5, 4, 5, 5, 5, 4], [5, 5, 5, 4, 5, 5, 4], [5, 4, 5, 5, 5, 4, 5]]
        },
        thinking: {
            name: "Осн. диз. мышления.",
            teacher: "Анна Павловна",
            marks: [[5, 5, 5, 4, 5, 4, 5], [5, 4, 5, 5, 4, 5, 5], [4, 5, 5, 4, 5, 5, 5]]
        },
        biology: {
            name: "Биология",
            teacher: "Елена Викторовна",
            marks: [[5, 4, 5, 5, 4, 5, 5], [4, 5, 4, 5, 5, 4, 5], [5, 5, 5, 4, 4, 5, 5]]
        },
        infres: {
            name: "Проектирование инф. рес.",
            teacher: "Сергей Александрович",
            marks: [[5, 5, 4, 5, 5, 4, 5], [5, 4, 5, 5, 5, 4, 5], [4, 5, 5, 5, 4, 5, 5]]
        },
        projectbase: {
            name: "Основы проект. баз.",
            teacher: "Виктор Михайлович",
            marks: [[4, 4, 5, 4, 5, 4, 5], [4, 5, 4, 4, 5, 5, 4], [5, 4, 4, 5, 5, 4, 5]]
        },
        networks: {
            name: "Компьютерные сети",
            teacher: "Алексей Романович",
            marks: [[5, 5, 4, 5, 5, 5, 4], [5, 4, 5, 5, 5, 5, 4], [5, 5, 5, 4, 5, 4, 5]]
        }
    };

    const LESSON_KEYS = {
        "Веб-разработка": "web",
        "Русский язык": "russian",
        "Английский": "english",
        "История": "history"
    };

    const CODE_SUBJECTS = ["web", "dup", "infres", "projectbase", "networks"];

    const LESSON_DETAILS = {
        web: {
            teacher: "Магомед Омарович",
            materials: "Изучить прикреплённые материалы: конспект «Семантическая вёрстка», макет Figma и репозиторий с примерами компонентов.",
            homework: "Выполнить домашнее задание в LMS: сверстать карточку товара по макету, проверить адаптивность и прикрепить ссылку на репозиторий.",
            bring: "Ноутбук, зарядное устройство и наушники."
        },
        russian: {
            teacher: "Олег Витальевич",
            materials: "Учебник, § 34–36 и таблица «Обособленные члены предложения» из электронной библиотеки.",
            homework: "Упражнение 214 письменно и сочинение-миниатюра на 120 слов по теме занятия.",
            bring: "Рабочая тетрадь, учебник и орфографический словарь."
        },
        english: {
            teacher: "Алина Евгеньевна",
            materials: "Unit 5 учебника, аудио 5.2 и набор карточек Quizlet «Professions».",
            homework: "Написать эссе на 150 слов и подготовить монолог по теме «My future profession».",
            bring: "Тетрадь, наушники и распечатка с новой лексикой."
        },
        history: {
            teacher: "Дмитрий Петрович",
            materials: "Параграфы 14–15, карта «Реформы XIX века» и презентация преподавателя.",
            homework: "Заполнить таблицу реформ и письменно ответить на вопросы 1–3 после параграфа.",
            bring: "Рабочая тетрадь, атлас и ручка двух цветов."
        }
    };

    const DEFAULT_LESSON = {
        teacher: "Куратор группы",
        materials: "Материалы к занятию прикреплены в личном кабинете студента.",
        homework: "Домашнее задание уточните у преподавателя на паре.",
        bring: "Тетрадь и ручка."
    };

    const MENU_DETAILS = {
        italian: {
            calories: "820 ккал",
            protein: "32 г",
            fat: "34 г",
            carbs: "96 г",
            allergens: "глютен, молоко, сельдерей",
            note: "Пицца готовится после оплаты. Заберите обед на раздаче у окна № 2."
        },
        american: {
            calories: "760 ккал",
            protein: "26 г",
            fat: "30 г",
            carbs: "92 г",
            allergens: "глютен, молоко, горчица",
            note: "Хот-дог собирают после оплаты. Заберите обед на раздаче у окна № 1."
        },
        russian: {
            calories: "690 ккал",
            protein: "27 г",
            fat: "24 г",
            carbs: "88 г",
            allergens: "глютен, молоко, яйца",
            note: "Пельмени отваривают порционно. Заберите обед на раздаче у окна № 3."
        },
        eastern: {
            calories: "730 ккал",
            protein: "30 г",
            fat: "29 г",
            carbs: "84 г",
            allergens: "глютен, молоко, кунжут",
            note: "Шаурму готовят после оплаты. Заберите обед на раздаче у окна № 4."
        }
    };

    const modalRoot = document.createElement("div");
    modalRoot.className = "modal-overlay";
    modalRoot.hidden = true;
    modalRoot.innerHTML = [
        '<div class="modal-shell">',
        '  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">',
        '    <div class="modal-main">',
        '      <header class="modal-head" data-modal-head>',
        '        <h2 id="modal-title" data-modal-title></h2>',
        '        <p class="modal-subtitle" data-modal-subtitle></p>',
        '      </header>',
        '      <div class="modal-body" data-modal-body></div>',
        '      <footer class="modal-footer" data-modal-footer hidden></footer>',
        '    </div>',
        '    <div class="modal-visual" data-modal-visual aria-hidden="true"></div>',
        '  </div>',
        '  <button class="modal-close" type="button" data-modal-close aria-label="Закрыть">',
        '    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg>',
        '  </button>',
        '</div>'
    ].join("");
    document.body.appendChild(modalRoot);

    const modalHead = modalRoot.querySelector("[data-modal-head]");
    const modalTitle = modalRoot.querySelector("[data-modal-title]");
    const modalSubtitle = modalRoot.querySelector("[data-modal-subtitle]");
    const modalBody = modalRoot.querySelector("[data-modal-body]");
    const modalFooter = modalRoot.querySelector("[data-modal-footer]");
    const modalVisual = modalRoot.querySelector("[data-modal-visual]");
    const modalClose = modalRoot.querySelector("[data-modal-close]");
    const modalCard = modalRoot.querySelector(".modal-card");
    let modalReturnFocus = null;
    let modalHideTimer;

    function averageOf(marks) {
        return marks.reduce(function (sum, mark) {
            return sum + mark;
        }, 0) / marks.length;
    }

    function formatAverage(value) {
        return value.toFixed(2);
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

        requestAnimationFrame(function () {
            modalRoot.classList.add("is-open");
        });
    }

    function closeModal() {
        if (modalRoot.hidden) return;

        modalRoot.classList.remove("is-open");
        document.body.classList.remove("modal-open");
        modalHideTimer = setTimeout(function () {
            modalRoot.hidden = true;
        }, 180);

        if (modalReturnFocus && modalReturnFocus.isConnected) {
            modalReturnFocus.focus({ preventScroll: true });
        }
        modalReturnFocus = null;
    }

    modalRoot.addEventListener("click", function (event) {
        if (event.target === modalRoot || event.target.closest("[data-modal-close]")) {
            closeModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (modalRoot.hidden) return;

        if (event.key === "Escape") {
            closeModal();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = Array.from(modalRoot.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter(function (node) {
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
        const average = formatAverage(averageOf(marks));
        const markTiles = marks.map(function (mark) {
            return '<span class="modal-mark' + (mark <= 2 ? " is-low" : "") + '">' + mark + "</span>";
        }).join("");

        return [
            '<section class="semester-card">',
            '  <div class="semester-head">',
            '    <div><strong>Семестр ', index + 1, '</strong><small>', SEMESTER_DATES[index], '</small></div>',
            '    <div class="semester-average"><strong>', average, '</strong><small>средний балл</small></div>',
            '  </div>',
            '  <div class="modal-marks">', markTiles, '</div>',
            '</section>'
        ].join("");
    }

    function modalField(label, value) {
        return '<div class="modal-field"><span class="modal-label">' + label + '</span><div class="modal-box">' + value + "</div></div>";
    }

    function subjectModal(key) {
        const subject = SUBJECT_DETAILS[key];
        if (!subject) return;

        openModal({
            title: subject.name,
            subtitle: "Преподаватель: " + subject.teacher,
            body: subject.marks.map(semesterCard).join(""),
            footer: '<span>Средний балл по предмету</span><strong class="modal-summary-value">' + formatAverage(averageOf(subject.marks.flat())) + '</strong>',
            visual: CODE_SUBJECTS.indexOf(key) === -1 ? "study" : "code"
        });
    }

    function lessonModal(lesson) {
        const subjectNode = lesson.querySelector(".week-subject");
        if (!subjectNode) return;

        const card = lesson.closest(".week-card");
        const subject = subjectNode.childNodes[0].textContent.trim();
        const lessonKey = LESSON_KEYS[subject];
        const details = LESSON_DETAILS[lessonKey] || DEFAULT_LESSON;
        const room = ((subjectNode.querySelector("small") || {}).textContent || "").replace("каб.", "").trim();
        const meta = [
            card && card.querySelector("h2").childNodes[0].textContent.trim(),
            (lesson.querySelector(".week-time > span") || {}).textContent,
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
            visual: lessonKey === "web" ? "code" : "study"
        });
    }

    function menuModal(card, key) {
        const details = MENU_DETAILS[key];
        if (!details) return;

        const title = card.querySelector("h2").textContent.trim();
        const price = card.querySelector(".menu-total").textContent.trim();
        const items = Array.from(card.querySelectorAll(".menu-items p")).map(function (item) {
            return "<p><span>" + item.querySelector("span").textContent + "</span><small>" + item.querySelector("small").textContent + "</small></p>";
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
            body: [
                '<p class="modal-label">Состав меню:</p>',
                '<div class="modal-box modal-menu-list">', items, '</div>',
                '<div class="modal-menu-facts">', facts, '</div>',
                '<p class="modal-label modal-label-spaced">Аллергены</p>',
                '<p class="modal-allergens">', details.allergens, '</p>',
                '<p class="modal-note">', details.note, '</p>'
            ].join(""),
            footer: [
                '<button class="modal-pay-button" type="button" data-modal-pay>Оплатить</button>',
                '<p class="modal-total">К оплате: <strong>', price, '</strong></p>'
            ].join(""),
            visual: "food"
        });

        const payButton = modalFooter.querySelector("[data-modal-pay]");
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
