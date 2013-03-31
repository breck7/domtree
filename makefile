dev:
	nodemon app.js

start:
	sudo mon -d -l mon.log -p pid -m mon_pid "node app.js 80"

.PHONY: start dev