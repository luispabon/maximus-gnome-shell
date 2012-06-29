#=============================================================================
UUID=maximus@mathematical.coffee.gmail.com
FILES=metadata.json *.js stylesheet.css schemas
#=============================================================================
default_target: all
.PHONY: clean all zip

clean:
	rm -f $(UUID).zip $(UUID)/schemas/gschemas.compiled

# compile the schemas
all:
	@if [ -d $(EXTENSION)$(EXTENSION_BASE)/schemas ]; then \
		glib-compile-schemas $(EXTENSION)$(EXTENSION_BASE)/schemas; \
	fi

zip: all
	zip -rq $(UUID).zip $(FILES:%=$(UUID)/%)

dev-zip: all
	zip -rqj $(UUID).zip $(FILES:%=$(UUID)/%)
	(cd $(UUID); \
		zip -rq ../$(UUID).zip $(FILES))
