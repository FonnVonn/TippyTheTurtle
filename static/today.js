
document.addEventListener("DOMContentLoaded", () => {
    const moodButtons = document.querySelectorAll(".mood-option");
    const moodStatus = document.getElementById("mood-status");
    const timeline = document.getElementById("today-timeline");
    const emptySchedule = document.getElementById("today-empty-schedule");
    const reminderTitle = document.getElementById("rhythm-reminder-title");
    const reminderText = document.getElementById("rhythm-reminder-text");

    const sleepDuration = document.getElementById("today-sleep-duration");
    const sleepQuality = document.getElementById("today-sleep-quality");
    const sleepDetail = document.getElementById("today-sleep-detail");
    const progressBars = document.querySelectorAll("#sleep-progress-bars span");

    const pad = (number) => String(number).padStart(2, "0");

    function todayKey() {
        const date = new Date();
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    // Restore today's mood, if the user has checked in before.
    let savedMood = null;

    try {
        const moodData = readStorage("tippy_today_mood", null);
        if (moodData && moodData.date === todayKey()) {
            savedMood = moodData.mood;
        }
    } catch {
        savedMood = null;
    }

    function selectMood(mood, save = true) {
        moodButtons.forEach((button) => {
            const selected = button.dataset.mood === mood;
            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });

        const messages = {
            Rough: "Thanks for checking in. You don't have to handle everything at once.",
            Low: "It's okay to take things gently today.",
            Okay: "Okay is a perfectly valid place to be.",
            Good: "I'm glad there's some good in your day.",
            Great: "That's lovely. I hope you get to enjoy this feeling."
        };

        moodStatus.textContent = messages[mood] || "";

        if (save) {
            try {
                localStorage.setItem("tippy_today_mood", JSON.stringify({
                    date: todayKey(),
                    mood
                }));
            } catch {
                moodStatus.textContent =
                    "Mood selected, but this browser couldn't save it.";
            }
        }
    }

    moodButtons.forEach((button) => {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
            selectMood(button.dataset.mood);
        });
    });

    if (savedMood) {
        selectMood(savedMood, false);
    }

    // Display today's schedule from the Schedule page's local storage.
    function renderSchedule() {
        const activities = readStorage("tippy_schedule_items", []);

        const todayActivities = Array.isArray(activities)
            ? activities.filter((item) =>
                item &&
                item.date === todayKey() &&
                typeof item.title === "string" &&
                typeof item.time === "string" &&
                Number.isFinite(item.duration)
            ).sort((a, b) => a.time.localeCompare(b.time))
            : [];

        timeline.replaceChildren();
        emptySchedule.hidden = todayActivities.length > 0;

        if (todayActivities.length === 0) {
            reminderTitle.textContent = "Your day is still open.";
            reminderText.textContent =
                "Add activities when you're ready, and leave room for breaks.";
            return;
        }

        const totalMinutes = todayActivities.reduce(
            (sum, item) => sum + item.duration, 0
        );

        if (totalMinutes >= 360) {
            reminderTitle.textContent = "Your day looks a little packed.";
            reminderText.textContent =
                "Consider leaving a small pause between activities.";
        } else {
            reminderTitle.textContent = "Your day has a plan.";
            reminderText.textContent =
                "Remember to make a little room for rest, too.";
        }

        todayActivities.forEach((item) => {
            const row = document.createElement("article");
            row.className = "today-timeline-item";

            const time = document.createElement("span");
            time.className = "today-timeline-time";
            time.textContent = item.time;

            const dot = document.createElement("span");
            dot.className = "today-timeline-dot";
            dot.setAttribute("aria-hidden", "true");

            const info = document.createElement("div");
            info.className = "today-timeline-info";

            const title = document.createElement("strong");
            title.textContent = item.title;

            const detail = document.createElement("span");
            detail.textContent = `${item.type || "Activity"} · ${item.duration} min`;

            info.append(title, detail);
            row.append(time, dot, info);
            timeline.appendChild(row);
        });
    }

    // Read the sleep log saved by sleep.js.
    function renderSleep() {
        const logs = readStorage("tippy_sleep_logs", {});
        const log = logs && typeof logs === "object" ? logs[todayKey()] : null;

        progressBars.forEach((bar) => {
            bar.classList.remove("filled", "partial");
        });

        if (!log || !Number.isFinite(log.minutes)) {
            sleepDuration.textContent = "—";
            sleepQuality.textContent = "Not logged";
            sleepDetail.textContent =
                "Your rest matters, even when the day gets busy.";
            return;
        }

        const hours = Math.floor(log.minutes / 60);
        const minutes = log.minutes % 60;

        sleepDuration.replaceChildren();

        const hourValue = document.createElement("span");
        hourValue.textContent = `${hours}`;
        sleepDuration.append(hourValue);

        const hourUnit = document.createElement("small");
        hourUnit.textContent = "h ";
        sleepDuration.append(hourUnit);

        const minuteValue = document.createElement("span");
        minuteValue.textContent = `${minutes}`;
        sleepDuration.append(minuteValue);

        const minuteUnit = document.createElement("small");
        minuteUnit.textContent = "m";
        sleepDuration.append(minuteUnit);

        const quality = Number(log.quality);
        const qualityLabels = {
            1: "Restless",
            2: "A little tired",
            3: "Okay",
            4: "Restful",
            5: "Very restful"
        };

        sleepQuality.textContent = qualityLabels[quality] || "Logged";
        sleepDetail.textContent =
            `Bedtime goal: ${log.bedtime || "not recorded"}`;

        const segments = Math.min(7, Math.floor(log.minutes / 60 / 8 * 7));

        progressBars.forEach((bar, index) => {
            if (index < segments) {
                bar.classList.add("filled");
            } else if (index === segments && log.minutes % (8 * 60) > 0) {
                bar.classList.add("partial");
            }
        });
    }

    // The quick message box takes the user to the working Tippy chat.
    const chatForm = document.getElementById("today-chat-form");
    const chatInput = document.getElementById("today-chat-message");

    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const message = chatInput.value.trim();

        if (message) {
            try {
                sessionStorage.setItem("tippy_draft_message", message);
            } catch {
                // The chat page can still be opened if storage is unavailable.
            }
        }

        window.location.href = "/tippy";
    });

    renderSchedule();
    renderSleep();
});
