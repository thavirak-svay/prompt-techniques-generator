cronAdd("Generate Prompt Technique", $os.getenv("GENERATE_CRON_SCHEDULE"), async () => {
  const API_BASE_URL = $os.getenv("API_BASE_URL")
  const apiUrl = `${API_BASE_URL}/api/prompt-techniques/generate`

  await $http.send({
    method: "POST",
    url: apiUrl,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
})

cronAdd("Warm instance every 15 minutes", "*/15 * * * *", async () => {
  const API_BASE_URL = $os.getenv("API_BASE_URL")
  const apiUrl = `${API_BASE_URL}/api/prompt-techniques`

  await $http.send({
    method: "GET",
    url: apiUrl,
  })
})
