import json

from google import genai

from .db_tools import get_categories, get_products

client = genai.Client()

get_products_tool = {
    "type": "function",
    "name": "get_products",
    "description": "Get all the products with offerts",
    "parameters": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "description": "An optional category the user can ask to filter products, eg. 'What drinksdo you have?'",
            },
            "price": {
                "type": "string",
                "description": "An optional price the user can set to filter products, eg. 'What products are less than 3 dolars'",
            },
            "offert": {
                "type": "string",
                "description": "An optional question the usercan ask to filter the products if they have an offert",
            },
        },
        "required": [],
    },
}

categories = get_categories()

prompt = f"""
### ROL
Eres el Asistente Virtual experto de "YaMayorista". Tu función es informar a los clientes sobre el catálogo de productos basándote EXCLUSIVAMENTE en los datos de la base de datos.

### REGLAS DE ORO
1. **Límites de Conocimiento y Veracidad:** NUNCA inventes información.
   - Si buscan un producto que no está en los datos recibidos, responde explícitamente: "Disculpa, por el momento no contamos con ese producto en nuestro catálogo."
   - Si te hacen preguntas que no tienen que ver con los productos de YaMayorista (ej. clima, recetas, código, temas generales), responde educadamente: "Soy el asistente de YaMayorista y solo puedo ayudarte con información sobre nuestros productos, precios y ofertas. ¿En qué artículo te puedo ayudar hoy?"
2. **Formato de Texto Plano ESTRICTO:** El sistema donde se muestran tus mensajes NO soporta Markdown. ESTÁ COMPLETAMENTE PROHIBIDO usar asteriscos (**texto** o *texto*) para negritas o cursivas. Escribe todo en texto normal.
3. **Normalización de Salida (Minúsculas y Precios):**
   - Convierte el nombre de todos los productos y las categorías en la respuesta a minúsculas para que la lectura sea suave.
   - Formatea siempre los precios utilizando el signo peso y el punto para separar los miles (ej. $33.000).
4. **Mapeo de Categorías (Búsqueda Interna):** Aunque respondas en minúsculas, para buscar en la base de datos debes mapear la intención del usuario a las categorías válidas en MAYÚSCULAS: {categories}. (Ej: si piden "bebidas", busca en las categorías que coincidan).
5. **Manejo de Ofertas y Bultos:**
   - La columna "Oferta" puede tener un valor o ser NULL. Considera "en oferta" solo si NO es NULL.
   - Si el campo "solo_bulto" es true, DEBES escribir "(solo bulto)". Si es false, omite esa información.

### ESTRUCTURA DE DATOS (Referencia)
Solo puedes hablar sobre productos con estos campos: Id, nombre, precio, categoria, Oferta, Stock, Imagen, quantity, oferta_express, mas_vendido, solo_bulto.

### INSTRUCCIONES DE RESPUESTA Y EJEMPLO ESTRICTO
Tus respuestas deben presentarse siempre en formato de lista usando guiones (-). Sigue exactamente este formato de ejemplo para estructurar tu respuesta (nota que todo está en minúsculas y sin negritas):

ejemplo de respuesta para "qué cervezas tienen":

¡hola! contamos con una amplia variedad de cervezas en nuestro catálogo. aquí te detallo las opciones disponibles actualmente:

cervezas en stock:
- cajón budweiser litro x12 a $33.000
- cajón miller litro x12 a $34.200
- latas schneider 473ml x24u a $32.600 (oferta especial - solo bulto)
- cajón schneider litro x12u a $29.000 (oferta especial)
- cajón quilmes bajo cero x12 a $30.500
- cajón santa fe litro x12u a $31.500

en oferta especial:
- latas ortuzar 473cc x6u a $7.700 (solo bulto)
- cajón santa fe pilsen litro x12 a $32.400
- latas santa fe pilsen 473ml x24u a $36.500 (oferta especial - solo bulto)
- cajón heineken litro x12 a $48.000 (oferta)
"""


def generate_response(user_input: str):
    # Turn 1: Request function call
    stream = client.interactions.create(
        model="gemini-3.1-flash-lite",
        input=user_input,
        tools=[get_products_tool],
        system_instruction=prompt,
        stream=True,
    )

    first_interaction_id = None
    func_call_id = None
    func_call_name = None
    func_args_accumulated = ""

    for event in stream:
        if event.event_type == "error":
            print(event.error)
        if event.event_type == "interaction.created":
            first_interaction_id = event.interaction.id
        elif event.event_type == "step.start":
            step = event.step
            if step.type == "function_call":
                func_call_id = step.id
                func_call_name = step.name
        elif event.event_type == "step.delta":
            if event.delta.type == "arguments_delta":
                func_args_accumulated += event.delta.arguments

    # Turn 2: Execute tool and send the result back to resume stream
    if func_call_id:
        args = json.loads(func_args_accumulated)

        products_from_db = get_products(**args)

        stream2 = client.interactions.create(
            model="gemini-3.1-flash-lite",
            previous_interaction_id=first_interaction_id,
            input=[
                {
                    "type": "function_result",
                    "name": func_call_name,
                    "call_id": func_call_id,
                    "result": {"productos": products_from_db},
                }
            ],
            system_instruction=prompt,
            stream=True,
        )

        for event in stream2:
            if event.event_type == "step.delta":
                if event.delta.type == "text":
                    yield event.delta.text
