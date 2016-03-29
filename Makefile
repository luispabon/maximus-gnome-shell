#=============================================================================
UUID=$(shell cat src/metadata.json | python -c "import json,sys;obj=json.load(sys.stdin);print obj['uuid'];")
SRCDIR=src
BUILDDIR=build
FILES=metadata.json *.js stylesheet.css schemas
#=============================================================================
default_target: all
.PHONY: clean all zip

clean:
	rm -rf $(BUILDDIR)

# compile the schemas
all: clean
	mkdir -p $(BUILDDIR)/$(UUID)
	cp -r src/* $(BUILDDIR)/$(UUID)
	@if [ -d $(BUILDDIR)/$(UUID)/schemas ]; then \
		glib-compile-schemas $(BUILDDIR)/$(UUID)/schemas; \
	fi

zip: all
	zip -jrq $(BUILDDIR)/$(UUID).zip $(FILES:%=$(BUILDDIR)/$(UUID)/%)
