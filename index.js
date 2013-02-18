/*global module */
module.exports = (function () {

    "use strict";

    var _config,    // Config file.
        _current,   // Current YUI module.
        _cconsole,  // Colorize console.
        _execSync,  // exec-sync module.
        _hashish,   // Hashish module.
        _fs,        // fs module.
        _yuiConfig, // YUI config being output.
        _phpConfig, // PHP config being output.
        //==============
        // Methods
        //==============
        _getModuleName,
        _findFiles,
        exec;

    _cconsole = require("colorize").console;
    _current  = {};
    _execSync = require("exec-sync");
    _fs       = require("fs");

    // Fetches YUI module configuration by making a fake YUI.add method.
    GLOBAL.YUI = function () {
        return {
            use: function () {}
        }
    };
    YUI.add = function (name, callback, version, config) {
        _current.name = name;
        if (!config) {
            return;
        }

        // Append each property to the new object.
        for (var i in config) {
            if (config.hasOwnProperty(i)) {
                _current[i] = config[i];
            }
        }
    };

    /**
     * Gets suggested module name by provided path.
     *
     * @method _getModuleName
     * @private
     * @param path {String} Relative path.
     * @param groupName {String} Group name.
     * @return {String} Suggested module name.
     */
    _getModuleName = function (path, groupName) {
        var segments,
            length,
            path,
            moduleName;

        moduleName = path.substr(path.indexOf(groupName) + groupName.length + 1);
        moduleName = moduleName.substring(0, moduleName.lastIndexOf("."));

        if (moduleName.indexOf("/")) {
            segments = moduleName.split("/");
            length = segments.length;
            if (segments[length - 1] === segments[length - 2]) {
                moduleName = segments[length -1];
            }
        }

        if (moduleName.indexOf(groupName) !== 0) {
            moduleName = groupName + "/" + moduleName;
        }

        return moduleName;
    };

    /**
     * Finds matched files.
     *
     * @method _findFiles
     * @private
     * @param path {String} Base path to search.
     * @param pattern {String} Matching pattern.
     * @param options {Object} Valid fields including `ignores` and `cmds`.
     * @return {Array} Matched file list.
     */
    _findFiles = function (path, pattern, options) {
        var cmd,
            files,
            i;

        options = options || {};

        // Remove unecessary backslash if it exists.
        if (path.lastIndexOf("/") === path.length - 1) {
            path = path.substr(0, path.length - 1);
        }

        // Composes corresponded command to find matched files.
        cmd = ["find " + path + " -type f -name '" + pattern + "'"];

        // Get ignore command using grep.
        if (options.ignores && options.ignores.length) {
            for (i in options.ignores) {
                if (options.ignores.hasOwnProperty(i)) {
                    cmd.push("grep -v '" + options.ignores[i] + "'");
                }
            }
        }

        // Add extra commands.
        if (options.cmds && options.cmds.length) {
            for (i in options.cmds) {
                if (options.cmds.hasOwnProperty(i)) {
                    cmd.push(options.cmds[i]);
                }
            }
        }

        cmd.push("cut -d: -f1");
        files = _execSync(cmd.join("|"));
        files = files.split("\n");
        return files;
    };

    exec = function (path) {

        var modules,    // Metadata cache.
            files,      // Matches files by _findFiles.
            newIgnore,
            output,
            // The following is from config.
            groups,
            ignore,
            sourcePaths,
            // The following is for iteration.
            sourcePath, // source path.
            group,      // group.
            groupName,  // group name.
            groupPath,  // group path.
            moduleName, // module name.
            path,       // file path.
            realName,   // real module name.
            i,          // source offset.
            j,          // file offset.
            k;

        _config     = require(path);

        groups      = _config.groups,
        ignore      = _config.ignore,
        sourcePaths = _config.source_paths,
        modules     = {
            "css": {},
            "js" : {},
            "yui": {}
        };

        for (i in sourcePaths) {

            // Checks if source path exists.
            sourcePath = sourcePaths[i].replace("{USER}", process.env.USER);
            if (!_fs.existsSync(sourcePath)) {
                continue;
            }

            // Checks group path.
            for (groupName in groups) {

                // Check if group path exists.
                group = groups[groupName];
                groupPath = sourcePath + group.path;
                if (!_fs.existsSync(groupPath)) {
                    continue;
                }

                // Check if this group has sub group, need to ignore it.
                newIgnore = [].concat(ignore);
                for (k in groups) {
                    if (k === groupName) {
                        continue;
                    }
                    if (groups[k].path.indexOf(group.path) === 0) {
                        newIgnore.push(groups[k].path);
                    }
                }

                _cconsole.log("#green[INFO] Collecting module infomation in '" +
                    groupName + "' group...");

                // Finds all CSS files.
                files = _findFiles(groupPath, "*.css", {"ignores": newIgnore});
                for (j in files) {
                    path = files[j].replace(sourcePath, "");
                    moduleName = _getModuleName(path, groupName);
                    if (path) {
                        if (modules.css.hasOwnProperty(moduleName)) {
                            _cconsole.log("#red[ERROR] '" + moduleName +
                                "' module has already existed. ");
                        }
                        modules.css[moduleName] = [path];
                    }
                }

                // Finds all JavaScript files.
                files = _findFiles(groupPath, "*.js", {"ignores": newIgnore});
                for (j in files) {
                    path = files[j].replace(sourcePath, "");
                    moduleName = _getModuleName(path, groupName);
                    if (path) {
                        if (modules.js.hasOwnProperty(moduleName)) {
                            _cconsole.log("#red[ERROR] '" + moduleName +
                                "' module has already existed. ");
                        }
                        modules.js[moduleName] = [path];
                    }
                }

                // Finds YUI JavaScript modules.
                files = _findFiles(groupPath, "*.js", {
                    "ignores": newIgnore,
                    "cmds": ["xargs grep 'YUI.add'"]
                });
                for (j in files) {
                    path = files[j];
                    moduleName = _getModuleName(path, groupName);

                    // Avoids to check for directory.
                    if (!moduleName) {
                        continue;
                    }

                    // Lets YUI.add we defined above to get required modules.
                    try {
                        require(path);
                    } catch (e) {
                        // It might cause error inside, just ignores it.
                        continue;
                    }

                    // Shows warning if module name is not illegal.
                    realName = _current.name;
                    if (realName !== moduleName) {
                        _cconsole.log([
                            "#magenta[WARN] ",
                            "You shoule rename '#yellow[" + realName,
                            "]' to '#yellow[" + moduleName + "]'."
                        ].join(""));
                        _cconsole.log("    #white[" + path + "]");
                    }
                    if (
                        modules.yui[groupName] &&
                        modules.yui[groupName].modules &&
                        modules.yui[groupName].modules[realName]
                    ) {
                        _cconsole.log([
                            "#red[ERROR] `" + realName + "` module exists. ",
                            "It has been overwritten. ",
                            "Please fix it to prevent this error."
                        ].join(""));
                        _cconsole.log("    " + path);
                    }

                    path = path.replace(groupPath, "");
                    if (!modules.yui[groupName]) {
                        modules.yui[groupName] = {
                            combine: (group.combine) ? group.combine : true,
                            fetchCSS: (group.fetchCSS) ? group.fetchCSS : false,
                            root: group.path,
                            lang: group.lang || _config.languages,
                            modules: {}
                        };
                    }
                    modules.yui[groupName].modules[realName] = {path: path};
                    if (_current.requires) {
                        modules.yui[groupName].modules[realName].requires = _current.requires;
                    }
                    _current = {};
                }
                delete groups[groupName];
            } // End of groups.
        } // End of sourcePaths.

        // Outputs YUI config.
        _yuiConfig = _config.yui_config;
        _yuiConfig.groups = modules["yui"];
        output = [
            "/**",
            " * This file is generated by Loadules CLI tool.",
            " * Execute Loadules CLI tool instead of modifying manually.",
            " * ",
            " * $ loadules <config file>",
            " */",
            "YUI.applyConfig(" + JSON.stringify(_yuiConfig, null, 4) + ");"
        ].join("\n");
        _fs.writeFileSync(
            _config.yui_output_path.replace("{USER}", process.env.USER),
            output
        );
        _cconsole.log("#green[INFO] Output YUI metadata: \n    #bold[" +
            _config.yui_output_path.replace("{USER}", process.env.USER) + "]"
        );

        // Outputs PHP config.
        delete modules.yui;
        _phpConfig = modules;
        output = [
            "<?php",
            "/**",
            " * This file is generated by Loadules CLI tool.",
            " * Execute Loadules CLI tool instead of modifying manually.",
            " * ",
            " * $ loadules <config file>",
            " */",
            "",
            "$config[\"modules\"] = json_decode('" + JSON.stringify(_phpConfig, null, 4) + "');",
            "?>"
        ].join("\n");
        _fs.writeFileSync(
            _config.php_output_path.replace("{USER}", process.env.USER),
            output
        );
        _cconsole.log("#green[INFO] Output PHP Metadata: \n    #bold[" +
            _config.php_output_path.replace("{USER}", process.env.USER) + "]"
        );
    };

    return {
        exec: exec
    };

}());
