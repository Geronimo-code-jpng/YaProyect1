from bot.agent import generate_response
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, aquí pones la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 1. Creamos un modelo para recibir el JSON desde React
class ChatRequest(BaseModel):
    user_input: str


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):

    def event_generator():
        # 2. Usamos tu función real, pasándole el input del usuario
        for chunk in generate_response(request.user_input):
            # 3. Empaquetamos el chunk en formato SSE (Server-Sent Events)
            yield f"data: {chunk}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
