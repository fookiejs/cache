import process from "node:process"
import sha256 from "crypto-js/sha256"

export const Mixin = {
    bind: {
        read: {
            rule: [is_cached],
            effect: [send_to_cache],
        },
        create: {
            effect: [clear_cache],
        },
        update: {
            effect: [clear_cache],
        },
        delete: {
            effect: [clear_cache],
        },
    },
}

async function is_cached(payload, ctx) {
    try {
        const res = await ctx.axios.post(process.env.CACHE, {
            token: process.env.SYSTEM_TOKEN,
            model: "cache",
            method: "read",
            query: {
                filter: {
                    hash: sha256(
                        JSON.stringify({ query: payload.query, model: payload.model, method: payload.method })
                    ).toString(),
                },
            },
        })
        if (res.data.data.length > 0 && res.data.status === true) {
            payload.response.data = JSON.parse(res.data.data[0].data)
        }
    } catch (error) {
        console.log(error)
    }

    return true
}

async function send_to_cache(payload, ctx) {
    try {
        await ctx.axios.post(process.env.CACHE, {
            token: process.env.SYSTEM_TOKEN,
            model: "cache",
            method: "create",
            body: {
                model: payload.model,
                hash: sha256(JSON.stringify({ query: payload.query, model: payload.model, method: payload.method })).toString(),
                data: JSON.stringify(payload.response.data),
            },
        })
    } catch (error) {
        console.log("veri cache gönderilemedi.")
    }
}

async function clear_cache(payload, ctx) {
    await ctx.axios.post(process.env.CACHE, {
        token: process.env.SYSTEM_TOKEN,
        model: "cache",
        method: "delete",
        query: {
            filter: {
                model: payload.model,
            },
        },
    })
}
