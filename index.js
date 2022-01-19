module.exports.plugin = async function (ctx) {
    await ctx.setting({
        name: "out_of_cache",
        value: ["store", "redis", "nulldb", "memcache", "memorydb"]
    })

    await ctx.setting({
        name: "state",
        value: "ok"
    })

    await ctx.rule({
        name: "is_cached",
        function: async function (payload, ctx, state) {
            let res = await ctx.axios.post(process.env.CACHE, {
                system: ctx.store.get("system_token"),
                model: "cache",
                method: "read",
                query: {
                    hash: ctx.cryptojs.SHA256(JSON.stringify(payload)).toString(),
                }
            })
            if (res.data.length > 0) {
                payload.response.data = res.data[0].data
                console.log("from cache", res.data)
            }
            return true
        }
    })

    await ctx.effect({
        name: "send_to_cache",
        function: async function (payload, ctx, state) {
            if (!ctx.local.get("setting", "out_of_cache").value.includes(payload.model)) {
                let res = await ctx.axios.post(process.env.CACHE, {
                    system: ctx.store.get("system_token"),
                    model: "cache",
                    method: "create",
                    body: {
                        model: payload.model,
                        hash: ctx.cryptojs.SHA256(JSON.stringify(payload)).toString(),
                        data: payload.response.data
                    }
                })
                console.log("send_to_cache", res.data);
            }
        }
    })

    await ctx.effect({
        name: "clear_cache",
        function: async function (ctx) {
            let res = await ctx.axios.post(process.env.CACHE, {
                system: ctx.store.get("system_token"),
                model: "cache",
                method: "delete",
                query: {
                    model: payload.model,
                }
            })
            console.log("clear_cache", res.data);
        }
    })

    let after = ctx.local.get("mixin", "after")

    after.object.lifecycle.read.rule.push("is_cached")
    after.object.lifecycle.read.effect.push("send_to_cache")
    after.object.lifecycle.count.effect.push("send_to_cache")
    after.object.lifecycle.create.effect.push("clear_cache")
    after.object.lifecycle.update.effect.push("clear_cache")

    await ctx.run({
        system: true,
        method: "update",
        model: "mixin",
        query: {
            name: "after"
        },
        body: {
            object: after.object
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

