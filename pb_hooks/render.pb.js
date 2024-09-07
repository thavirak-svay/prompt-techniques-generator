routerAdd("GET", "/api/prompt-techniques", async (c) => {
  async function getAllRecords(page = 1, limit = 10) {
    const offset = (page - 1) * limit
    const records = arrayOf(new Record())
    $app
      .dao()
      .recordQuery("prompt_techniques")
      .orderBy("created DESC")
      .limit(limit + 1)
      .offset(offset)
      .all(records)

    const hasNextPage = records.length > limit
    const paginatedRecords = records.slice(0, limit)

    return {
      records: paginatedRecords.map((record) => ({
        id: record.id,
        title: record.get("title"),
        summary: record.get("summary"),
        example: record.get("example").replace(/\\n/g, "\n"),
        source_url: record.get("source_url"),
        created: record.get("created"),
      })),
      hasNextPage,
    }
  }

  function generateHtml(records, page, hasNextPage) {
    return (
      records
        .map(
          (record) => `
      <div class="card bg-[var(--card-bg)] rounded-[0.75rem] p-[1.5rem] mb-[1.5rem]">
        <div class="mb-[1rem]">
          <h2 class="text-[var(--text)] text-[1.5rem] font-semibold">${record.title}</h2>
          <span class="date text-[var(--text-light)] font-semibold" data-date="${record.created}"></span>
        </div>
        <p class="summary text-[var(--text)] text-[1.2rem] mb-[1.25rem]">${record.summary}</p>
        <div class="example bg-[var(--example-bg)] rounded-[0.5rem] p-[1rem] mb-[1.25rem]" data-markdown="${record.example.replace(
          /"/g,
          "&quot;"
        )}"></div>
        <a href="${record.source_url}" class="source-link text-[var(--link)] text-[0.9rem] hover:underline">${
            record.source_url
          }</a>
      </div>
    `
        )
        .join("") +
      `
    <div class="pagination flex justify-center items-center mt-4">
      <button hx-get="/api/prompt-techniques?page=${page - 1}" hx-target="#records-container" hx-swap="innerHTML" ${
        page <= 1 ? "disabled" : ""
      }>Prev</button>
      <span class="page-indicator text-[var(--text-light)] text-[0.9rem] mx-2">Page ${page}</span>
      <button hx-get="/api/prompt-techniques?page=${page + 1}" hx-target="#records-container" hx-swap="innerHTML" ${
        !hasNextPage ? "disabled" : ""
      }>Next</button>
    </div>`
    )
  }

  try {
    const page = parseInt(c.queryParam("page") || 1, 10)
    const limit = 10
    const { records, hasNextPage } = await getAllRecords(page, limit)
    return c.html(200, generateHtml(records, page, hasNextPage))
  } catch (error) {
    console.error("Error fetching prompt techniques:", error)
    return c.text(500, "Internal Server Error")
  }
})
