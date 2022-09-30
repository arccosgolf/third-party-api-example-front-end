const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const webpack = require('webpack');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand').expand;

module.exports = {
    entry: "./src/index.tsx",
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: [/\.jsx?$/, /\.tsx?$/],
                use: ["babel-loader"],
                exclude: /node_modules/,
            },
        ],
    },
    mode: "development",
    devServer: {
        hot: true,
        historyApiFallback: true,
    },
    devtool: "cheap-module-source-map",
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(
                Object.entries({
                    ...dotenvExpand(dotenv.config()).parsed,
                    ...dotenvExpand(dotenv.config({
                        path: `ci/${process.env.ENV || 'iqa'}.env`,
                    })).parsed,
                })
                    .reduce(
                        (acc, [key, value]) => ({
                            ...acc,
                            [key]: value,
                        }),
                        {},
                    ),
            ),
        }),
        new ReactRefreshPlugin(),
        new HtmlWebpackPlugin({template: "./src/index.html.ejs"}),
    ],
};
