const resolvers = Promise.withResolvers()

Promise.all([
    (() => {
        return new Promise<string>(resolve => {
            setTimeout(resolve, 1000, 'success')
        })
    })()
]).then(resolvers.resolve)

resolvers.promise.then(res => {
    console.log(12, res)
})