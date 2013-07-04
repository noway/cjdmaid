# cjdmaid - cjdns peers manager
                                     __,,_,,..,.
                               ..---\     /   /
                               \  \  \_,./.../
                               `\_.\-'        `.
                                /               \
                               /    _ ____,,.... \
                               | _,-__    ___ .' |
                               \ \ |' |   [' ||   |
                                |`\`--'   '--'/   |
                                |  \    __   /   ,|
                             ~   |  `..___ _.    /
                              ~   |'''''----|'''/
                             ~         /    ;  _,,
                         .__\_/___,, _;__|| ; /
                                  \_|_____/  -._
                                  ,'      .|  `: o_
                                ,'        /    `.  \.
                              ,'.__     _Y'      \   `.
                              :.  '`--./          `.
                                `"-....____ __ __..-
                                      / ,'  | :
                                     |,.'   |.'
                                            ''
## Demonstration
[![Hosted by imgur.com](http://i.imgur.com/UqzvKnN.gif "Hosted by imgur.com")](http://imgur.com/UqzvKnN)


## Features
* Nice CLI with interactivity.
* Keeps all your comments in config. Not just cut them out.
* Can add data to "allowedConnections" and "outgoingConnections" in config too.
* Designed for best User Experience


## Installing

Install node.js: http://nodejs.org/


Install cjdmaid:

Using npm:

    sudo npm install -g cjdmaid

Or from source:

    git clone https://github.com/noway421/cjdmaid.git
    cd cjdmaid
    npm install
    sudo npm link

After launching this commands wait for on-screen instructions.

## Updating

Simple use following command:

    sudo npm -g update cjdmaid

Or if you installed from source:

Get last copy of repo. If you dont do any changes, just use

    git pull origin

then

    npm install
    sudo npm rm cjdmaid
    sudo npm link

## Commands


    Usage: cjdmaid [options] [command]

    Commands:

        addpass                Add authorized password to config.
        addpeer                Add peer to your config.
        outcon                 Add connection to outgoingConnections in config.
        allowcon               Add connection to allowedConnections in config.
        admin                  Execute command in cjdns admin.
        dumptable              Dump whole routing table.
        findnodes              Prints new nodes in routing table.
        ping                   Ping node.
        help [cmd]             display help for [cmd]

    Options:

        -h, --help     output usage information
        -V, --version  output the version number

## Plans

[ToDo.md](ToDo.md)

## LICENSE
    cjdmaid - cjdns peers manager
    Copyright (C) 2013  noway421

    Cjdmaid program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

ascii art above licensed under [![Creative Commons License](http://i.creativecommons.org/l/by-sa/3.0/80x15.png "Creative Commons License")](http://creativecommons.org/licenses/by-sa/3.0/deed.en_US)
