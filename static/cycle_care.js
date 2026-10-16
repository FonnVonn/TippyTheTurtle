
document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("cycle-toggle");
    const dayTitle = document.getElementById("cycle-day-title");
    const dayNumber = document.getElementById("cycle-day-number");
    const dateInput = document.getElementById("last-period-date");
    const supportTitle = document.getElementById("support-title");
    const supportDescription = document.getElementById("support-description");
    const cycleStatus = document.getElementById("cycle-status");
    const saveNotesButton = document.getElementById("save-cycle-notes");
    const notesStatus = document.getElementById("notes-status");
    const noteCheckboxes = document.querySelectorAll(
        "#cycle-note-options input[type='checkbox']"
    );

    if (!toggleButton || !dateInput || !saveNotesButton) return;

    const CYCLE_KEY = "tippy_cycle_care";
    const NOTES_KEY = "tippy_cycle_notes";

    const today = () => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const toDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const parseLocalDate = (value) => {
        if (!value) return null;

        const parts = value.split("-").map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setHours(0, 0, 0, 0);

        // Reject invalid dates such as 2026-02-31.
        if (
            date.getFullYear() !== parts[0] ||
            date.getMonth() !== parts[1] - 1 ||
            date.getDate() !== parts[2]
        ) {
            return null;
        }

        return date;
    };

    let state = {
        enabled: true,
        lastPeriodDate: "",
    };

    try {
        const saved = JSON.parse(localStorage.getItem(CYCLE_KEY) || "null");

        if (saved && typeof saved === "object") {
            state.enabled = saved.enabled !== false;
            state.lastPeriodDate =
                typeof saved.lastPeriodDate === "string"
                    ? saved.lastPeriodDate
                    : "";
        }
    } catch {
        cycleStatus.textContent =
            "Browser storage is unavailable. Changes may not be saved.";
    }

    dateInput.max = toDateString(today());
    dateInput.value = state.lastPeriodDate;

    function saveCycleState() {
        try {
            localStorage.setItem(CYCLE_KEY, JSON.stringify(state));
            return true;
        } catch {
            cycleStatus.textContent =
                "Unable to save in this browser. Check your storage settings.";
            return false;
        }
    }

    function renderCycle() {
        const firstDay = parseLocalDate(state.lastPeriodDate);
        const now = today();

        toggleButton.textContent = state.enabled ? "Turn off" : "Turn on";
        toggleButton.setAttribute("aria-pressed", String(state.enabled));
        dateInput.disabled = !state.enabled;

        if (!state.enabled) {
            dayTitle.textContent = "Cycle care off";
            dayNumber.textContent = "—";
            supportTitle.textContent = "Your choice, always.";
            supportDescription.textContent =
                "Cycle-aware support is turned off. You can turn it on whenever you want.";
            return;
        }

        if (!firstDay) {
            dayTitle.textContent = "Set your date";
            dayNumber.textContent = "—";
            supportTitle.textContent = "Let your energy lead.";
            supportDescription.textContent =
                "Add the first day of your last period to see your current cycle day.";
            return;
        }

        const difference = Math.round(
            (now.getTime() - firstDay.getTime()) / 86400000
        );

        const cycleDay = difference + 1;

        dayTitle.textContent = `Day ${cycleDay}`;
        dayNumber.textContent = String(cycleDay);

        supportTitle.textContent = "Let your energy lead.";
        supportDescription.textContent =
            "Notice how you feel today and give yourself room for breaks when you need them.";
    }

    toggleButton.addEventListener("click", () => {
        state.enabled = !state.enabled;

        if (saveCycleState()) {
            cycleStatus.textContent = state.enabled
                ? "Cycle Care is turned on."
                : "Cycle Care is turned off.";
        }

        renderCycle();
    });

    dateInput.addEventListener("change", () => {
        const selectedDate = parseLocalDate(dateInput.value);
        const now = today();

        if (dateInput.value && (!selectedDate || selectedDate > now)) {
            cycleStatus.textContent =
                "Please choose a valid date that is not in the future.";
            dateInput.value = state.lastPeriodDate;
            return;
        }

        state.lastPeriodDate = dateInput.value;

        if (saveCycleState()) {
            cycleStatus.textContent = state.lastPeriodDate
                ? "Your date has been saved in this browser."
                : "Date cleared.";
        }

        renderCycle();
    });

    function loadNotes() {
        try {
            const saved = JSON.parse(localStorage.getItem(NOTES_KEY) || "null");
            const todayKey = toDateString(today());

            if (saved && saved.date === todayKey && Array.isArray(saved.notes)) {
                noteCheckboxes.forEach((checkbox) => {
                    checkbox.checked = saved.notes.includes(checkbox.value);
                });
            }
        } catch {
            notesStatus.textContent =
                "Saved notes could not be loaded from this browser.";
        }
    }

    saveNotesButton.addEventListener("click", () => {
        const selectedNotes = Array.from(noteCheckboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);

        try {
            localStorage.setItem(
                NOTES_KEY,
                JSON.stringify({
                    date: toDateString(today()),
                    notes: selectedNotes,
                })
            );

            notesStatus.textContent = selectedNotes.length
                ? "Today's notes have been saved on this browser."
                : "Your notes are saved. No options selected.";
        } catch {
            notesStatus.textContent =
                "Unable to save notes. Check your browser storage settings.";
        }
    });

    renderCycle();
    loadNotes();
});
