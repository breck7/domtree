dev:
	nodemon app.js

start:
	sudo mon -d -l mon.log -p pid -m monpid "node app.js 80"

stop:
	sudo kill `sudo cat monpid`

.PHONY: start dev