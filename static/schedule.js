
document.addEventListener("DOMContentLoaded", () => {
    const weekStrip = document.getElementById("week-strip");
    const selectedDateTitle = document.getElementById("selected-date-title");
    const plannedTotal = document.getElementById("planned-total");
    const scheduleList = document.getElementById("schedule-list");
    const emptySchedule = document.getElementById("empty-schedule");
    const form = document.getElementById("schedule-form");
    const activityName = document.getElementById("activity-name");
    const activityTime = document.getElementById("activity-time");
    const activityDuration = document.getElementById("activity-duration");
    const activityType = document.getElementById("activity-type");
    const status = document.getElementById("schedule-status");

    if (!weekStrip || !form) return;

    const STORAGE_KEY = "tippy_schedule_items";
    const pad = (number) => String(number).padStart(2, "0");

    function dateKey(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function localDate(key) {
        const [year, month, day] = key.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const today = startOfDay(new Date());
    let selectedDate = dateKey(today);
    let activities = [];

    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(saved)) {
            activities = saved.filter((item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.date === "string" &&
                typeof item.title === "string" &&
                typeof item.time === "string" &&
                Number.isFinite(item.duration) &&
                item.duration > 0
            );
        }
    } catch {
        status.textContent = "Jadwal tersimpan tidak bisa dibaca.";
    }

    function saveActivities() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
            return true;
        } catch {
            status.textContent =
                "Jadwal belum bisa disimpan. Periksa penyimpanan browser.";
            return false;
        }
    }

    function formatDay(date) {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        }).format(date);
    }

    function renderWeek() {
        weekStrip.replaceChildren();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const key = dateKey(date);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "week-day" +
                (key === selectedDate ? " selected" : "");
            button.setAttribute("aria-pressed", String(key === selectedDate));

            const weekday = document.createElement("span");
            weekday.className = "weekday-name";
            weekday.textContent = new Intl.DateTimeFormat("en-US", {
                weekday: "short"
            }).format(date);

            const number = document.createElement("span");
            number.className = "weekday-number";
            number.textContent = date.getDate();

            const dot = document.createElement("span");
            dot.className = "weekday-dot";
            dot.setAttribute("aria-hidden", "true");

            button.append(weekday, number, dot);

            button.addEventListener("click", () => {
                selectedDate = key;
                status.textContent = "";
                renderWeek();
                renderActivities();
            });

            weekStrip.appendChild(button);
        }
    }

    function formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours && remainingMinutes) {
            return `${hours}h ${remainingMinutes}m`;
        }

        if (hours) return `${hours}h`;
        return `${minutes}m`;
    }

    function renderActivities() {
        const date = localDate(selectedDate);
        selectedDateTitle.textContent = formatDay(date);
        scheduleList.replaceChildren();

        const dayActivities = activities
            .filter((item) => item.date === selectedDate)
            .sort((a, b) => a.time.localeCompare(b.time));

        const totalMinutes = dayActivities.reduce(
            (total, item) => total + item.duration,
            0
        );

        plannedTotal.textContent =
            totalMinutes === 0
                ? "0h planned"
                : `${formatDuration(totalMinutes)} planned`;

        emptySchedule.hidden = dayActivities.length !== 0;

        dayActivities.forEach((item) => {
            const row = document.createElement("article");
            row.className = "schedule-item";

            const time = document.createElement("span");
            time.className = "schedule-time";
            time.textContent = item.time;

            const bar = document.createElement("span");
            bar.className = "schedule-color-bar";
            const type = ["Focus", "Class", "Meal", "Break", "Personal"]
                .includes(item.type) ? item.type.toLowerCase() : "focus";
            bar.classList.add(type);

            const content = document.createElement("div");
            content.className = "schedule-item-content";

            const title = document.createElement("strong");
            title.textContent = item.title;

            const detail = document.createElement("span");
            detail.textContent = `${item.duration} Min · ${item.type}`;

            content.append(title, detail);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "delete-activity";
            remove.textContent = "Remove";
            remove.setAttribute("aria-label", `Remove ${item.title}`);

            remove.addEventListener("click", () => {
                activities = activities.filter((activity) => activity.id !== item.id);

                if (saveActivities()) {
                    status.textContent = "Activity removed.";
                    renderWeek();
                    renderActivities();
                }
            });

            row.append(time, bar, content, remove);
            scheduleList.appendChild(row);
        });
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = activityName.value.trim();
        const time = activityTime.value;
        const duration = Number(activityDuration.value);
        const type = activityType.value;

        if (!title || !time || !Number.isFinite(duration) ||
            duration < 5 || duration > 720) {
            status.textContent = "Periksa kembali nama kegiatan, waktu, dan durasi.";
            return;
        }

        activities.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: selectedDate,
            title,
            time,
            duration,
            type
        });

        if (!saveActivities()) {
            activities.pop();
            return;
        }

        activityName.value = "";
        status.textContent = "Activity added to your day.";

        renderWeek();
        renderActivities();
    });

    renderWeek();
    renderActivities();
});
