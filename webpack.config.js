const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const postcssPresetEnv = require('postcss-preset-env')

const root = pathname => path.resolve(__dirname, pathname)

const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
    mode: process.env.NODE_ENV,

    devtool: devMode ? 'cheap-module-eval-source-map' : false,

    context: root('src'),

    entry: {
        app: root('src/index.js')
    },

    output: {
        publicPath: devMode ? '' : 'https://webserver-1256209664.cos.ap-shanghai.myqcloud.com/qianlong/',
        path: root('dist'),
        filename: devMode ? '[name].js' : '[name].[chunkhash].js'
    },

    resolve: {
        extensions: ['.js', '.html'],
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ],
                        plugins: [
                            '@babel/plugin-proposal-object-rest-spread',
                            '@babel/plugin-syntax-dynamic-import'
                        ]
                    }
                }
            },
            {
                test: /\.less$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' },
                    {
                        loader: 'postcss-loader', options: {
                            ident: 'postcss',
                            plugins: () => [
                                postcssPresetEnv()
                            ]
                        }
                    },
                    { loader: 'less-loader' }
                ]
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader',
                    options: {
                        minimize: true
                    }
                }],
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader',
                options: {
                    limit: 8192
                }
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: root('src/index.html'),
            favicon: root('src/favicon.ico'),
            inject: true,
            cache: false
        }),
        new CopyWebpackPlugin([
            {
                from: 'model/**/*',
                to: root('dist/')
            }
        ]),
        ...(
            !devMode
                ? [new webpack.LoaderOptionsPlugin({
                    minimize: true,
                    debug: false
                })]
                : []
        )
    ]
}
