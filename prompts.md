
# 🧙‍♂️ LTI Kanban Candidates API — Prompts para desarrollo backend - Modelo Claude Sonnet 3.7 (Cursor)

## Contexto

Estamos trabajando en una aplicación de gestión de procesos de selección que incluye una interfaz estilo **kanban**.  
Necesitamos implementar dos endpoints nuevos para poder listar candidatos y moverlos entre etapas del proceso.
Para tener una visión más certera del proyecto, analiza el archivo README.md de la raiz del proyecto.
No generes nada, estoy dándote el contexto.
Actúa como un ingeniero de software experto en arquitectura de sistemas LTI.
Los endpoints se generarán dentro de la carpeta backend.

---

## 🌟 Objetivo

Crear los endpoints:

- `GET /positions/:id/candidates`
- `PUT /candidates/:id/stage`

Siguiendo las mejores prácticas de API REST, asegurando la integridad de los datos y una experiencia fluida en el frontend.
No generes nada todavía, sigo dándote contexto.

---

## 🛠️ Prompt 1

### **GET /positions/:id/candidates**

**Objetivo:**  
Obtener todos los **candidatos** asociados a una posición (`position_id`) que estén actualmente en proceso.

**Qué debe devolver cada candidato:**

| Campo | Fuente | Descripción |
|:------|:-------|:------------|
| `full_name` | Tabla `candidate` | Nombre completo del candidato |
| `current_interview_step` | Tabla `application` | Estado actual del proceso (ej. "Primera entrevista", "Oferta", etc.) |
| `average_score` | Tabla `interview` | Promedio de los scores de todas las entrevistas realizadas |

### **Requisitos Técnicos:**

- Buscar todas las aplicaciones (`application`) relacionadas al `position_id`.
- Incluir los datos de la tabla `candidate` uniendo por la relación entre **application** y **candidate**.
- Calcular el `average_score` de forma dinámica a partir de la tabla **interview**:
  - **Sólo** considerar las entrevistas que tengan un `score` válido (evitar nulls).
- La respuesta debe ser **un array de objetos JSON** con estos tres campos.

### **Edge Cases a considerar:**

- Candidatos sin entrevistas todavía → `average_score` puede ser `null` o `0`, pero debe estar presente en la respuesta.
- Eliminar duplicados si por algún error de modelado existieran múltiples aplicaciones duplicadas.
- Manejar el caso de posición inexistente (`position_id` no encontrado): retornar `404 Not Found` claramente.

---

## 🛠️ Prompt 2

### **PUT /candidates/:id/stage**

**Objetivo:**  
Actualizar la etapa (`current_interview_step`) de un candidato específico.

**Qué debe hacer:**

- Recibe en el body:
  ```json
  {
    "current_interview_step": "Oferta"
  }
  ```
- Localizar el `application` asociada al `candidate_id` recibido.
- Actualizar el campo `current_interview_step` con el valor proporcionado.

### **Requisitos Técnicos:**

- Validar que el candidato (`candidate_id`) existe antes de intentar actualizar.
- Asegurar que la nueva `current_interview_step` pertenece a un conjunto de etapas válidas si existe un catálogo de fases (opcional: si no existe, simplemente guardar el texto).
- Retornar un `200 OK` con el objeto actualizado o un mensaje de éxito.

### **Edge Cases a considerar:**

- Si no existe el candidato → retornar `404 Not Found`.
- Validar que el valor enviado para `current_interview_step` no sea vacío.
- Idealmente, bloquear cambios si el candidato ya está en una etapa "final" como "Rechazado" o "Contratado" (esto depende de reglas de negocio).

---

## 🌟 Prompt 3: Recomendaciones extra

- Añadir auditoría (quién movió al candidato de fase) si es posible.
- Añadir timestamps de actualización (`updated_at`) en el modelo `application`.
- Incluir validaciones de entrada estrictas: tipo de dato, longitud máxima de strings, etc.
- Documentar los endpoints con Swagger / OpenAPI para que el frontend los vea fácilmente.

---

## 🚀 Prompt 4: Archivo Readme

- Completa el archivo README.md con la nueva información.
