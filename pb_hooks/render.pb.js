routerAdd("GET", "/api/prompt-techniques", async (c) => {
  async function getAllRecords(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const records = arrayOf(new Record());
    $app
      .dao()
      .recordQuery("prompt_techniques")
      .orderBy("created DESC")
      .limit(limit + 1)
      .offset(offset)
      .all(records);

    const hasNextPage = records.length > limit;
    const paginatedRecords = records.slice(0, limit);

    return {
      records: paginatedRecords.map((record) => ({
        id: record.id,
        title: record.get("title"),
        summary: record.get("summary"),
        example: record.get("example"),
        source_url: record.get("source_url"),
        created: record.get("created"),
      })),
      hasNextPage,
    };
  }

  function generateHtml(records, page, hasNextPage) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prompt Techniques</title>
        <link href="https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500;700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <style>
            :root {
                --background: #f1efe7;
                --card-bg: #f8f7f3;
                --text: #333333;
                --text-light: #5a5a5a;
                --accent: #ff6b35;
                --link: #8b4513;
                --example-bg: #f0f0f0;
            }

            body.dark {
                --background: #303446; 
                --card-bg: #292c3c;
                --text: #c6d0f5;
                --text-light: #a5adce;
                --accent: #babbf1; 
                --link: #8bd5ca; 
                --example-bg: #414559; 
            }

            body {
                font-family: 'Inter', 'system-ui', sans-serif;
            }

            * {
                text-wrap: balance;
            }

            .source-link {
                font-family: 'Fira Mono', monospace;
            }

            .pagination {
                position: fixed;
                right: 1.25rem;
                bottom: 1.25rem;
                display: flex;
                flex-direction: row;
                gap: 0.5rem;
            }

            .pagination button {
                background-color: var(--card-bg);
                border: none;
                padding: 0.4rem 0.9rem;
                border-radius: 0.5rem;
                font-size: 0.9rem; 
                cursor: pointer;
                transition: background-color 0.3s, transform 0.2s;
                color: var(--text-light); 
            }

            .pagination button:hover {
                background-color: var(--link);
                color: var(--background); 
            }

            .pagination button:disabled {
                background-color: var(--example-bg);
                cursor: not-allowed;
                opacity: 0.6; 
                color: var(--text-light);
            }
        </style>
    </head>
    <body class="bg-[var(--background)] text-[var(--text)] transition-colors duration-300 max-w-[50rem] mx-auto p-[2.5rem]">
        <div class="fixed top-[1.25rem] right-[1.25rem] cursor-pointer" onclick="toggleDarkMode()">
            <span class="sun-icon mr-[0.75rem] text-[1.5rem]">☀️</span>
            <span class="moon-icon hidden mr-[0.75rem] text-[1.5rem]">🌙</span>
        </div>
        <h1 class="flex items-center mb-[2rem] text-[2rem] font-semibold">
            Prompt Techniques
        </h1>
        ${records
          .map(
            (record) => `
            <div class="card bg-[var(--card-bg)] rounded-[0.75rem] p-[1.5rem] mb-[1.5rem]">
                <h2 class="text-[var(--text)] text-[1.375rem] font-semibold mb-[1rem]">${record.title}</h2>
                <p class="summary text-[var(--text-light)] text-[1rem] mb-[1.25rem]">${record.summary}</p>
                <div class="example bg-[var(--example-bg)] rounded-[0.5rem] p-[1rem] mb-[1.25rem]">
                    <div id="example-${record.id}"></div>
                </div>
                <a href="${record.source_url}" class="source-link text-[var(--link)] text-[0.9rem] hover:underline">${record.source_url}</a>
            </div>
        `
          )
          .join("")}
        <div class="pagination">
            <button onclick="changePage(${page - 1})" ${page <= 1 ? "disabled" : ""}>Prev</button>
            <button onclick="changePage(${page + 1})" ${!hasNextPage ? "disabled" : ""}>Next</button>
        </div>
        <script>
            function toggleDarkMode() {
                const body = document.body;
                body.classList.toggle('dark');
                const isDarkMode = body.classList.contains('dark');
                localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
                document.querySelectorAll('.sun-icon, .moon-icon').forEach(el => el.classList.toggle('hidden'));
            }

            function renderMarkdown() {
                ${records
                  .map(
                    (record) => `
                    document.getElementById('example-${record.id}').innerHTML = 
                        marked.parse(${JSON.stringify(record.example)});
                `
                  )
                  .join("")}
            }

            function changePage(page) {
                window.location.href = '/api/prompt-techniques?page=' + page;
            }

            window.onload = () => {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme && savedTheme === 'dark') {
                    document.body.classList.add('dark');
                    document.querySelectorAll('.sun-icon, .moon-icon').forEach(el => el.classList.toggle('hidden'));
                }
                renderMarkdown();
            }
        </script>
    </body>
    </html>
  `;
  }

  try {
    const page = parseInt(c.queryParam("page") || 1, 10);
    const limit = 10;
    const { records, hasNextPage } = await getAllRecords(page, limit);
    return c.html(200, generateHtml(records, page, hasNextPage));
  } catch (error) {
    console.error("Error fetching prompt techniques:", error);
    return c.text(500, "Internal Server Error");
  }
});
