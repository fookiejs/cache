import sha256 from "crypto-js/sha256"
import { DatabaseInterface, Fookie, MixinInterface } from "fookie-types"

export function initCache(database: DatabaseInterface) {
    return async function (fookie: Fookie): Promise<MixinInterface> {
        const fookie_cache = await fookie.Core.model({
            name: "fookie_cache",
            database,
            schema: {
                model: {
                    type: fookie.Type.Text,
                    required: true,
                },
                hash: {
                    type: fookie.Type.Text,
                    required: true,
                    unique: true,
                },
                data: {
                    type: fookie.Type.Text,
                    required: true,
                },
            },
            bind: {
                create: {
                    role: [fookie.Role.system],
                },
                read: {
                    role: [fookie.Role.system],
                },
                update: {
                    role: [fookie.Role.nobody],
                },
                delete: {
                    role: [fookie.Role.system],
                },
                sum: {
                    role: [fookie.Role.nobody],
                },
                test: {
                    role: [fookie.Role.system],
                },
            },
        })

        async function is_cached(payload) {
            try {
                const response = await fookie.Core.run({
                    token: process.env.SYSTEM_TOKEN,
                    model: fookie_cache,
                    method: fookie.Method.Read,
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
                await fookie.Core.run({
                    token: process.env.SYSTEM_TOKEN,
                    model: fookie_cache,
                    method: fookie.Method.Create,
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
                await fookie.Core.run({
                    token: process.env.SYSTEM_TOKEN,
                    model: fookie_cache,
                    method: fookie.Method.Delete,
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

        return fookie.Core.mixin({
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
}
