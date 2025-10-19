const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'assets', to: 'assets' }
            ]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'build')
        },
        compress: true,
        port: 8080,
        hot: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
                runtimeErrors: true
            },
            logging: 'info'
        }
    },
    resolve: {
        extensions: ['.js']
    }
};
