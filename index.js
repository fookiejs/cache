
const redis = require("redis")

module.exports = async function (ctx) {
    const client = redis.createClient({
        url: process.env.REDIS_URL
    })
    await ctx.modify({
        name: "is_cached",
        function: async function (ctx) {
            console.log("is_cached");
        }
    })

    await ctx.effect({
        name: "send_to_cache",
        function: async function (ctx) {
            console.log("send_to_cache");
        }
    })

    let after = ctx.local.get("mixin", "after")
    after.object.read.modify.push("is_cached")
    after.object.read.effect.push("send_to_cache")

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

