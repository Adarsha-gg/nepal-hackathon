from flask import Flask, request, jsonify
from flask_cors import CORS  # <--- Add this import
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app) # <--- This allows your HTML file to connect to this API

client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))

def process_with_ai(user_input):
    # Pro-tip: Adding "Keep it concise" helps prevent huge blocks of text 
    # from breaking your UI layout.
    prompt = (
        f"You are a Nepali mental health assistant. "
        f"A user said: '{user_input}'. "
        "Respond empathetically in Nepali, mentioning that others share this struggle. "
        "Keep the response concise."
    )
    
    # Using the newer SDK syntax you provided
    response = client.models.generate_content(
        model="gemini-2.0-flash", # Updated to the latest stable flash
        contents=prompt
    )
    return response.text

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message")

    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    try:
        ai_response = process_with_ai(user_input)
        return jsonify({"response": ai_response})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "AI Processing failed"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
