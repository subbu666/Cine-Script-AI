const { getGroqClient } = require("../config/groq");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Groq AI Service
 * Handles script generation using Groq's LLM API
 */
class GroqService {
  /**
   * System prompt for Bollywood/Hollywood script generation
   */
  static getSystemPrompt(mood) {
    const moodPrompts = {
      dramatic: `You are a legendary Bollywood screenwriter known for creating emotionally charged, dramatic masterpieces. Your scripts feature intense family confrontations, tearful reconciliations, and dialogue that makes hearts swell. Think Karan Johar meets Sanjay Leela Bhansali - opulent, emotional, and unforgettable.`,

      comedy: `You are a genius comedy screenwriter who creates laugh-out-loud Bollywood comedies. Your scripts are packed with witty one-liners, hilarious misunderstandings, perfectly timed slapstick, and characters that leave audiences in splits. Think Rajkumar Hirani's wit meets Hrishikesh Mukherjee's charm.`,

      romantic: `You are the ultimate romantic screenplay writer, crafting love stories that make hearts flutter. Your scripts feature passionate declarations, soul-stirring poetry, romantic montages, and dialogues that become eternal. Think of the most iconic romantic moments in cinema - then make them even more magical.`,

      action: `You are a master action screenplay writer who creates adrenaline-pumping sequences. Your scripts feature gravity-defying stunts, explosive confrontations, heroic one-liners, and slow-motion hero entries that give audiences goosebumps. Think Rohit Shetty's scale meets Hollywood precision.`,

      thriller: `You are a psychological thriller expert who keeps audiences on the edge of their seats. Your scripts feature mind-bending twists, atmospheric tension, unreliable narrators, and revelations that change everything. Think Christopher Nolan meets Sriram Raghavan.`,

      horror: `You are a horror maestro who creates genuinely terrifying experiences. Your scripts build dread through atmosphere, feature shocking supernatural reveals, and leave audiences afraid to turn off the lights. Think atmospheric dread with cultural mythology woven in.`,

      inspirational: `You are an inspirational storyteller who creates moving tales of human triumph. Your scripts feature underdogs who defy odds, emotional turning points, and dialogue that ignites passion. These are stories that make audiences stand up and cheer.`,

      noir: `You are a neo-noir expert crafting dark, stylish crime dramas. Your scripts feature morally ambiguous protagonists, femme fatales, rainy streets, smoky bars, and cynical voiceovers. Think classic film noir with a modern twist.`,

      tragic: `You are a master of tragic storytelling, crafting heart-wrenching tales of loss, sacrifice, and unfulfilled destinies. Your scripts leave audiences emotionally devastated yet moved. Think Devdas meets Mughal-E-Azam - sweeping, poetic, and deeply human.`,
    };

    return moodPrompts[mood] || moodPrompts.dramatic;
  }

