
document.addEventListener("DOMContentLoaded", () => {
    const chart = document.getElementById("sleep-chart");
    const averageElement = document.getElementById("sleep-average");
    const insightElement = document.getElementById("sleep-insight");
    const form = document.getElementById("sleep-log-form");
    const bedtimeInput = document.getElementById("bedtime");
    const wakeInput = document.getElementById("wake-time");
    const qualityInput = document.getElementById("sleep-quality");
    const qualityValue = document.getElementById("quality-value");
    const durationPreview = document.getElementById("sleep-duration-preview");
    const logStatus = document.getElementById("sleep-log-status");
    const windDownItems = document.querySelectorAll(".wind-down-item input");
    const windDownStatus = document.getElementById("wind-down-status");

    if (!chart || !form) return;

    const LOGS_KEY = "tippy_sleep_logs";
    const WIND_DOWN_KEY = "tippy_wind_down";

    // Contoh tampilan awal, bukan data tidur yang benar-benar tercatat.
    const sampleHours = [6.4, 6.8, 5.8, 7.5, 8.0, 8.2, 7.8];

    const pad = (number) => String(number).padStart(2, "0");

    function dateKey(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function dateFromKey(key) {
        const [year, month, day] = key.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function getLastSevenDates() {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date);
        }

        return dates;
    }

    function shortDay(date) {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "short"
        }).format(date);
    }

    function loadLogs() {
        try {
            const parsed = JSON.parse(localStorage.getItem(LOGS_KEY) || "{}");

            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                return {};
            }

            return parsed;
        } catch {
            return {};
        }
    }

    let logs = loadLogs();

    function saveLogs() {
        try {
            localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
            return true;
        } catch {
            logStatus.textContent =
                "Unable to save your sleep log in this browser.";
            return false;
        }
    }

    function durationBetween(bedtime, wakeTime) {
        const [bedHour, bedMinute] = bedtime.split(":").map(Number);
        const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);

        let start = bedHour * 60 + bedMinute;
        let end = wakeHour * 60 + wakeMinute;

        // If wake time is earlier, assume waking on the following day.
        if (end <= start) end += 24 * 60;

        return end - start;
    }

    function formatHours(minutes) {
        return `${(minutes / 60).toFixed(1)}h`;
    }

    function updateDurationPreview() {
        qualityValue.textContent = qualityInput.value;

        if (!bedtimeInput.value || !wakeInput.value) {
            durationPreview.textContent =
                "Add your bedtime and wake time to calculate duration.";
            return;
        }

        const minutes = durationBetween(bedtimeInput.value, wakeInput.value);

        if (minutes <= 0 || minutes > 24 * 60) {
            durationPreview.textContent = "Please check your sleep times.";
            return;
        }

        durationPreview.textContent =
            `Your sleep duration: ${formatHours(minutes)}.`;
    }

    function renderChart() {
        chart.replaceChildren();

        const dates = getLastSevenDates();

        const entries = dates.map((date, index) => {
            const key = dateKey(date);
            const log = logs[key];

            return {
                date,
                hours: log && Number.isFinite(log.minutes)
                    ? log.minutes / 60
                    : sampleHours[index],
                isLogged: Boolean(log && Number.isFinite(log.minutes))
            };
        });

        const average = entries.reduce((sum, entry) => sum + entry.hours, 0)
            / entries.length;

        averageElement.textContent = `${average.toFixed(1)}h`;

        const loggedCount = entries.filter((entry) => entry.isLogged).length;

        if (loggedCount === 0) {
            insightElement.textContent =
                "Log your sleep to begin noticing your own rest rhythm.";
        } else if (average < 7) {
            insightElement.textContent =
                "Your recent logs show room for a little more rest, if possible.";
        } else {
            insightElement.textContent =
                "You're building a picture of your recent rest rhythm.";
        }

        const maximum = Math.max(9, ...entries.map((entry) => entry.hours));

        entries.forEach((entry, index) => {
            const column = document.createElement("div");
            column.className = "sleep-chart-column";

            const hours = document.createElement("span");
            hours.className = "sleep-chart-hours";
            hours.textContent = `${entry.hours.toFixed(1)}h`;

            const barArea = document.createElement("div");
            barArea.className = "sleep-chart-bar-area";

            const bar = document.createElement("div");
            bar.className = "sleep-chart-bar";

            if (index === entries.length - 1) {
                bar.classList.add("recent");
            } else if (entry.hours < 7) {
                bar.classList.add("gentle");
            }

            bar.style.height = `${Math.max(8, (entry.hours / maximum) * 76)}px`;
            bar.title = entry.isLogged
                ? `${entry.hours.toFixed(1)} hours, logged`
                : `${entry.hours.toFixed(1)} hours, example data`;

            barArea.appendChild(bar);

            const day = document.createElement("span");
            day.className = "sleep-chart-day";
            day.textContent = shortDay(entry.date);

            column.append(hours, barArea, day);
            chart.appendChild(column);
        });

        chart.setAttribute(
            "aria-label",
            `Average sleep ${average.toFixed(1)} hours per night. ` +
            `${loggedCount} of 7 nights logged; other values are examples.`
        );
    }

    function loadWindDown() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(WIND_DOWN_KEY) || "[]"
            );

            if (Array.isArray(saved)) {
                windDownItems.forEach((item) => {
                    item.checked = saved.includes(item.value);
                });
            }
        } catch {
            windDownStatus.textContent =
                "Your checklist could not be loaded.";
        }
    }

    function saveWindDown() {
        const checked = Array.from(windDownItems)
            .filter((item) => item.checked)
            .map((item) => item.value);

        try {
            localStorage.setItem(WIND_DOWN_KEY, JSON.stringify(checked));
            windDownStatus.textContent = "Wind-down checklist saved.";
        } catch {
            windDownStatus.textContent =
                "Unable to save your checklist in this browser.";
        }
    }

    bedtimeInput.addEventListener("input", updateDurationPreview);
    wakeInput.addEventListener("input", updateDurationPreview);
    qualityInput.addEventListener("input", updateDurationPreview);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!bedtimeInput.value || !wakeInput.value) {
            logStatus.textContent = "Please enter both bedtime and wake time.";
            return;
        }

        const minutes = durationBetween(
            bedtimeInput.value,
            wakeInput.value
        );

        if (minutes <= 0 || minutes > 24 * 60) {
            logStatus.textContent = "Please check your sleep times.";
            return;
        }

        const now = new Date();
        const key = dateKey(now);

        logs[key] = {
            bedtime: bedtimeInput.value,
            wakeTime: wakeInput.value,
            minutes,
            quality: Number(qualityInput.value)
        };

        if (!saveLogs()) return;

        logStatus.textContent =
            `Sleep log saved: ${formatHours(minutes)}, quality ` +
            `${qualityInput.value}/5.`;

        renderChart();
    });

    windDownItems.forEach((item) => {
        item.addEventListener("change", saveWindDown);
    });

    // Restore today's sleep log, if one exists.
    const existingLog = logs[dateKey(new Date())];

    if (existingLog) {
        bedtimeInput.value = existingLog.bedtime || "";
        wakeInput.value = existingLog.wakeTime || "";
        qualityInput.value = existingLog.quality || 4;
        logStatus.textContent = "Today's saved sleep log has been loaded.";
    }

    updateDurationPreview();
    renderChart();
    loadWindDown();
});
