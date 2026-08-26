import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from bot.agent import generate_response


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/chat")
def chat(message: str):
    def event_stream():
        try:
            for chunk in generate_response(message):
                event_name = chunk["type"]
                data = json.dumps(chunk, ensure_ascii=False)
                yield f"event: {event_name}\ndata: {data}\n\n"
        except Exception as e:
            error_data = json.dumps({"type": "text", "content": "disculpa, hubo un error. intentá de nuevo."})
            yield f"event: text\ndata: {error_data}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
