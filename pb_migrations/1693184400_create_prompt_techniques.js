migrate(
  (db) => {
    const collection = new Collection({
      name: "prompt_techniques",
      type: "base",
      system: false,
      schema: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "summary",
          type: "text",
          required: true,
        },
        {
          name: "example",
          type: "editor",
          required: true,
          required: false,
          presentable: false,
          unique: false,
          options: {
            convertUrls: false,
          },
        },
        {
          name: "source_url",
          type: "url",
          required: true,
        },
      ],
    })

    return Dao(db).saveCollection(collection)
  },
  (db) => {
    return Dao(db).deleteCollection("prompt_techniques")
  }
)
