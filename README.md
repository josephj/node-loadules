Loadules
========

Loadules generates YUI meta-data and meta-data in PHP.

Any project using YUI should have many customized modules using `YUI.add`.
The YUI build tool, shifter, is not suitable for general purpose, mainly
because of YUI's file layout. It seems that you can only maintain meta-data
manually. It must be annoying if you have a lot of customized YUI modules
in your project.

```
loadules <config_path>
```

It parses all YUI modules to generate YUI meta-data automatically.


## Sample Config.js

```javascript
module.exports = (function () {
    return {
        // Where to find JavaScript & CSS files
        // The last backslash is required.
        "source_paths": [
            "/Users/{USER}/Sites/miiicasa/static/",
            "/home/{USER}/miiicasa/static/"
        ],

        // Path to output YUI metadata.
        "yui_output_path": "/Users/{USER}/Sites/miiicasa/static/index/metadata.js",

        // Path to output metadata in PHP format.
        "php_output_path": "/Users/{USER}/Sites/miiicasa/index/config/metadata.php",

        // Seed JavaScript file
        "seed_js_url": "//a.mimgs.com/combo?g=js",

        // Seed CSS file
        "seed_css_url": "//a.mimgs.com/combo?g=css",

        // Default support languages.
        // This can be override in individual group setting.
        "languages": ["en-US", "zh-TW", "zh-CN", "ru-RU"],

        // Ingores files you don't want to parse.
        "ignore": ["lib/yui3", "lib/yui2", "lang", "yuidocs"],

        // Specifies group path that Loadules collects module information.
        "groups": {
            "lib"       : {"path": "lib/"},
            "mui"       : {"path": "lib/mui/"},
            "common"    : {"path": "index/common/"},
            "my"        : {"path": "index/my/"},
            "share"     : {"path": "index/share/"},
            "space"     : {"path": "index/space/"},
            "welcome"   : {"path": "index/welcome/"}
        },

        // YUI configuration.
        "yui_config": {
            "combine": true,
            "comboBase": "//a.mimgs.com/combo?f=",
            "comboSep": ",",
            "fetchCSS": false,
            "filter": "raw",
            "lang": "",
            "root": "lib/yui3/build/",
            "skin": "miiicasa",
            "groups": {
                "yui2": {
                    "comboSep" : "&",
                    "base":      "http://yui.yahooapis.com/combo?2in3.4/2.9.0/build/",
                    "patterns":  {
                        "yui2-": {
                            "configFn": function (me) {
                                if (/-skin|reset|fonts|grids|base/.test(me.name)) {
                                    me.type = "css";
                                    me.path = me.path.replace(/\.js/, ".css");
                                    me.path = me.path.replace(/\/yui2-skin/, "/assets/skins/sam/yui2-skin");
                                }
                            }
                        }
                    }
                }
            }
        },

        // Unlike JavaScript can specify the dependencies,
        // you must define CSS dependencies here.
        // NOTE - The require list use relative path!
        "modules": {
            "css": {
                "welcome/_notification": [
                    "index/common/_mod_list_box.css",
                    "lib/mui/pagination/assets/pagination-core.css"
                ]
            }
        }
    };
}());

```
