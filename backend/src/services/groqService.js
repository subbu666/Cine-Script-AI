const { getGroqClient } = require("../config/groq");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Groq AI Service
 * Handles script generation and section-level regeneration using Groq's LLM API
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
   * Build the full generation prompt.
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

  /* ============================================================
   *  REGENERATION PROMPT BUILDERS
   * ============================================================ */

  /**
   * Build a prompt for regenerating ONLY the movie title.
   */
  static buildRegenerateTitlePrompt(situation, mood) {
    const systemPrompt = this.getSystemPrompt(mood);

    const userPrompt = `You are regenerating ONLY the title for a ${mood.toUpperCase()} movie script.

SITUATION: "${situation}"

Create a BRAND NEW, FRESH ${mood.toUpperCase()} movie title — Bollywood/Hollywood style. It must be catchy, dramatic, and memorable. This should feel completely different from a typical AI-generated title.

RULES:
- Return a single title string only
- Do NOT include a tagline
- Avoid generic words like "The Journey", "The Path", "Rising" unless used creatively
- Make it punchy, evocative, and specific to the ${mood} tone

Return ONLY valid JSON, no extra text, no markdown:
{ "title": "Your Dramatic New Title" }`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Build a prompt for regenerating ONLY the tagline.
   */
  static buildRegenerateTaglinePrompt(situation, mood, currentTitle) {
    const systemPrompt = this.getSystemPrompt(mood);

    const userPrompt = `You are regenerating ONLY the tagline for a ${mood.toUpperCase()} movie titled "${currentTitle}".

SITUATION: "${situation}"

Write a POWERFUL new one-line tagline that sells this ${mood} film. It should complement the title and capture the emotional core of the story.

RULES:
- One tagline only — one sentence or phrase
- Should feel cinematic and quotable
- Must match the ${mood} tone
- Avoid clichés like "One man's journey..." or "In a world where..."

Return ONLY valid JSON, no extra text, no markdown:
{ "tagline": "Your powerful new tagline here" }`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Build a prompt for regenerating a SINGLE SCENE.
   * Passes surrounding scenes as context so the new scene fits the arc.
   */
  static buildRegenerateScenePrompt(
    situation,
    mood,
    sceneNumber,
    totalScenes,
    existingScenes,
  ) {
    const systemPrompt = this.getSystemPrompt(mood);

    const contextLines = existingScenes
      .filter((s) => s.number !== sceneNumber)
      .map(
        (s) =>
          `  • Scene ${s.number} — "${s.title}": ${s.description.substring(0, 120).trim()}...`,
      )
      .join("\n");

    const userPrompt = `You are regenerating Scene ${sceneNumber} of ${totalScenes} for a ${mood.toUpperCase()} movie script.

SITUATION: "${situation}"

Here are the OTHER scenes for narrative context (do NOT reproduce these, just use them to ensure your new scene fits the story arc):
${contextLines}

Write a COMPLETELY FRESH Scene ${sceneNumber} that:
- Fits naturally at position ${sceneNumber} in a ${totalScenes}-scene ${mood} story
- Does NOT duplicate the content of any other scene above
- Has cinematic camera direction, lighting, and atmosphere in its description
- Contains at least 2 dramatic dialogue entries with named characters

Return ONLY valid JSON, no extra text, no markdown:
{
  "number": ${sceneNumber},
  "title": "Scene Title Here",
  "description": "Cinematic scene description with camera angles and atmosphere...",
  "dialogues": [
    { "character": "CHARACTER NAME", "line": "Dramatic dialogue..." },
    { "character": "OTHER CHARACTER", "line": "Their response..." }
  ]
}`;

    return { systemPrompt, userPrompt };
  }

  /* ============================================================
   *  RESPONSE PARSERS
   * ============================================================ */

  /**
   * Parse and validate the full script AI response.
   */
  static parseScriptResponse(responseText) {
    try {
      let jsonStr = responseText.trim();

      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(jsonStr);

      if (!parsed.title || typeof parsed.title !== "string") {
        throw new Error("Invalid response: missing title");
      }
      if (!parsed.tagline || typeof parsed.tagline !== "string") {
        throw new Error("Invalid response: missing tagline");
      }
      if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
        throw new Error("Invalid response: scenes must be a non-empty array");
      }

      const scenes = parsed.scenes.map((scene, index) => {
        const number =
          typeof scene.number === "number" ? scene.number : index + 1;
        const title =
          typeof scene.title === "string" && scene.title.trim()
            ? scene.title.trim()
            : `Scene ${number}`;

        if (!scene.description || typeof scene.description !== "string") {
          throw new Error(`Invalid scene ${index + 1}: missing description`);
        }

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
   * Safely strip markdown fences and parse JSON from an AI response.
   * Used for targeted single-field regeneration responses.
   */
  static parseJsonResponse(responseText) {
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(jsonStr);
  }

  /* ============================================================
   *  CORE GENERATION
   * ============================================================ */

  /**
   * Generate a full movie script from a situation.
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
      if (!responseText) throw new Error("Empty response from Groq API");

      const script = this.parseScriptResponse(responseText);
      const generationTime = Date.now() - startTime;

      logger.info("Script generation completed", {
        title: script.title,
        scenes: script.scenes.length,
        generationTimeMs: generationTime,
      });

      return { ...script, generationTime };
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

  /* ============================================================
   *  SECTION REGENERATION
   * ============================================================ */

  /**
   * Regenerate a specific section of an existing script.
   *
   * @param {string} situation   - Original situation text
   * @param {string} mood        - Script mood
   * @param {'title'|'tagline'|'scene'} section - Which section to regenerate
   * @param {Object} options
   * @param {string} [options.currentTitle]    - Required for tagline regeneration
   * @param {number} [options.sceneNumber]     - Required for scene regeneration
   * @param {number} [options.totalScenes]     - Total scene count, for scene context
   * @param {Array}  [options.existingScenes]  - All current scenes, for scene context
   *
   * @returns {Promise<{ title?: string, tagline?: string, scene?: Object }>}
   */
  static async regenerateSection(situation, mood, section, options = {}) {
    const startTime = Date.now();

    try {
      logger.info("Starting section regeneration", { section, mood, options });

      const client = getGroqClient();

      // ── TITLE ──────────────────────────────────────────────
      if (section === "title") {
        const { systemPrompt, userPrompt } = this.buildRegenerateTitlePrompt(
          situation,
          mood,
        );

        const completion = await client.chat.completions.create({
          model: env.groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.95, // higher temp for more creative title variation
          max_tokens: 80,
          stream: false,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error("Empty response from Groq API");

        const parsed = this.parseJsonResponse(responseText);
        if (!parsed.title || typeof parsed.title !== "string") {
          throw new Error("Invalid regeneration response: missing title field");
        }

        logger.info("Title regenerated", {
          title: parsed.title,
          durationMs: Date.now() - startTime,
        });

        return { title: parsed.title.trim() };
      }

      // ── TAGLINE ────────────────────────────────────────────
      if (section === "tagline") {
        const { currentTitle } = options;
        if (!currentTitle)
          throw new Error("currentTitle is required for tagline regeneration");

        const { systemPrompt, userPrompt } = this.buildRegenerateTaglinePrompt(
          situation,
          mood,
          currentTitle,
        );

        const completion = await client.chat.completions.create({
          model: env.groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.95,
          max_tokens: 120,
          stream: false,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error("Empty response from Groq API");

        const parsed = this.parseJsonResponse(responseText);
        if (!parsed.tagline || typeof parsed.tagline !== "string") {
          throw new Error(
            "Invalid regeneration response: missing tagline field",
          );
        }

        logger.info("Tagline regenerated", {
          tagline: parsed.tagline,
          durationMs: Date.now() - startTime,
        });

        return { tagline: parsed.tagline.trim() };
      }

      // ── SCENE ──────────────────────────────────────────────
      if (section === "scene") {
        const { sceneNumber, totalScenes, existingScenes } = options;
        if (sceneNumber == null)
          throw new Error("sceneNumber is required for scene regeneration");

        const { systemPrompt, userPrompt } = this.buildRegenerateScenePrompt(
          situation,
          mood,
          sceneNumber,
          totalScenes || existingScenes?.length || sceneNumber,
          existingScenes || [],
        );

        const completion = await client.chat.completions.create({
          model: env.groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.9,
          max_tokens: 1200,
          stream: false,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error("Empty response from Groq API");

        const parsed = this.parseJsonResponse(responseText);

        // Validate & normalise the returned scene
        if (!parsed.description || typeof parsed.description !== "string") {
          throw new Error("Invalid scene response: missing description");
        }

        const scene = {
          number:
            typeof parsed.number === "number" ? parsed.number : sceneNumber,
          title:
            typeof parsed.title === "string" && parsed.title.trim()
              ? parsed.title.trim()
              : `Scene ${sceneNumber}`,
          description: parsed.description.trim(),
          dialogues: Array.isArray(parsed.dialogues)
            ? parsed.dialogues
                .filter(
                  (d) =>
                    d &&
                    typeof d.character === "string" &&
                    typeof d.line === "string",
                )
                .map((d) => ({
                  character: d.character.trim(),
                  line: d.line.trim(),
                }))
            : [],
        };

        logger.info("Scene regenerated", {
          sceneNumber,
          title: scene.title,
          dialogues: scene.dialogues.length,
          durationMs: Date.now() - startTime,
        });

        return { scene };
      }

      throw new Error(
        `Unknown section: "${section}". Must be 'title', 'tagline', or 'scene'.`,
      );
    } catch (error) {
      logger.error("Section regeneration failed", {
        section,
        error: error.message,
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
