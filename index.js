
(async () => {
    const Fookie = require('../fookie')
    const fookie = new Fookie()
    await fookie.core()
    await fookie.server()
    await fookie.use(require("./src/cache-plugin/model/cache"))
    fookie.listen(26001)
})()

