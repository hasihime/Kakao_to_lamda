// src/handler.js
import { OpenAI } from "openai";

// 환경변수에서 키 읽기
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 카카오 스킬 엔드포인트
 * - Request: Kakao i 오픈빌더가 보내는 JSON
 * - Response: version 2.0 포맷
 */
export const main = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // 유저 발화(가장 흔한 위치 2곳)
    const utter =
      body.userRequest?.utterance ??
      body.action?.params?.q ??
      "";

    // 유저가 아무 말도 안 보냈을 때 기본 프롬프트
    const userMessage = utter && utter.trim().length > 0 ? utter : "간단한 인사말 해줘.";

    // OpenAI 호출 (gpt-4o-mini 예시)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: "간결하고 정중한 한국어 어시스턴트." },
        { role: "user", content: userMessage }
      ]
    });

    const text =
      completion?.choices?.[0]?.message?.content?.trim() ??
      "응답 생성에 실패했어. 잠시 후 다시 시도해줘.";

    // 카카오 스킬 응답 포맷 (v2.0)
    const kakaoResponse = {
      version: "2.0",
      template: {
        outputs: [
          { simpleText: { text } }
        ]
      }
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(kakaoResponse)
    };
  } catch (err) {
    // 오류 시 안전한 폴백
    const fallback = {
      version: "2.0",
      template: {
        outputs: [
          { simpleText: { text: "잠시 응답이 불안정해. 다시 한 번 시도해줘." } }
        ]
      }
    };
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(fallback)
    };
  }
};