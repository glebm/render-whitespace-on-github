FILES=manifest.json RenderWhitespaceOnGithub.user.js options.html options.js icon128.png
.PHONY: dist
dist: dist/RenderWhitespaceOnGithub-chrome.zip dist/RenderWhitespaceOnGithub-firefox.zip

dist/RenderWhitespaceOnGithub-chrome.zip: $(FILES)
	@mkdir -p dist
	zip dist/RenderWhitespaceOnGithub-chrome.zip \
	  --filesync --latest-time -- $(FILES)

dist/RenderWhitespaceOnGithub-firefox.zip: $(addprefix tmp/firefox/, $(FILES))
	@mkdir -p dist
	cd tmp/firefox/ && zip ../../dist/RenderWhitespaceOnGithub-firefox.zip \
	  --filesync --latest-time -- $(FILES)

tmp/firefox/%: %
	@mkdir -p tmp/firefox
	cp -p $* tmp/firefox/

tmp/firefox/manifest.json: manifest.json firefox-manifest.sed
	@mkdir -p tmp/firefox
	sed -f firefox-manifest.sed manifest.json > tmp/firefox/manifest.json
	touch -r manifest.json tmp/firefox/manifest.json

.PHONY: clean
clean:
	rm -rf dist/ tmp/
