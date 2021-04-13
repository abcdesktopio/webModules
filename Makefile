NODE_VERSION   := $(shell node -v 2>/dev/null | awk -F "." '{print $$1}' | tr -d 'v')
LESS_VERSION   := $(shell lessc -v 2>/dev/null | awk -F "." '{print $$1}' | awk -F " " '{print $$2}')

ifneq ($(shell test $(NODE_VERSION) -ge 1 2>/dev/null; echo $$?), 0)
$(error Please you need to install nodejs, version 13.X or higher)
endif

ifneq ($(shell test $(LESS_VERSION) -ge 3 2>/dev/null; echo $$?), 0)
$(info Please ${LESS_VERSION} you need to install less, version 3.X or higher)
$(error You can install it by running `npm install --global less`)
endif

ifndef VERBOSE
.SILENT:
endif

all: version xterm prod

version:
	$(shell ./mkversion.sh)

help:
	@echo "Please always use '-B' flag on make when you use this Makefile."
	@echo "version        : Get commit version."
	@echo "xterm          : Build xterm."
	@echo "svg            : Change svg @tertiary color with the transpile @tertiary color configuration."
	@echo "css            : Transpile all less files in css."
	@echo "ui             : Transpile mustache file into all generated html file."
	@echo "oneCss         : Create one css file minified and use it in html instead of all css files."
	@echo "prod           : Build xterm, create one css minified, use it in index.html, change svg @tertiary color."
	@echo "clean          : Remove all transpiled css and minified js, and remove [node_modules] from user-interfaces [transpile, xterm, utils]."

checkTranspile:
	if [ ! -d "./transpile/node_modules" ]; then \
		cd ./transpile && yarn install; \
	fi

xterm:
	echo "Build xterm..."
	if [ ! -d "./xterm/node_modules" ]; then \
		cd ./xterm && yarn install && node build.js; \
	else \
		cd ./xterm && node build.js; \
	fi

svg:
	cd ./transpile && node index.js --svg

css: checkTranspile
	cd ./transpile && node index.js --css

ui:
	cd ./transpile && node index.js --user-interface

oneCss: checkTranspile
	cd ./transpile && node index.js --oneCss

prod: updatejs checkTranspile version
	if [ ! -d "./xterm/dist" ]; then \
		$(MAKE) -B xterm; \
	fi

	cd ./transpile \
	&& node index.js --svg --css --user-interface --prod \

dev: updatejs checkTranspile version
	if [ ! -d "./xterm/dist" ]; then \
		$(MAKE) -B xterm; \
	fi

	cd ./transpile \
	&& node index.js --svg --css --user-interface


updatejs:
	rm  js/ua-parser.min.js | true
	wget -O js/ua-parser.min.js https://raw.githubusercontent.com/faisalman/ua-parser-js/master/dist/ua-parser.min.js


clean:
	rm -rf transpile/node_modules | true
	rm -rf xterm/node_modules | true
	rm -rf ./utils/node_modules | true
	rm -rf xterm/dist | true
	rm -rf css/css-dist | true
	rm -rf build | true
	rm -f app.html | true
	rm -f app.js | true
	rm -f index.html | true
