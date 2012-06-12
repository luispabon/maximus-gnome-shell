#=============================================================================
EXTENSION=maximus
EXTENSION_BASE=@mathematical.coffee.gmail.com
FILES=metadata.json extension.js stylesheet.css
#=============================================================================
default_target: all
.PHONY: clean all zip

clean:
	rm -f $(EXTENSION)$(EXTENSION_BASE).zip

# nothing in this target, just make the zip
all:

zip: clean all
	zip -rq $(EXTENSION)$(EXTENSION_BASE).zip $(FILES:%=$(EXTENSION)$(EXTENSION_BASE)/%)

dev-zip: clean all
	zip -rqj $(EXTENSION)$(EXTENSION_BASE).zip $(FILES:%=$(EXTENSION)$(EXTENSION_BASE)/%)
