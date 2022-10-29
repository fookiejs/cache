const sha256 = require("crypto-js/sha256")
module.exports = async function (ctx) {
    await ctx.mixin({
        name: "cache",
        object: {
            lifecycle: {
                read: {
                    rule: ["is_cached"],
                    effect: ["send_to_cache"],
                },
                count: {
                    effect: []
                },
                create: {
                    effect: ["clear_cache"]
                },
                update: {
                    effect: ["clear_cache"]
                },
                delete: {
                    effect: ["clear_cache"]
                },

            }
        }
    })

    await ctx.lifecycle({
        name: "is_cached",
        function: async function (payload, ctx, state) {
            try {
                let res = await ctx.axios.post(process.env.CACHE, {
                    token: process.env.SYSTEM_TOKEN,
                    model: "cache",
                    method: "read",
                    query: {
                        filter: {
                            hash: sha256(JSON.stringify({ query: payload.query, model: payload.model, method: payload.method })).toString()
                        }
                    }
                })
                if (res.data.data.length > 0 && res.data.status === true) {
                    payload.response.data = JSON.parse(res.data.data[0].data)
                }
            } catch (error) {
                console.log(error);
            }

            return true
        }
    })

    await ctx.lifecycle({
        name: "send_to_cache",
        async: true,
        function: async function (payload, ctx, state) {
            try {
                let res = await ctx.axios.post(process.env.CACHE, {
                    token: process.env.SYSTEM_TOKEN,
                    model: "cache",
                    method: "create",
                    body: {
                        model: payload.model,
                        hash: sha256(JSON.stringify({ query: payload.query, model: payload.model, method: payload.method })).toString(),
                        data: JSON.stringify(payload.response.data)
                    }
                })
            } catch (error) {
                console.log("veri cache gönderilemedi.");
            }

        }
    })

    await ctx.lifecycle({
        name: "clear_cache",
        async: true,
        function: async function (payload, ctx, state) {
            let res = await ctx.axios.post(process.env.CACHE, {
                token: process.env.SYSTEM_TOKEN,
                model: "cache",
                method: "delete",
                query: {
                    filter: {
                        model: payload.model,
                    }
                }
            })
        }
    })

    await ctx.axios.post(process.env.CACHE, {
        token: process.env.SYSTEM_TOKEN,
        model: "model",
        method: "create",
        body: {
            name: "cache",
            database: "store",
            mixins: [],
            schema: {
                model: {
                    type: "string",
                    required: true
                },
                hash: {
                    type: "string",
                    required: true,
                    unique: true,
                },
                data: {
                    type: "string",
                    required: true
                },
                expire: {
                    type: "number",
                    default: 1
                }
            },
            lifecycle: {
                read: {
                    role: ["system"]
                },
                create: {
                    role: ["system"]
                },
                update: {
                    role: ["system"]
                },
                count: {
                    role: ["system"]
                },
                delete: {
                    role: ["system"]
                },
            }
        }
    })
}

