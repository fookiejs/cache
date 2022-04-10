module.exports.client = async function (ctx) {
    await ctx.mixin({
        name: "cache",
        object: {
            lifecycle: {
                read: {
                    rule: ["is_cached"],
                    effect: ["send_to_cache"],
                },
                count: {
                    effect: ["send_to_cache"]
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

    await ctx.rule({
        name: "is_cached",
        function: async function (payload, ctx, state) {
            console.log(ctx.cryptojs.SHA256(JSON.stringify({ query: payload.query, model: payload.model })).toString());
            let res = await ctx.axios.post(process.env.CACHE, {
                system: ctx.store.get("system_token"),
                model: "cache",
                method: "read",
                query: {
                    filter: {
                        hash: ctx.cryptojs.SHA256(JSON.stringify({ query: payload.query, model: payload.model })).toString()
                    }
                }
            })
            console.log(ctx.cryptojs.SHA256(JSON.stringify({ query: payload.query, model: payload.model })).toString());
            if (res.data.data.length > 0) {
                payload.response.data = res.data.data[0].data
            }
            return true
        }
    })

    await ctx.effect({
        name: "send_to_cache",
        function: async function (payload, ctx, state) {
            let res = await ctx.axios.post(process.env.CACHE, {
                system: ctx.store.get("system_token"),
                model: "cache",
                method: "create",
                body: {
                    model: payload.model,
                    hash: ctx.cryptojs.SHA256(JSON.stringify({ query: payload.query, model: payload.model })).toString(),
                    data: payload.response.data
                }
            })
        }
    })

    await ctx.effect({
        name: "clear_cache",
        function: async function (payload, ctx, state) {
            let res = await ctx.axios.post(process.env.CACHE, {
                system: ctx.store.get("system_token"),
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


}


module.exports.server = async function (ctx) {
    await ctx.model({
        name: "cache",
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
                type: "any",
                required: true
            },
            expire: {
                type: "number",
                default: Infinity
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
    })
}

