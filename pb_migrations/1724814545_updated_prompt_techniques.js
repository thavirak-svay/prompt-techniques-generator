migrate(
  (db) => {
    const dao = new Dao(db)
    const collection = dao.findCollectionByNameOrId("8wo7masrujpw5rk")

    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "s0a3ztzw",
        name: "example",
        type: "editor",
        required: false,
        presentable: false,
        unique: false,
        options: {
          convertUrls: false,
        },
      })
    )

    return dao.saveCollection(collection)
  },
  (db) => {
    const dao = new Dao(db)
    const collection = dao.findCollectionByNameOrId("8wo7masrujpw5rk")

    collection.schema.removeField("s0a3ztzw")

    return dao.saveCollection(collection)
  }
)
