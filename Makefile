FILES=manifest.json RenderWhitespaceOnGithub.user.js icon128.png

dist/RenderWhitespaceOnGithub.zip: $(FILES)
	mkdir -p dist
	zip dist/RenderWhitespaceOnGithub.zip \
	  --filesync --latest-time -- $(FILES)

.PHONY: dist
dist: dist/RenderWhitespaceOnGithub.zip

.PHONY: clean
clean:
	rm dist/RenderWhitespaceOnGithub.zip
