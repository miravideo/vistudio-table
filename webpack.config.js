const webpack = require('webpack')
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const os = require('os')
const RemoveSourceMapUrlWebpackPlugin = require('@rbarilani/remove-source-map-url-webpack-plugin');
const base = __dirname;

function getBuild() {
    var date = new Date();
    return `${date.getMonth()+1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
}

const plugins = [
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
];

if (process.env.NODE_ENV === 'production') {
    plugins.push(new RemoveSourceMapUrlWebpackPlugin({
        test: /.*\.js$/
    }));
}

module.exports = {
    entry: {
        'mira-table': ['./src/index.js'],
    },
    output: {
        filename: process.env.NODE_ENV === 'production' ? '[name].min.js' : '[name].js',
        path: path.resolve(base, 'dst'),
        library: 'miratable',
        libraryTarget: 'window',
        libraryExport: 'default'
    },
    resolve: {
        // 自动补全的扩展名
        extensions: ['.js', '.jsx', '.ts'],
        fallback: {
	    }
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: { presets: ["@babel/env"] }
            },
            {
                test: /\.css$/,
                use: [
                    { loader: "style-loader", options: { attributes: { mira: "table" } } },
                    'css-loader',
                ]
            },
            {
                test: /\.less$/,
                use: [
                    { loader: "style-loader", options: { attributes: { mira: "table" } } },
                    'css-loader',
                    'less-loader',
                ]
            }
        ]
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
    },
    plugins,
    watchOptions: {
        ignored: /dist/
    },
    externals: [
    ],
};