  /**
   * Build the generation prompt.
   * FIX: Updated JSON schema to match the frontend Scene type exactly:
   *   number (int), title (string), description (string),
   *   dialogues (array of { character, line })
   */
  static buildGenerationPrompt(situation, mood) {
    const systemPrompt = this.getSystemPrompt(mood);

    const userPrompt = `Transform this everyday situation into an over-the-top ${mood.toUpperCase()} movie script:

SITUATION: "${situation}"

Create a complete mini-movie script with:
1. A CATCHY TITLE (Bollywood/Hollywood style - dramatic, memorable)
2. A TAGLINE (one powerful line that captures the essence)
3. 3-6 SCENES, each with:
   - A short scene TITLE (e.g. "The Encounter", "The Betrayal")
   - Cinematic scene DESCRIPTION (include camera angles, lighting, background music suggestions)
   - DIALOGUES as an array of { character, line } objects (over-the-top, emotional, with character names)

RULES:
- Make it EXTREMELY dramatic and exaggerated - this is CINEMA, not real life
- Include specific character names
- Add stage directions and cinematic descriptions
- Dialogue should be quotable and intense
- Each scene should build tension toward a climax
- Include a dramatic finale
- Every scene MUST have at least 2 dialogue entries

RESPONSE FORMAT - Return ONLY valid JSON, no extra text, no markdown:
{
  "title": "The Dramatic Title",
  "tagline": "One line that sells the movie",
  "scenes": [
    {
      "number": 1,
      "title": "Scene Title Here",
      "description": "Cinematic scene description with camera angles and atmosphere...",
      "dialogues": [
        { "character": "CHARACTER NAME", "line": "What they say dramatically..." },
        { "character": "OTHER CHARACTER", "line": "Their emotional response..." }
      ]
    }
  ]
}`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Parse and validate the AI response.
   * FIX: validator and mapper now use number/title/description/dialogues
   *      instead of the old sceneIndex/dialogue fields.
   */
  static parseScriptResponse(responseText) {
    try {
      let jsonStr = responseText.trim();

      // Strip markdown code fences if the model wraps the JSON
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(jsonStr);

      // --- top-level validation ---
      if (!parsed.title || typeof parsed.title !== "string") {
        throw new Error("Invalid response: missing title");
      }
      if (!parsed.tagline || typeof parsed.tagline !== "string") {
        throw new Error("Invalid response: missing tagline");
      }
      if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
        throw new Error("Invalid response: scenes must be a non-empty array");
      }

      // --- scene-level validation & normalisation ---
      const scenes = parsed.scenes.map((scene, index) => {
        // FIX: accept `number` from new prompt; fall back to index+1 if missing
        const number =
          typeof scene.number === "number" ? scene.number : index + 1;

        // FIX: accept `title`; fall back gracefully
        const title =
          typeof scene.title === "string" && scene.title.trim()
            ? scene.title.trim()
            : `Scene ${number}`;

        if (!scene.description || typeof scene.description !== "string") {
          throw new Error(`Invalid scene ${index + 1}: missing description`);
        }

        // FIX: accept `dialogues` array; fall back to empty array so the UI
        //      can show the graceful "No dialogue" message instead of crashing.
        let dialogues = [];
        if (Array.isArray(scene.dialogues)) {
          dialogues = scene.dialogues
            .filter(
              (d) =>
                d &&
                typeof d.character === "string" &&
                typeof d.line === "string",
            )
            .map((d) => ({
              character: d.character.trim(),
              line: d.line.trim(),
            }));
        }

        return {
          number,
          title,
          description: scene.description.trim(),
          dialogues,
        };
      });

      return {
        title: parsed.title.trim(),
        tagline: parsed.tagline.trim(),
        scenes,
      };
    } catch (error) {
      logger.error("Failed to parse AI response", {
        error: error.message,
        response: responseText,
      });
      throw new Error(`Failed to parse generated script: ${error.message}`);
    }
  }

  /**
   * Generate a movie script from a situation
   * @param {string} situation - The everyday situation
   * @param {string} mood - The desired mood/style
   * @returns {Promise<Object>} Generated script
   */
  static async generateScript(situation, mood = "dramatic") {
    const startTime = Date.now();

    try {
      logger.info("Starting script generation", {
        situation: situation.substring(0, 100),
        mood,
      });

      const client = getGroqClient();
      const { systemPrompt, userPrompt } = this.buildGenerationPrompt(
        situation,
        mood,
      );

      const completion = await client.chat.completions.create({
        model: env.groqModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 4000,
        top_p: 0.9,
        stream: false,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error("Empty response from Groq API");
      }

      const script = this.parseScriptResponse(responseText);
      const generationTime = Date.now() - startTime;

      logger.info("Script generation completed", {
        title: script.title,
        scenes: script.scenes.length,
        generationTimeMs: generationTime,
      });

      return {
        ...script,
        generationTime,
      };
    } catch (error) {
      logger.error("Script generation failed", {
        error: error.message,
        situation: situation.substring(0, 100),
        mood,
      });

      if (error.status === 429) {
        throw new Error(
          "AI service is currently busy. Please try again in a moment.",
        );
      }
      if (error.status >= 500) {
        throw new Error(
          "AI service is temporarily unavailable. Please try again later.",
        );
      }

      throw error;
    }
  }
}

module.exports = GroqService;
