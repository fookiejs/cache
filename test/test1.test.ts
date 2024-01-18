import { expect, describe, it } from "vitest"
import * as fookie_cache from "../index"
import * as fookie from "fookie"

describe("MyTest", async () => {
    const cache_mixin = await fookie_cache.init_cache(fookie.Dictionary.Database.store)

    it("should pass", async function () {
        const ReadModel = await fookie.Builder.model({
            mixins: [cache_mixin],
            name: "read_model",
            database: fookie.Dictionary.Database.store,
            schema: {
                text: {
                    type: fookie.Dictionary.Type.text,
                    required: true,
                },
            },
            bind: {
                create: {
                    role: [fookie.Dictionary.Lifecycle.everybody],
                },
                read: {
                    role: [fookie.Dictionary.Lifecycle.everybody],
                },
            },
        })

        await fookie.run({
            model: ReadModel,
            method: fookie.Method.Create,
            body: {
                text: "A",
            },
        })

        await fookie.run({
            model: ReadModel,
            method: fookie.Method.Read,
        })

        const cv1 = await fookie.run<any, "read">({
            token: process.env.SYSTEM_TOKEN,
            model: fookie.Dictionary.Model.fookie_cache,
            method: fookie.Method.Read,
        })
        expect(cv1.data.length).toBe(1)

        await fookie.run({
            model: ReadModel,
            method: fookie.Method.Create,
            body: {
                text: "A",
            },
        })

        const cv2 = await fookie.run<any, "read">({
            token: process.env.SYSTEM_TOKEN,
            model: fookie.Dictionary.Model.fookie_cache,
            method: fookie.Method.Read,
        })
        expect(cv2.data.length).toBe(0)
    })
})
