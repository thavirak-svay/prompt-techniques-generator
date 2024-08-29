routerAdd("POST", "/api/prompt-techniques/generate", async (c) => {
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
            content: `Research the latest advanced prompt techniques. Find an exploitation technique that pushes the boundaries of AI assistance. The technique must not be one of the following: ${existingData.titles}. Avoid using sources from these domains unless they contain unique techniques: ${existingData.domains}. Provide a title for the technique, a summary of how it works, and the source URL where you found this information. Response must contain and follow as a JSON with keys: title, summary(key insight), example(short and step by step prompt sample in rich text format), source_url without missing a single field.`,
          },
        ],
      }),
    });

    return response.json.choices?.[0]?.message?.content;
  }

  function extractPromptTechnique(content) {
    const extractData = (key) => {
      const match = content.match(new RegExp(`"${key}":\\s*"([^"]*)"`));
      return match ? match[1] : null;
    };

    const extractExample = () => {
      const match = content.match(/"example":\s*([\s\S]*?)(?=\s*"\w+":|$)/);
      return match ? match[1].trim() : null;
    };

    return {
      title: extractData("title"),
      summary: extractData("summary"),
      example: extractExample(),
      source_url: extractData("source_url"),
    };
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
