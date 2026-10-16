
import os
import uuid

from flask import Flask, jsonify, request, session, render_template
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        ".env"
    ),
    override=True
)

app = Flask(__name__)
app.secret_key = os.getenv(
    "FLASK_SECRET_KEY",
    "development-secret-change-me"
)

api_key = os.getenv("GEMINI_API_KEY")
print("Gemini API key ditemukan:", bool(api_key))

client = genai.Client(api_key=api_key) if api_key else None

# Riwayat chat sementara di server
chat_histories = {}


SYSTEM_INSTRUCTION = """
You are Tippy, a warm and empathetic emotional support companion.

PERSONALITY
- You are gentle, patient, caring, approachable, and non-judgmental.
- Speak naturally in casual Indonesian by default. Follow the user's
  language if they prefer another language.
- Sound like a thoughtful companion, not a formal customer service bot.
- Be sincere and specific. Avoid repetitive, generic comforting phrases.
- Never pretend to be human, a licensed psychologist, or a medical professional.

HOW TO RESPOND
1. Understand the user's message and emotional context before responding.
2. Acknowledge the specific situation or feeling the user describes.
3. Validate their emotions without automatically agreeing with every
   conclusion they make.
4. Do not immediately give advice, solutions, or long lists of steps.
5. If the user seems to want to vent, listen and make space for them.
6. If appropriate, ask ONE gentle, relevant follow-up question.
7. If the user asks for practical help, collaborate with them on
   manageable next steps.
8. If the user's intent is unclear, ask what kind of support they need.
9. Keep responses concise by default, but give more detail when requested.
10. Do not force positivity, minimize problems, or use guilt-inducing language.

CONVERSATION MEMORY
- Use the available conversation history to understand references
  to earlier messages and maintain continuity.
- Remember details that the user has shared within the conversation.
- Do not ask for information the user has already provided when it
  is available in the conversation history.
- Never invent memories or claim to remember something unsupported
  by the available history.
- If a detail is unclear, ask gently instead of making assumptions.

SAFETY AND BOUNDARIES
- Never shame users for their emotions or personal experiences.
- Do not diagnose mental health conditions.
- Do not encourage self-harm or harmful behavior.
- If a user expresses possible immediate danger or thoughts of
  self-harm, respond calmly and compassionately, assess immediate
  safety when appropriate, and encourage contacting trusted people
  and local emergency or crisis support.
- Do not treat every expression of sadness or stress as a crisis.
- Be honest about your limitations and avoid presenting yourself
  as a replacement for professional care.

HOW TO RESPOND
- First, acknowledge the specific feeling or situation the user shares.
- Listen before offering advice.
- If the user explicitly says they do not want advice,
  do not give advice or ask probing questions.
- Instead, respond with gentle acknowledgment and let the user
  decide whether they want to continue sharing.
- Avoid asking a follow-up question in every response.
- When asking a question, ask only one relevant and gentle question.
- Do not repeat the same comforting phrases in every response.
- Match the user's emotional tone and keep the response natural.
- Do not force positivity or minimize the user's problems.

Your goal is to help users feel heard, respected, and supported,
without pressuring them to share more than they want.
"""


@app.route("/")
def home():
    return render_template("today.html", active_page="today")


@app.route("/chat", methods=["POST"])
def chat():
    if client is None:
        return jsonify({
            "error": "API key belum ditemukan. Periksa file .env."
        }), 500

    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({
            "error": "Pesan tidak boleh kosong."
        }), 400

    # Buat ID percakapan untuk session pengguna
    if "chat_id" not in session:
        session["chat_id"] = str(uuid.uuid4())

    chat_id = session["chat_id"]

    if chat_id not in chat_histories:
        chat_histories[chat_id] = []

    history = chat_histories[chat_id]

    # Ambil maksimal 20 pesan sebelumnya
    recent_history = history[-20:]
    print("RIWAYAT SEBELUM REQUEST:", recent_history)

    # Siapkan riwayat untuk Gemini
    contents = [
        {
            "role": item["role"],
            "parts": [{"text": item["text"]}]
        }
        for item in recent_history
    ]

    # Tambahkan pesan terbaru
    contents.append({
        "role": "user",
        "parts": [{"text": user_message}]
    })

    print("PESAN YANG DIKIRIM KE GEMINI:", contents)

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7
            )
        )

        reply = response.text

        if not reply:
            return jsonify({
                "error": "AI belum menghasilkan balasan."
            }), 502

        # Simpan pesan pengguna dan balasan AI
        history.append({
            "role": "user",
            "text": user_message
        })
        history.append({
            "role": "model",
            "text": reply
        })

        print("TOTAL PESAN TERSIMPAN:", len(history))

        return jsonify({"reply": reply})

    except Exception as e:
        app.logger.exception("Gagal menghubungi Gemini")
        return jsonify({
            "error_type": type(e).__name__,
            "error_detail": str(e)
        }), 502


@app.route("/reset", methods=["POST"])
def reset_chat():
    chat_id = session.get("chat_id")

    if chat_id:
        chat_histories.pop(chat_id, None)

    session.pop("chat_id", None)

    return jsonify({
        "message": "Percakapan baru dimulai!"
    })


@app.route("/schedule")
def schedule_page():
    return render_template("schedule.html", active_page="schedule")


@app.route("/sleep")
def sleep_page():
    return render_template("sleep.html", active_page="sleep")


@app.route("/cycle-care")
def cycle_care_page():
    return render_template("cycle_care.html")


@app.route("/tippy")
def tippy_page():
    return render_template("chat.html")


if __name__ == "__main__":
    app.run(debug=True)
