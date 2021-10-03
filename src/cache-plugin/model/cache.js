module.exports = async function (ctx) {
    ctx.model({
        name: "cache",
        database: "store",
        pk: "hash",
        mixin: [],
        schema: {
            hash: {
                type: "string",
                required: true,
                unique: true
            },
            response: {
                type: "buffer",
                required: true,
            },
        },
        lifecycle: {
            get: {
                preRule: [],
                rule: [],
                role: ["system"],
                modify: [],
                filter: [],
                effect: [],
            },
            getAll: {
                preRule: [],
                rule: [],
                role: ["system"],
                modify: [],
                filter: [],
                effect: [],
            },
            create: {
                preRule: [],
                rule: [],
                role: ["system"],
                modify: [],
                filter: [],
                effect: [],
            },
            update: {
                preRule: [],
                rule: [],
                role: ["system"],
                modify: [],
                filter: [],
                effect: [],
            },
            delete: {
                preRule: [],
                rule: [],
                role: ["system"],
                modify: [],
                filter: [],
                effect: [],
            },
            count: {
                preRule: [],
                rule: [],
                role: ["system"],
                modify: [],
                filter: [],
                effect: [],
            },
        }
    })
}