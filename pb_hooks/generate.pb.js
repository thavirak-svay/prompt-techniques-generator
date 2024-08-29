routerAdd("POST", "/api/prompt-techniques/generate", async (c) => {
  const _ = require("https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js");

  const PERPLEXITY = {
    API_KEY: $os.getenv("PERPLEXITY_API_KEY"),
    API_URL: $os.getenv("PERPLEXITY_API_URL"),
    LLM_MODEL: $os.getenv("PERPLEXITY_LLM_MODEL"),
  };

  async function getExistingData() {
    const records = arrayOf(new Record());
    await $app.dao().recordQuery("prompt_techniques").all(records);
    return {
      titles: records.map((record) => record.get("title")).join(", "),
      sources: records.map((record) => record.get("source_url")).join(", "),
    };
  }

  async function sendPerplexityRequest(existingData) {
    const currentDate = new Date().toISOString().split("T")[0];

    const response = $http.send({
      method: "POST",
      url: PERPLEXITY.API_URL,
      headers: {
        Authorization: `Bearer ${PERPLEXITY.API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PERPLEXITY.LLM_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an AI assistant focused on discovering and summarizing ChatGPT prompt exploitation techniques. I already acknowledged the following titles: ${existingData.titles}. Your goal is to find a unique and effective method that has not been covered by these existing topics. Avoid using sources from these domains unless they contain unique techniques: ${existingData.sources}. Focus on techniques published after ${currentDate}.`,
          },
          {
            role: "user",
            content: `Research the latest advanced prompt techniques. Find an exploitation technique that pushes the boundaries of AI assistance. The technique must not be one of the following: ${existingData.titles}. Avoid using sources from these domains unless they contain unique techniques: ${existingData.sources}. Provide a title for the technique, a summary of how it works, and the source URL where you found this information. Response must contain and follow as a JSON with keys: title as string, summary(key insight) as string, example(short and step by step prompt sample) as rich text format, source_url as string without missing a single field.`,
          },
        ],
      }),
    });

    return response;
  }

  function extractPromptTechnique(response) {
    // Step 1: Parse the main response JSON
    const data = JSON.parse(response);

    // Step 2: Extract the content string from the nested structure
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    // Step 3: Use a regex to find the JSON block within the content
    const jsonMatch = content.match(/```json\s*({[\s\S]*})\s*```/);

    // Step 4: Parse the extracted JSON if the regex finds a match
    if (jsonMatch) {
      try {
        const contentJson = JSON.parse(jsonMatch[1]);

        // Step 5: Return the required fields from the parsed JSON
        return {
          title: contentJson.title?.trim() || "",
          summary: contentJson.summary?.trim() || "",
          example: contentJson.example?.trim() || "",
          source_url: contentJson.source_url?.trim() || "",
        };
      } catch (error) {
        console.error("Error parsing the extracted JSON:", error);
        return null;
      }
    }

    return null; // Return null if the JSON block was not found
  }

  async function savePromptTechnique(promptTechnique) {
    const collection = $app.dao().findCollectionByNameOrId("prompt_techniques");
    const record = new Record(collection, promptTechnique);
    $app.dao().saveRecord(record);
    return record;
  }

  try {
    const existingData = await getExistingData();
    const perplexityResponse = await sendPerplexityRequest(existingData);
    console.log("perplexityResponse", perplexityResponse);
    const promptTechnique = extractPromptTechnique(perplexityResponse);
    if (promptTechnique) {
      const record = await savePromptTechnique(promptTechnique);
      return c.json(200, { record });
    }
    return c.json(400, { error: "Invalid prompt technique data" });
  } catch (error) {
    console.error("Error generating prompt technique:", error);
  }
});
