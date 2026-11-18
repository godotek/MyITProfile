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
});
