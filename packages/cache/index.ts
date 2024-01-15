import crypto from "crypto"
import { Builder, Types, Method, Dictionary, run } from "fookie"

function sha256(data) {
    const hash = crypto.createHash("sha256")
    hash.update(data)
    return hash.digest("hex")
}

export async function init_cache(database: Types.DatabaseInterface): Promise<Types.MixinInterface> {
    const fookie_cache = await Builder.model({
        name: "fookie_cache",
        database,
        schema: {
            model: {
                type: Dictionary.Type.text,
                required: true,
            },
            hash: {
                type: Dictionary.Type.text,
                required: true,
                unique: true,
            },
            data: {
                type: Dictionary.Type.text,
                required: true,
            },
        },
        bind: {
            create: {
                role: [Dictionary.Lifecycle.system],
            },
            read: {
                role: [Dictionary.Lifecycle.system],
            },
            update: {
                role: [Dictionary.Lifecycle.nobody],
            },
            delete: {
                role: [Dictionary.Lifecycle.system],
            },
            sum: {
                role: [Dictionary.Lifecycle.nobody],
            },
            test: {
                role: [Dictionary.Lifecycle.system],
            },
        },
    })

    async function is_cached(payload) {
        try {
            const response = await run<any, "read">({
                token: process.env.SYSTEM_TOKEN,
                model: fookie_cache,
                method: Method.Read,
                query: {
                    filter: {
                        hash: {
                            equals: sha256(
                                JSON.stringify({ query: payload.query, model: payload.model.name, method: payload.method })
                            ).toString(),
                        },
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
                        model: { equals: payload.model.name },
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
