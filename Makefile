#=============================================================================
UUID=$(shell cat src/metadata.json | python -c "import json,sys;obj=json.load(sys.stdin);print obj['uuid'];")
SRCDIR=src
BUILDDIR=build
MKFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
MKFILE_DIR := $(dir $(MKFILE_PATH))
ABS_BUILDDIR=$(MKFILE_DIR)$(BUILDDIR)
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
	(cd $(BUILDDIR)/$(UUID); \
         zip -rq $(ABS_BUILDDIR)/$(UUID).zip $(FILES:%=%); \
        );
