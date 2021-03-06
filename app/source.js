"use strict";

const browserify = require("browserify");
const through = require("through2");
const Q = require("q");
const lodash = require("lodash");

function _browserifyListBundledFiles(entryPointPath) {
    return Q.Promise(function(resolve, reject) {
        var files = [];
        var b = browserify();
        b.add(entryPointPath);
        b.pipeline.get("deps").push(through.obj(function(row, enc, next) {
            files.push(row.file);
            next();
        }));
        b.bundle(function(error, buffer) {
            if (error) {
                reject(error);
            } else {
                resolve(files);
            }
        });
    });
}

function _fileListToModule(files) {
    var modules = [];
    var modulePaths = {};
    for (let i = 0 ; i < files.length ; i++) {
        if (files[i].indexOf("node_modules") < 0) {
            continue;
        }
        let file = files[i];
        let module = {
            name: file.replace(/^(.*node_modules\/([^/]+)\/).*$/, "$2"),
            path: file.replace(/^(.*node_modules\/([^/]+)\/).*$/, "$1"),
            version: null,
            license: null,
            licenseFile: null,
            licenseText: null
        };
        if (!modulePaths[module.path]) {
            modulePaths[module.path] = true;
            modules.push(module);
        }
    }
    return lodash.sortBy(modules, "name");
}

function sourceBrowserify(entryPointPath) {
    return Q(entryPointPath)
        .then(_browserifyListBundledFiles)
        .then(_fileListToModule);
}

module.exports = {
    browserify: sourceBrowserify
};
