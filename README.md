Tippy the Turtle
An AI-powered emotional wellness companion designed to help users express their feelings, reflect on their daily routines, and build healthier habits.
About the Project
Tippy the Turtle is a mental wellness application built to provide a supportive, non-judgmental space for users. Its AI chatbot uses Google Gemini to respond empathetically and maintain conversational context.
Features
•	AI Chatbot: An empathetic conversational companion powered by Google Gemini.
•	Conversation Context: Maintains conversation history during the active server session.
•	Daily Check-in: Allows users to reflect on their mood.
•	Schedule Management: Helps users organize daily activities and make room for breaks.
•	Sleep Tracking: Supports sleep logging and rest awareness.
•	Cycle Care: Provides optional cycle-related tracking and wellness notes.
Tech Stack
•	Python
•	Flask
•	Google Gemini API (google-genai)
•	HTML
•	CSS
•	JavaScript
Project Structure
curhat_ai/
├── app.py
├── test_tippy.py
├── requirements.txt
├── .env.example
├── static/
└── templates/
Getting Started
1. Clone the repository
git clone https://github.com/FonnVonn/TippyTheTurtle.git
cd TippyTheTurtle
2. Create a virtual environment
python -m venv .venv
Activate it on Windows:
.venv\Scripts\Activate.ps1
3. Install dependencies
pip install -r requirements.txt
4. Configure environment variables
Create a .env file in the project root based on .env.example, then provide your own Gemini API key and Flask secret key.
Never commit your .env file or expose API keys publicly.
5. Run the application
python app.py
Open http://127.0.0.1:5000 in your browser.
6. Run the chatbot tests
python test_tippy.py
The tests exercise the chatbot's empathetic responses, respect for users who do not want advice, conversational context, advice requests, and boundaries around sharing feelings.
Notes
•	The application currently uses in-memory conversation history, which may be lost when the server restarts.
•	A valid Google Gemini API key and internet connection are required for AI responses.
•	This application provides emotional support, not professional medical or psychological care.
Author
bebasss team
