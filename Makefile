#=============================================================================
UUID=maximus@luis.pabon.auronconsulting.co.uk
FILES=metadata.json *.js stylesheet.css schemas
#=============================================================================
default_target: all
.PHONY: clean all zip

clean:
	rm -f $(UUID).zip $(UUID)/schemas/gschemas.compiled

# compile the schemas
all: clean
	@if [ -d $(UUID)/schemas ]; then \
		glib-compile-schemas $(UUID)/schemas; \
	fi

zip: all
	zip -jrq $(UUID).zip $(FILES:%=$(UUID)/%)

dev-zip: all
	(cd $(UUID); \
		zip -jrq ../$(UUID).zip $(FILES))
