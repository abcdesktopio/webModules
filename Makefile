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

ifndef NODE_MAJOR
NODE_MAJOR=20
endif

ifndef BRANCH
# display only the name of the current branch we are on
BRANCH=$(shell git rev-parse --abbrev-ref HEAD)
endif


ifndef IMAGETAG
IMAGETAG=3.3
endif


all: version prod

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


oc.nginx.builder:
	echo NODE_VERSION=$(NODE_MAJOR)
	docker build --no-cache --build-arg BASE_IMAGE_RELEASE=latest --build-arg BASE_IMAGE=ubuntu --build-arg BRANCH=$(BRANCH) --build-arg NODE_MAJOR=$(NODE_MAJOR)\
	       -t abcdesktopio/oc.nginx.builder:$(IMAGETAG) -f Dockerfile.builder .

oc.nginx:
	docker build --build-arg BASE_IMAGE_RELEASE=3.3 --build-arg BASE_IMAGE=abcdesktopio/oc.nginx.builder --build-arg BRANCH=$(BRANCH) --build-arg NODE_MAJOR=$(NODE_VERSION) \
	-t abcdesktopio/oc.nginx:$(IMAGETAG) -f Dockerfile .


checkTranspile:
	if [ ! -d "./transpile/node_modules" ]; then \
		cd ./transpile && npm install; \
	fi

install:
	npm install && npm update && npm audit fix
	cd transpile && npm install && npm update && npm audit fix
	cp "node_modules/@cycjimmy/jsmpeg-player/dist/jsmpeg-player.esm.js" ./js
	cd js/noVNC && npm install && npm update && npm audit fix

svg:
	cd ./transpile && node index.js --svg

css: checkTranspile
	cd ./transpile && node index.js --css

ui:
	cd ./transpile && node index.js --user-interface

oneCss: checkTranspile
	cd ./transpile && node index.js --oneCss

uiAndAssets: checkTranspile
	cd ./transpile && node index.js --svg --css --user-interface

prodWithoutVersion: checkTranspile
	cd ./transpile && node index.js --svg --css --user-interface --prod

prod: checkTranspile version
	cd ./transpile && node index.js --svg --css --user-interface --prod 

dev: uiAndAssets version

updatejs:
	echo "no need to run this command anymore"
	# rm  js/ua-parser.min.js | true
	# wget -O js/ua-parser.min.js https://raw.githubusercontent.com/faisalman/ua-parser-js/master/dist/ua-parser.min.js


clean:
	rm -rf transpile/node_modules | true
	rm -rf ./utils/node_modules | true
	rm -rf css/css-dist | true
	rm -rf build | true
	rm -f app.html | true
	rm -f app.js | true
	rm -f index.html | true


removebuildtools:
	rm -rf .eslintrc.json .git .github .gitignore Dockerfile* Makefile transpile *.sh
