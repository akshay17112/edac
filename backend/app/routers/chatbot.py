from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import random
import os

from ..database import get_db
from ..models import User, ChatHistory
from ..schemas import ChatRequest, ChatResponse, ChatHistoryItem
from ..dependencies import get_current_user, log_activity

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if api_key:
            try:
                from groq import Groq
                _groq_client = Groq(api_key=api_key)
            except ImportError:
                pass
    return _groq_client


# fallback rule-based responses when no API key is set
RESPONSES = {
    "greet":         ["Hey! How can I help you today?", "Hello! What's on your mind?", "Hi there! Feel free to ask me anything."],
    "how_are_you":   ["I'm doing great, thanks for asking! How about you?", "All good on my end! What can I do for you?"],
    "bye":           ["Goodbye! Have a great day!", "See you later! Take care.", "Bye! Come back anytime."],
    "thanks":        ["You're welcome!", "Happy to help!", "Anytime! Let me know if you need anything else."],
    "help":          ["Sure, I'm here to help! What do you need?", "Of course! Tell me what you're looking for."],
    "name":          ["I'm EDAC Assistant, your built-in chat helper!", "You can call me EDAC Bot. Here to assist you!"],
    "what_can_you_do": ["I can answer questions, have a conversation, and keep you company!", "Ask me anything — I'll do my best to help!"],
    "joke":          ["Why do programmers prefer dark mode? Because light attracts bugs! 😄", "How many programmers does it take to change a light bulb? None — that's a hardware problem! 😂", "Why did the developer go broke? Because he used up all his cache! 🤣"],
    "time":          ["I don't have access to a clock, but your device can tell you!"],
    "weather":       ["I can't check live weather, but try Google or a weather app!"],
    "default":       ["That's interesting! Could you tell me more?", "I see. Can you elaborate a bit?", "Got it! Is there something specific you'd like to know?", "Hmm, interesting point. What else is on your mind?", "Tell me more about that!"],
}


def _fallback_response(message: str) -> str:
    msg = message.lower().strip()
    if any(w in msg for w in ["hello", "hi", "hey", "good morning", "good evening", "howdy"]):
        return random.choice(RESPONSES["greet"])
    if any(w in msg for w in ["how are you", "how r you", "you doing"]):
        return random.choice(RESPONSES["how_are_you"])
    if any(w in msg for w in ["bye", "goodbye", "see you", "cya"]):
        return random.choice(RESPONSES["bye"])
    if any(w in msg for w in ["thanks", "thank you", "thx", "ty"]):
        return random.choice(RESPONSES["thanks"])
    if any(w in msg for w in ["help", "assist", "support"]):
        return random.choice(RESPONSES["help"])
    if any(w in msg for w in ["your name", "who are you", "what are you"]):
        return random.choice(RESPONSES["name"])
    if any(w in msg for w in ["what can you do", "capabilities"]):
        return random.choice(RESPONSES["what_can_you_do"])
    if any(w in msg for w in ["joke", "funny", "make me laugh"]):
        return random.choice(RESPONSES["joke"])
    if any(w in msg for w in ["time", "what time"]):
        return random.choice(RESPONSES["time"])
    if any(w in msg for w in ["weather", "temperature", "forecast"]):
        return random.choice(RESPONSES["weather"])
    return random.choice(RESPONSES["default"])


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    client = _get_groq_client()

    if client:
        try:
            result = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a helpful and friendly assistant named EDAC Bot. Keep responses concise and clear."},
                    {"role": "user", "content": payload.message},
                ],
                max_tokens=512,
            )
            response_text = result.choices[0].message.content
        except Exception:
            response_text = _fallback_response(payload.message)
    else:
        response_text = _fallback_response(payload.message)

    chat = ChatHistory(user_id=current_user.id, message=payload.message, response=response_text)
    db.add(chat)
    db.commit()

    log_activity(db, current_user, "CHAT_MESSAGE", request, f"msg_len={len(payload.message)}")
    return {"response": response_text}


@router.get("/history", response_model=List[ChatHistoryItem])
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc())
        .limit(50)
        .all()
    )
