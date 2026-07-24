import { Request, Response } from 'express';
import { z } from 'zod';

// Встроенная схема вместо @workspace/api-zod
const GenerateScriptBody = z.object({
  niche: z.string(),
  idea: z.string(),
  userGear: z.string().optional(), // Новое поле!
});

export const generateScript = async (req: Request, res: Response) => {
  try {
    const body = GenerateScriptBody.parse(req.body);
    
    // ВРЕМЕННАЯ ЗАГЛУШКА: Здесь позже будет вызов YandexGPT / OpenAI
    const mockResponse = {
      success: true,
      data: {
        title: `Сценарий для: ${body.niche}`,
        hook: "Цепляющее начало!",
        shots: [
          {
            timing: "0-3 сек",
            visual: "Крупный план",
            voiceover: "Ты делаешь это неправильно!",
            gearTip: body.userGear ? `Используй ${body.userGear} на штативе` : "Снимай на телефон, держа его вертикально"
          }
        ]
      }
    };
    
    res.json(mockResponse);
  } catch (error) {
    res.status(400).json({ error: "Неверные данные", details: error });
    console.error("Validation error:", error);
  }
};
