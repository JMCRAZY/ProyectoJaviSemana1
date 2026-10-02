import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Proxy seguro para Gemini Diagnóstico (Ejercicio 24)
app.post('/api/gemini-diagnostico', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no encontrada en las variables de entorno' });
    }

    const { records } = req.body;
    const promptMessage = `Eres un asistente y analista de productividad para el 'Ejercicio 24 - Neon Tracker'.
Analiza el siguiente conjunto de registros:
${JSON.stringify(records, null, 2)}

Devuelve una evaluación rigurosa y motivadora con resumen, diagnóstico, recomendaciones prácticas y una puntuación del 1 al 100.`;

    const requestPayload = {
      contents: [
        {
          parts: [
            {
              text: promptMessage
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            resumen: { type: "STRING" },
            diagnostico: { type: "STRING" },
            recomendaciones: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            puntuacion: { type: "INTEGER" }
          },
          required: ["resumen", "diagnostico", "recomendaciones", "puntuacion"]
        }
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const jsonRes = await response.json();
    const contentText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!contentText) {
      return res.status(500).json({ error: 'Respuesta vacía recibida de Gemini' });
    }

    const parsedData = JSON.parse(contentText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('[API Gemini Error]', error);
    return res.status(500).json({ error: error.message || 'Error procesando diagnóstico de IA' });
  }
});

// Configurar Vite dev server en desarrollo
const vite = await createViteServer({
  server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
  appType: 'spa'
});

app.use(vite.middlewares);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de desarrollo activo en http://0.0.0.0:${PORT}`);
});
