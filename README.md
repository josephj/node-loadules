Loadules
========

Loadules generates YUI meta-data and meta-data in PHP.

Any project using YUI should have many customized modules using `YUI.add`.
The YUI build tool, shifter, is not suitable for general purpose, mainly
because of YUI's file layout. It seems that you can only maintain meta-data
manually. It must be annoying if you have a lot of customized YUI modules
in your project. 

Loadules generates YUI meta-data by checking YUI module files in your
local disk. You just need to execute the loadules CLI tool whenever
you create a new YUI module. It will keep your meta-data file up-to-date.

## Install

```
git clone git://github.com/josephj/loadules.git
cd loadules
sudo npm install . -g
```

## Configuration File

You need to provide a configuration so that Loadules can generate meta-data automatically for you.

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

## Usage

```
loadules <config_path>
```

It parses all YUI modules to generate YUI meta-data automatically.

### Sample meta-data 

```
YUI.applyConfig({
    "combine": true,
    "comboBase": "//a.mimgs.com/combo?f=",
    "comboSep": ",",
    "fetchCSS": false,
    "filter": "raw",
    "lang": "",
    "root": "lib/yui3/build/",
    "skin": "miiicasa",
    "groups": {
        "lib": {
            "combine": true,
            "fetchCSS": false,
            "root": "lib/",
            "lang": [
                "en-US",
                "zh-TW",
                "zh-CN",
                "ru-RU"
            ],
            "modules": {...}
        },
        // ... other groups ...
    }
});

```

## Bonus

Loadules can also generate common meta-data in following PHP format.
The following is sample output:

```php
<?php
$config = json_decode('{
    modules: {
        "css": {
            "welcome/_notificaiton": [
                "index/welcome/_notification.css"
            ]
            "common/_sidebar": [
                "index/common/_sidebar.css"
            ]
        }
        "js": {
            "welcome/_notificaiton": [
                "index/welcome/_notification.js"
            ]
        }
    }
}');
?>
```

It would be extremely useful if you write a PHP loader to load static files.
Take the following scenario for example:

* PHP code:

    ```php
    $this->static_loader->set("welcome/_notification", "common/_sidebar");
    echo $this->static_loader->load();
    ```

* Output HTML:

    ```html
    <link rel="stylesheet" type="text/css" href="/combo?f=index/welcome/_notification.css,index/common/_sidebar.css">
    <script src="/combo?g=js"></script><!-- YUI Seed file and customized meta-data -->
    <script>
    YUI().use("welcome/_notifiation"); // Loads module according to YUI meta-data.
    </script>
    ```
