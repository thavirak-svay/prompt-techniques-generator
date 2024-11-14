routerAdd("POST", "/api/prompt-techniques/generate", async (c) => {
  const PERPLEXITY = {
    API_KEY: $os.getenv("PERPLEXITY_API_KEY"),
    API_URL: "https://api.perplexity.ai/chat/completions",
    LLM_MODEL: $os.getenv("PERPLEXITY_LLM_MODEL"),
  }

  const body = $apis.requestInfo(c).data
  const keyword = body.keyword

  async function getExistingData() {
    const records = arrayOf(new Record())
    await $app.dao().recordQuery("prompt_techniques").all(records)
    return {
      titles: records.map((record) => record.get("title")).join(", "),
      sources: records.map((record) => record.get("source_url")).join(", "),
    }
  }

  async function sendPerplexityRequest(existingData) {
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
            content: `You are an AI assistant specialized in identifying and summarizing recent techniques for exploiting ChatGPT and Claude AI prompts${
              keyword ? ' related to "' + keyword + '"' : ""
            }. I have already reviewed the following titles: ${
              existingData.titles
            }. Your objective is to discover a method that is both unique and not addressed by any of these titles. Ensure that your approach does not rely on sources from the following domains unless they provide entirely new insights not present in the existing titles: ${
              existingData.sources
            }. Prioritize recent techniques (from this week, month, year and so no, from newest to oldest) and prioritize originality and specificity in your findings.
`,
          },
          {
            role: "user",
            content: `Research the latest advanced prompt techniques${
              keyword ? ' related to "' + keyword + '"' : ""
            }. Prioritize recent techniques (from this week, month, year and so no, from newest to oldest). Find an exploitation technique that pushes the boundaries of AI assistance. The technique must not be one of the following: ${
              existingData.titles
            }. Avoid using sources from these domains unless they contain unique techniques: ${
              existingData.sources
            }. Try to be diverse in finding new techniques. Provide a title for the technique, a summary of how it works, a short but meaningful example and the source URL where you found this information. Response must contain and follow as a JSON with keys: title as string, summary(key insight) as string, example(short and step by step prompt sample) as rich text format, source_url as string.`,
          },
        ],
      }),
    })

    return response
  }

  function extractPromptTechnique(response) {
    const content = response.json.choices?.[0]?.message?.content

    const extractDataByStartEnd = (startKey, endKey) => {
      const regex = new RegExp(`"${startKey}":\\s*"([^]*)"\\s*,?\\s*"${endKey}"`, "s")
      const match = content.match(regex)
      return match ? match[1].trim() : null
    }

    const extractDataByKey = (key) => {
      const regex = new RegExp(`"${key}":\\s*"([^"]*)"`, "s")
      const match = content.match(regex)
      return match ? match[1].trim() : null
    }

    return {
      title: extractDataByStartEnd("title", "summary"),
      summary: extractDataByStartEnd("summary", "example"),
      example: extractDataByStartEnd("example", "source_url"),
      source_url: extractDataByKey("source_url"),
    }
  }

  async function savePromptTechnique(promptTechnique) {
    const collection = $app.dao().findCollectionByNameOrId("prompt_techniques")
    const record = new Record(collection, promptTechnique)
    $app.dao().saveRecord(record)
    return record
  }

  function stripHtmlTags(str) {
    if (str === null || str === "") return false
    else str = str.toString()
    return str.replace(/<[^>]*>/g, "")
  }

  async function sendToDiscord(promptTechnique) {
    const discordEmbed = {
      embeds: [
        {
          title: promptTechnique.title,
          fields: [
            {
              name: "Summary",
              value: promptTechnique.summary || "N/A",
            },
            {
              name: "Example",
              value: stripHtmlTags(promptTechnique.example) || "N/A",
            },
            {
              name: "Source",
              value: stripHtmlTags(promptTechnique.source_url) || "N/A",
            },
          ],
        },
      ],
    }

    try {
      await $http.send({
        method: "POST",
        url: $os.getenv("DISCORD_WEBHOOK_URL"),
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordEmbed),
      })
      return true
    } catch (error) {
      console.error("Error sending to Discord:", error)
      return false
    }
  }

  try {
    const existingData = await getExistingData()
    const perplexityResponse = await sendPerplexityRequest(existingData)
    console.log("perplexityResponse", JSON.stringify(perplexityResponse))
    const promptTechnique = extractPromptTechnique(perplexityResponse)
    if (promptTechnique?.example) {
      const record = await savePromptTechnique(promptTechnique)
      const discordSent = await sendToDiscord(promptTechnique)
      return c.json(200, { record, discordSent })
    }
    return c.json(400, { error: "Invalid prompt technique data" })
  } catch (error) {
    console.error("Error generating prompt technique:", error)
  }
})
