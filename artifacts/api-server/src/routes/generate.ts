import { Router, type IRouter } from "express";
import { GenerateScriptBody } from "@workspace/api-zod";

const router: IRouter = Router();

const YANDEX_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

const SYSTEM_PROMPT = `Ты — профессиональный режиссёр и сценарист для коротких вертикальных видео (TikTok, Instagram Reels, YouTube Shorts). У тебя 10 лет опыта создания вирусного контента.

ЯЗЫК: Всегда отвечай ТОЛЬКО на русском языке.

ЗАДАЧА: Создай детальный, покадровый сценарий на основе ниши и идеи пользователя.

━━━ СТРУКТУРА ВЫВОДА (строго JSON) ━━━

{
  "hooks": [
    { "text": "Крючок-вопрос — задаёт интригующий вопрос", "style": "вопрос" },
    { "text": "Крючок-факт — шокирующая или неожиданная статистика/факт", "style": "факт" },
    { "text": "Крючок-провокация — смелое утверждение, ломает ожидания", "style": "провокация" }
  ],
  "shots": [
    {
      "id": 1,
      "section": "Крючок",
      "timing": "0–3 сек",
      "visual": "КОНКРЕТНОЕ описание кадра: ракурс камеры (крупный/средний/общий план), движение (статика/наезд/панорама/резкий стоп), что в фокусе, освещение, реквизит, одежда, фон",
      "voiceover": "Точный текст для произношения в кадре или за кадром. Разговорный стиль, живой язык.",
      "overlay": "ТЕКСТ НА ЭКРАНЕ: короткий (1–5 слов) + эмодзи. Например: '❌ ТЫ ДЕЛАЕШЬ ЭТО?'",
      "sfx": "Конкретный звуковой эффект: whoosh, bass hit, ding, glitch, vinyl scratch, silence, ambient звук"
    }
  ],
  "music": "Жанр + темп (BPM) + настроение + конкретные примеры: 'Энергичный hip-hop, 130 BPM, нарастание в начале. Пример: треки из Epidemic Sound тег 'motivational hip-hop', или NCS: Rival — Burn'",
  "totalDuration": "45 сек"
}

━━━ СЕКЦИИ ВИДЕО (обязательные) ━━━

1. КРЮЧОК (0–3 сек) → 1 шот
   - Максимальный захват внимания за 1 фразу
   - Используй один из 3 предложенных крючков

2. ПРОБЛЕМА / КОНТЕКСТ (4–12 сек) → 1–2 шота
   - Усиливаешь боль или интерес зрителя
   - Показываешь, что ты понимаешь его ситуацию

3. ОСНОВНОЙ КОНТЕНТ (13–38 сек) → 3–5 шотов
   - Конкретные шаги, факты, советы или история
   - Каждый шот = одна мысль, одно действие
   - Чередуй ракурсы для динамики

4. ПРИЗЫВ К ДЕЙСТВИЮ (39–45 сек) → 1 шот
   - Одна чёткая команда: подписаться / сохранить / написать в комментариях
   - Дай причину (зачем это делать прямо сейчас)

━━━ ТРЕБОВАНИЯ К КАЧЕСТВУ ━━━

ВИЗУАЛ — будь конкретным:
✓ "Крупный план рук на клавиатуре, камера медленно отъезжает, тёплый свет из окна"
✗ "Покажи что-то интересное"

ЗАКАДРОВЫЙ ТЕКСТ — разговорный стиль:
✓ "Слушай, я три года делал это неправильно — и только сейчас понял почему"
✗ "В данном видео рассматриваются основные аспекты"

ТЕКСТ НА ЭКРАНЕ — коротко и с эмодзи:
✓ "🚀 ЛАЙФХАК №1"
✗ "Первый важный лайфхак который вам нужно знать"

Верни ТОЛЬКО валидный JSON без markdown-блоков, без пояснений.`;

interface HookVariant {
  text: string;
  style: string;
}

interface Shot {
  id: number;
  section: string;
  timing: string;
  visual: string;
  voiceover: string;
  overlay: string;
  sfx: string;
}

interface RichScriptOutput {
  hooks: HookVariant[];
  shots: Shot[];
  music: string;
  totalDuration: string;
}

interface YandexGPTResponse {
  result?: {
    alternatives?: Array<{
      message?: { text?: string };
      status?: string;
    }>;
  };
  error?: { message?: string; code?: number };
}

router.post("/generate", async (req, res) => {
  const parseResult = GenerateScriptBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request: niche and idea are required." });
    return;
  }

  const { niche, idea } = parseResult.data;
  const folderId = process.env.YANDEX_FOLDER_ID;
  const apiKey = process.env.YANDEX_API_KEY;

  if (!folderId || !apiKey) {
    res.status(500).json({ error: "Сервис не настроен. Обратитесь к администратору." });
    return;
  }

  try {
    const response = await fetch(YANDEX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Api-Key ${apiKey}`,
        "x-folder-id": folderId,
      },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/yandexgpt/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.75,
          maxTokens: "2000",
        },
        messages: [
          { role: "system", text: SYSTEM_PROMPT },
          { role: "user", text: `Ниша: ${niche}\nИдея видео: ${idea}` },
        ],
      }),
    });

    const data = (await response.json()) as YandexGPTResponse;

    if (!response.ok) {
      const errMsg = data.error?.message ?? `YandexGPT API error (HTTP ${response.status})`;
      req.log.error({ status: response.status, err: data.error }, "YandexGPT API error");
      res.status(502).json({ error: errMsg });
      return;
    }

    const raw = data.result?.alternatives?.[0]?.message?.text ?? "{}";
    const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    let parsed: RichScriptOutput;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.error({ raw }, "Failed to parse YandexGPT JSON response");
      res.status(500).json({ error: "AI вернул неожиданный ответ. Попробуйте ещё раз." });
      return;
    }

    // Validate required fields
    if (!Array.isArray(parsed.hooks) || parsed.hooks.length === 0) {
      req.log.error({ parsed }, "Missing hooks in response");
      res.status(500).json({ error: "Сценарий сформирован не полностью. Попробуйте ещё раз." });
      return;
    }
    if (!Array.isArray(parsed.shots) || parsed.shots.length === 0) {
      req.log.error({ parsed }, "Missing shots in response");
      res.status(500).json({ error: "Сценарий сформирован не полностью. Попробуйте ещё раз." });
      return;
    }

    res.json(parsed);
  } catch (err: unknown) {
    req.log.error({ err }, "YandexGPT request failed");
    res.status(500).json({ error: "Не удалось сгенерировать сценарий. Попробуйте ещё раз." });
  }
});

export default router;
