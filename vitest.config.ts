import { defineConfig } from "vite"

export default () => {
    return defineConfig({
        test: {
            include: ["test/*.test.ts"],
            coverage: {
                provider: "istanbul",
            },
        },
    })
}
