#!/usr/bin/env node
(function () {

    /**
     * Generates metadata configuration files by
     * checking local JavaScript and CSS files.
     *
     * ```
     * loadules [options] <config file>
     * ```
     */

    "use strict";

    var _fs,       // fs module.
        _argv,     // optimist module.
        _loadules, // loadules module.
        _path,     // config file path.
        //===============
        // Constants
        //===============
        DEFAULT_CONFIG = "./config.js";

    // Install required modules.
    _fs = require("fs");
    _loadules = require("../index");
    _argv = require("optimist")
        .usage("Loadules - Generates meta-data for both YUI and PHP.\n\n" +
            "Usage: loadules [options] <config path>")
        .check(function (o) {
            var path = o._[0];
            if (path) {
                if (_fs.existsSync(path)) {
                    _path = path;
                } else {
                    throw new Error("The path you provide doesn't exist.");
                }
            } else {
                if (_fs.existsSync(DEFAULT_CONFIG)) {
                    _path = DEFAULT_CONFIG;
                } else {
                    throw new Error("You must provide a config path.");
                }
            }
        })
        .argv;

    _loadules.exec(_path);

}());
