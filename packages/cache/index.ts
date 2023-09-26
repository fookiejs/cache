import crypto from "crypto"
import { Builder, Types, Type, Role, Method, run } from "fookie"

function sha256(data) {
    const hash = crypto.createHash("sha256")
    hash.update(data)
    return hash.digest("hex")
}

export async function initCache(database: Types.DatabaseInterface): Promise<Types.MixinInterface> {
    const fookie_cache = await Builder.model({
        name: "fookie_cache",
        database,
        schema: {
            model: {
                type: Type.Text,
                required: true,
            },
            hash: {
                type: Type.Text,
                required: true,
                unique: true,
            },
            data: {
                type: Type.Text,
                required: true,
            },
        },
        bind: {
            create: {
                role: [Role.system],
            },
            read: {
                role: [Role.system],
            },
            update: {
                role: [Role.nobody],
            },
            delete: {
                role: [Role.system],
            },
            sum: {
                role: [Role.nobody],
            },
            test: {
                role: [Role.system],
            },
        },
    })

    async function is_cached(payload) {
        try {
            const response = await run({
                token: process.env.SYSTEM_TOKEN,
                model: fookie_cache,
                method: Method.Read,
                query: {
                    filter: {
                        hash: sha256(
                            JSON.stringify({ query: payload.query, model: payload.model.name, method: payload.method })
                        ).toString(),
                    },
                },
            })

            if (response.data.length > 0 && response.status === true) {
                payload.response.data = JSON.parse(response.data[0].data)
            }
        } catch (error) {
            console.log(error)
        }

        return true
    }

    async function send_to_cache(payload) {
        try {
            await run({
                token: process.env.SYSTEM_TOKEN,
                model: fookie_cache,
                method: Method.Create,
                body: {
                    model: payload.model.name,
                    hash: sha256(
                        JSON.stringify({ query: payload.query, model: payload.model.name, method: payload.method })
                    ).toString(),
                    data: JSON.stringify(payload.response.data),
                },
            })
        } catch (error) {
            console.log(error)
        }
    }

    async function clear_cache(payload) {
        try {
            await run({
                token: process.env.SYSTEM_TOKEN,
                model: fookie_cache,
                method: Method.Delete,
                query: {
                    filter: {
                        model: payload.model.name,
                    },
                },
            })
        } catch (error) {
            console.log(error)
        }
    }

    return Builder.mixin({
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
    })
}
