
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chat-form");
    const input = document.getElementById("message-input");
    const messages = document.getElementById("chat-messages");
    const sendButton = document.getElementById("send-button");
    const status = document.getElementById("chat-status");
    const resetButton = document.getElementById("reset-chat");

    if (!form || !input || !messages) return;

    function addMessage(text, sender) {
        const bubble = document.createElement("div");
        bubble.className =
            sender === "user"
                ? "message user-message"
                : "message bot-message";

        // Gunakan textContent agar pesan ditampilkan sebagai teks biasa.
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;

        return bubble;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = input.value.trim();
        if (!message) return;

        addMessage(message, "user");
        input.value = "";
        input.disabled = true;
        sendButton.disabled = true;
        status.textContent = "Tippy is listening...";

        const loadingBubble = addMessage("Tippy sedang mengetik...", "bot");

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            loadingBubble.remove();

            if (!response.ok) {
                throw new Error(
                    data.error_detail ||
                    data.error ||
                    "Tippy belum bisa membalas. Coba lagi sebentar."
                );
            }

            addMessage(data.reply, "bot");
            status.textContent = "";
        } catch (error) {
            loadingBubble.remove();
            addMessage(
                "Maaf, Tippy belum bisa membalas sekarang. " +
                "Coba kirim pesan lagi sebentar lagi, ya.",
                "bot"
            );

            status.textContent = error.message;
        } finally {
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    });

    document.querySelectorAll(".suggestion").forEach((button) => {
        button.addEventListener("click", () => {
            input.value = button.textContent.trim();
            input.focus();
        });
    });

    resetButton?.addEventListener("click", async () => {
        const confirmed = confirm(
            "Mulai percakapan baru? Riwayat percakapan ini akan dihapus."
        );

        if (!confirmed) return;

        resetButton.disabled = true;

        try {
            const response = await fetch("/reset", {
                method: "POST"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal mereset percakapan.");
            }

            messages.replaceChildren();

            addMessage(
                "Hi! I'm here to listen—no pressure to have the " +
                "right words. How has today been feeling?",
                "bot"
            );

            status.textContent = data.message || "Percakapan baru dimulai.";
        } catch (error) {
            status.textContent = error.message;
        } finally {
            resetButton.disabled = false;
        }
    });
});
