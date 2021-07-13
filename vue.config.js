module.exports = {
    publicPath: './',  // relative path to resources

    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.(glsl|vs|fs|frag|vert)$/,
                    use: 'ts-shader-loader'
                }
            ]
        }
    }
}